import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSpotifyStore } from '@/features/spotify-integration/stores/spotifyStore'
import { TournamentService } from '../services/tournamentService'
import type {
  Tournament,
  TournamentProgress,
  TournamentCreateRequest
} from '../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

export const useTournamentStore = defineStore('tournament', () => {
  // State
  const tournaments = ref<Tournament[]>([])
  const activeTournament = ref<Tournament | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const activeTournaments = computed(() =>
    tournaments.value.filter(t => t.status === 'active')
  )

  const completedTournaments = computed(() =>
    tournaments.value.filter(t => t.status === 'completed')
  )

  const tournamentsCount = computed(() => tournaments.value.length)

  const canCreateTournament = computed(() => {
    const spotifyStore = useSpotifyStore()
    return spotifyStore.isAuthenticated && !isLoading.value
  })

  // Actions
  const initializeTournaments = (): void => {
    loadFromStorage()
  }

  const createTournament = async (request: TournamentCreateRequest): Promise<Tournament> => {
    if (!canCreateTournament.value) {
      throw new Error('Cannot create tournament at this time')
    }

    if (request.tracks.length < 2) {
      throw new Error('Tournament must have at least 2 tracks')
    }

    isLoading.value = true
    error.value = null

    try {
      const tournament: Tournament = {
        id: generateId(),
        name: request.playlistName,
        playlistId: request.playlistId,
        status: 'active',
        tracks: [...request.tracks],
        battles: [],
        createdAt: new Date(),
        progress: calculateInitialProgress(request.tracks)
      }

      tournaments.value.push(tournament)
      activeTournament.value = tournament

      await saveToStorage()
      return tournament

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create tournament'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const continueTournament = (tournamentId: string): Tournament => {
    const tournament = tournaments.value.find(t => t.id === tournamentId)

    if (!tournament) {
      throw new Error('Tournament not found')
    }

    if (tournament.status === 'completed') {
      throw new Error('Tournament is already completed')
    }

    activeTournament.value = tournament
    return tournament
  }

  const onBattleCompleted = async (battle: Battle): Promise<void> => {
    if (!activeTournament.value || !battle.winner) {
      return
    }

    const tournament = activeTournament.value

    // Add battle to tournament history
    tournament.battles.push(battle)
    tournament.lastBattleAt = new Date()

    // Update tournament progress
    updateTournamentProgress(tournament, battle)

    // Check if tournament is completed
    if (TournamentService.shouldCompleteTournament(tournament)) {
      completeTournament(tournament)
    }

    await saveToStorage()
  }

  const pauseTournament = async (tournamentId: string): Promise<void> => {
    const tournament = tournaments.value.find(t => t.id === tournamentId)

    if (tournament && tournament.status === 'active') {
      tournament.status = 'paused'
      await saveToStorage()
    }
  }

  const resumeTournament = async (tournamentId: string): Promise<void> => {
    const tournament = tournaments.value.find(t => t.id === tournamentId)

    if (tournament && tournament.status === 'paused') {
      tournament.status = 'active'
      await saveToStorage()
    }
  }

  const deleteTournament = async (tournamentId: string): Promise<void> => {
    const index = tournaments.value.findIndex(t => t.id === tournamentId)

    if (index !== -1) {
      if (activeTournament.value?.id === tournamentId) {
        activeTournament.value = null
      }

      tournaments.value.splice(index, 1)
      await saveToStorage()
    }
  }

  const getNextMatchup = (tournament: Tournament): { trackA: SpotifyTrack; trackB: SpotifyTrack } | null => {
    return TournamentService.getNextMatchup(tournament)
  }

  const resetTournamentData = async (): Promise<void> => {
    tournaments.value = []
    activeTournament.value = null
    error.value = null
    await clearStorage()
  }

  // Helper functions
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const calculateInitialProgress = (tracks: SpotifyTrack[]): TournamentProgress => {
    return TournamentService.calculateInitialProgress(tracks)
  }

  const updateTournamentProgress = (tournament: Tournament, completedBattle: Battle): void => {
    TournamentService.updateTournamentProgress(tournament, completedBattle)
  }

  const completeTournament = (tournament: Tournament): void => {
    TournamentService.completeTournament(tournament)
  }

  const saveToStorage = async (): Promise<void> => {
    try {
      const data = {
        tournaments: tournaments.value,
        activeTournamentId: activeTournament.value?.id,
        timestamp: Date.now()
      }
      localStorage.setItem('tournament_data', JSON.stringify(data))
    } catch (err) {
      console.warn('Failed to save tournament data to storage:', err)
    }
  }

  const loadFromStorage = (): void => {
    try {
      const stored = localStorage.getItem('tournament_data')
      if (!stored) return

      const data = JSON.parse(stored)

      // Check if data is recent (within 30 days)
      const isRecent = data.timestamp && (Date.now() - data.timestamp) < 30 * 24 * 60 * 60 * 1000

      if (isRecent) {
        tournaments.value = data.tournaments || []

        if (data.activeTournamentId) {
          activeTournament.value = tournaments.value.find(t => t.id === data.activeTournamentId) || null
        }
      }
    } catch (err) {
      console.warn('Failed to load tournament data from storage:', err)
    }
  }

  const clearStorage = async (): Promise<void> => {
    localStorage.removeItem('tournament_data')
  }

  const clearError = (): void => {
    error.value = null
  }

  return {
    // State
    tournaments: computed(() => tournaments.value),
    activeTournament: computed(() => activeTournament.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    activeTournaments,
    completedTournaments,
    tournamentsCount,
    canCreateTournament,

    // Actions
    initializeTournaments,
    createTournament,
    continueTournament,
    onBattleCompleted,
    pauseTournament,
    resumeTournament,
    deleteTournament,
    getNextMatchup,
    resetTournamentData,
    clearError
  }
})
