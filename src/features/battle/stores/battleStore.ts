import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSpotifyStore } from '@/features/spotify-integration/stores/spotifyStore'
import { TrackParsingService } from '@/features/spotify-integration/services/trackParsingService'
import { battleTournamentService } from '../services/battleTournamentService'
import type { Battle, BattleVote, TrackStats, LeaderboardEntry, BattleSession } from '../types/battle.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

export const useBattleStore = defineStore('battle', () => {
  // State
  const currentBattle = ref<Battle | null>(null)
  const battleHistory = ref<Battle[]>([])
  const availableTracks = ref<SpotifyTrack[]>([])
  const trackStats = ref<Map<string, TrackStats>>(new Map())
  const currentSession = ref<BattleSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const leaderboard = computed<LeaderboardEntry[]>(() => {
    const entries = Array.from(trackStats.value.values())
      .map((stats, index) => ({
        rank: index + 1,
        track: stats.track,
        stats,
        score: calculateTrackScore(stats),
        change: 0 // TODO: Calculate based on previous rankings
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    return entries
  })

  const battleCount = computed(() => battleHistory.value.length)

  const canStartBattle = computed(() => {
    return availableTracks.value.length >= 2 && !currentBattle.value
  })

  // Actions
  const initializeBattle = (): void => {
    // Load data from localStorage
    loadFromStorage()
  }

  const loadTracksFromPlaylist = async (playlistId: string): Promise<SpotifyTrack[]> => {
    const spotifyStore = useSpotifyStore()

    if (!spotifyStore.isAuthenticated) {
      throw new Error('User not authenticated with Spotify')
    }

    isLoading.value = true
    error.value = null

    try {
      const tracks = await spotifyStore.getPlaylistTracks(playlistId)

      if (tracks.length < 2) {
        throw new Error('Playlist must have at least 2 tracks with preview available')
      }

      availableTracks.value = tracks

      // Initialize track stats for new tracks
      tracks.forEach(track => {
        if (!trackStats.value.has(track.id)) {
          trackStats.value.set(track.id, {
            trackId: track.id,
            track,
            wins: 0,
            losses: 0,
            totalBattles: 0,
            winRate: 0,
            lastBattleAt: new Date()
          })
        }
      })

      saveToStorage()
      return tracks
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tracks'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadTrackFromUrl = async (spotifyUrl: string): Promise<SpotifyTrack> => {
    const spotifyStore = useSpotifyStore()

    if (!spotifyStore.isAuthenticated) {
      throw new Error('User not authenticated with Spotify')
    }

    const trackId = TrackParsingService.extractTrackId(spotifyUrl)

    if (!trackId) {
      throw new Error('Invalid Spotify track URL')
    }

    try {
      const track = await spotifyStore.getTrackById(trackId)

      if (!track.preview_url) {
        throw new Error('Track has no preview available')
      }

      // Add track if not already present
      const existingTrack = availableTracks.value.find(t => t.id === track.id)
      if (!existingTrack) {
        availableTracks.value.push(track)

        // Initialize track stats
        if (!trackStats.value.has(track.id)) {
          trackStats.value.set(track.id, {
            trackId: track.id,
            track,
            wins: 0,
            losses: 0,
            totalBattles: 0,
            winRate: 0,
            lastBattleAt: new Date()
          })
        }

        saveToStorage()
      }

      return track
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load track'
      throw err
    }
  }

  const startNewBattle = (): Battle => {
    // Check if we should get tracks from tournament
    const tournamentTracks = battleTournamentService.getTournamentBattlePair()

    let trackA: SpotifyTrack
    let trackB: SpotifyTrack

    if (tournamentTracks) {
      // Use tournament tracks
      [trackA, trackB] = tournamentTracks
      console.log('🎵 Starting tournament battle:', {
        trackA: trackA.name,
        trackB: trackB.name,
        tournamentActive: battleTournamentService.hasActiveTournament()
      })
    } else {
      // Use available tracks for regular battle
      if (availableTracks.value.length < 2) {
        throw new Error('Need at least 2 tracks to start a battle')
      }

      const shuffled = [...availableTracks.value].sort(() => Math.random() - 0.5)
      trackA = shuffled[0]
      trackB = shuffled[1]
      console.log('🎵 Starting regular battle:', { trackA: trackA.name, trackB: trackB.name })
    }

    // ✅ FIX: Clear any existing completed battle before starting new one
    if (currentBattle.value?.winner) {
      currentBattle.value = null
    }

    if (currentBattle.value) {
      throw new Error('A battle is already in progress')
    }

    const battle: Battle = {
      id: generateId(),
      trackA,
      trackB,
      votes: [],
      winner: null,
      createdAt: new Date()
    }

    currentBattle.value = battle
    return battle
  }

  const voteForTrack = (trackId: string): void => {
    if (!currentBattle.value) {
      throw new Error('No active battle')
    }

    if (currentBattle.value.winner) {
      throw new Error('Battle already completed')
    }

    const vote: BattleVote = {
      id: generateId(),
      trackId,
      timestamp: new Date(),
      userId: 'anonymous' // Could be user ID when auth is implemented
    }

    // Add vote to current battle
    currentBattle.value.votes.push(vote)
    currentBattle.value.winner = trackId
    currentBattle.value.completedAt = new Date()

    // Update track statistics
    const winnerTrackId = trackId
    const loserTrackId = currentBattle.value.trackA.id === trackId
      ? currentBattle.value.trackB.id
      : currentBattle.value.trackA.id

    updateTrackStats(winnerTrackId, 'win')
    updateTrackStats(loserTrackId, 'loss')

    // Save to history
    battleHistory.value.push({ ...currentBattle.value })

    // ✅ NEW: Notify tournament store about completed battle
    console.log('🎵 Battle completed:', {
      winner: trackId,
      tournamentActive: battleTournamentService.hasActiveTournament()
    })
    battleTournamentService.notifyBattleCompletion(currentBattle.value)

    // ✅ FIX: Don't clear current battle immediately
    // Keep the battle with winner to show results
    // It will be cleared when starting next battle

    // Save to storage
    saveToStorage()
  }

  const skipBattle = (): void => {
    if (currentBattle.value) {
      // Don't save skipped battles to history
      currentBattle.value = null
    }
  }

  const updateTrackStats = (trackId: string, result: 'win' | 'loss'): void => {
    const stats = trackStats.value.get(trackId)
    if (!stats) return

    if (result === 'win') {
      stats.wins++
    } else {
      stats.losses++
    }

    stats.totalBattles = stats.wins + stats.losses
    stats.winRate = stats.totalBattles > 0 ? (stats.wins / stats.totalBattles) * 100 : 0
    stats.lastBattleAt = new Date()

    trackStats.value.set(trackId, stats)
  }

  const resetBattleData = (): void => {
    currentBattle.value = null
    battleHistory.value = []
    trackStats.value.clear()
    availableTracks.value = []
    error.value = null

    clearStorage()
  }

  const removeTrack = (trackId: string): void => {
    availableTracks.value = availableTracks.value.filter(track => track.id !== trackId)
    trackStats.value.delete(trackId)
    saveToStorage()
  }

  // Helper functions
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const calculateTrackScore = (stats: TrackStats): number => {
    // ELO-like scoring system
    const baseScore = 1000
    const winBonus = stats.wins * 50
    const losspenalty = stats.losses * 25
    const participationBonus = stats.totalBattles * 10

    return Math.max(0, baseScore + winBonus - losspenalty + participationBonus)
  }

  const saveToStorage = (): void => {
    try {
      const data = {
        battleHistory: battleHistory.value,
        trackStats: Array.from(trackStats.value.entries()),
        availableTracks: availableTracks.value,
        timestamp: Date.now()
      }
      localStorage.setItem('battle_data', JSON.stringify(data))
    } catch (err) {
      console.warn('Failed to save battle data to storage:', err)
    }
  }

  const loadFromStorage = (): void => {
    try {
      const stored = localStorage.getItem('battle_data')
      if (!stored) return

      const data = JSON.parse(stored)

      // Check if data is recent (within 7 days)
      const isRecent = data.timestamp && (Date.now() - data.timestamp) < 7 * 24 * 60 * 60 * 1000

      if (isRecent) {
        battleHistory.value = data.battleHistory || []
        availableTracks.value = data.availableTracks || []

        if (data.trackStats) {
          trackStats.value = new Map(data.trackStats)
        }
      }
    } catch (err) {
      console.warn('Failed to load battle data from storage:', err)
    }
  }

  const clearStorage = (): void => {
    localStorage.removeItem('battle_data')
  }

  const clearError = (): void => {
    error.value = null
  }

  return {
    // State
    currentBattle: computed(() => currentBattle.value),
    battleHistory: computed(() => battleHistory.value),
    availableTracks: computed(() => availableTracks.value),
    trackStats: computed(() => trackStats.value),
    currentSession: computed(() => currentSession.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    leaderboard,
    battleCount,
    canStartBattle,

    // Actions
    initializeBattle,
    loadTracksFromPlaylist,
    loadTrackFromUrl,
    startNewBattle,
    voteForTrack,
    skipBattle,
    resetBattleData,
    removeTrack,
    clearError
  }
})
