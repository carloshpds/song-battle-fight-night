import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSpotifyStore } from '@/features/spotify-integration/stores/spotifyStore'
import { battleTournamentService } from '@/features/battle/services/battleTournamentService'
import { TournamentStrategyFactory } from '../strategies/TournamentStrategyFactory'
import type {
  Tournament,
  TournamentCreateRequest
} from '../types/tournament.types'
import type { TournamentMode } from '../strategies/base/StrategyTypes'
import type { BattleMatchup } from '../strategies/base/TournamentStrategy.interface'
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

    const mode = request.mode || 'elimination'
    const strategy = TournamentStrategyFactory.getStrategy(mode)

    if (!strategy.validateTracks(request.tracks)) {
      throw new Error(`Insufficient tracks for ${strategy.name} mode. Minimum required: ${strategy.config.requireMinimumTracks}`)
    }

    isLoading.value = true
    error.value = null

    try {
      const tournament: Tournament = {
        id: generateId(),
        name: request.playlistName,
        playlistId: request.playlistId,
        status: 'active',
        mode,
        modeConfig: {
          mode,
          parameters: request.modeConfig?.parameters || {}
        },
        tracks: [...request.tracks],
        battles: [],
        createdAt: new Date(),
        progress: strategy.initializeTournament(request.tracks),
        strategyData: {}
      }

      // ✅ FIX: Initialize strategy-specific data after tournament creation
      // This ensures the strategy has access to the tournament object to initialize its data
      strategy.getStrategyData(tournament)

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

  const getTournamentById = (tournamentId: string): Tournament | null => {
    return tournaments.value.find(t => t.id === tournamentId) || null
  }

  const continueTournament = (tournamentId: string): Tournament => {
    const tournament = getTournamentById(tournamentId)

    if (!tournament) {
      throw new Error('Tournament not found')
    }

    if (tournament.status === 'completed') {
      throw new Error('Tournament is already completed')
    }

    activeTournament.value = tournament

    saveToStorage()
    return tournament
  }

  const onBattleCompleted = async (battle: Battle): Promise<void> => {
    if (!activeTournament.value || !battle.winner) {
      return
    }

    const tournament = activeTournament.value
    const strategy = TournamentStrategyFactory.getStrategy(tournament.mode)

    console.log('🏆 Tournament battle completed:', {
      winner: battle.winner,
      mode: tournament.mode,
      remainingTracks: tournament.progress.remainingTracks.length,
      eliminatedTracks: tournament.progress.eliminatedTracks.length
    })

    // Add battle to tournament history
    tournament.battles.push(battle)
    tournament.lastBattleAt = new Date()

    // Update tournament progress using strategy
    tournament.progress = strategy.updateProgress(tournament, battle)

    console.log('🏆 Tournament updated:', {
      remainingTracks: tournament.progress.remainingTracks.length,
      eliminatedTracks: tournament.progress.eliminatedTracks.length,
      currentRound: tournament.progress.currentRound
    })

    // Check if tournament is completed using strategy
    if (strategy.isCompleted(tournament)) {
      activeTournament.value = strategy.completeTournament(tournament)
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

  const getNextMatchup = (tournament: Tournament): BattleMatchup | null => {
    const strategy = TournamentStrategyFactory.getStrategy(tournament.mode)
    return strategy.getNextMatchup(tournament)
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

  // New strategy-related methods
  const getAvailableModes = (): Array<{ mode: TournamentMode; name: string; description: string }> => {
    return TournamentStrategyFactory.getAvailableModes().map(mode => ({
      mode,
      ...TournamentStrategyFactory.getModeInfo(mode)!
    }))
  }

  const getTournamentStrategy = (tournament: Tournament) => {
    return TournamentStrategyFactory.getStrategy(tournament.mode)
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
        // Migrate old tournaments to new format
        const migratedTournaments = (data.tournaments || []).map((tournament: any) => {
          // If tournament doesn't have mode, assume it's elimination (legacy)
          if (!tournament.mode) {
            tournament.mode = 'elimination'
            tournament.modeConfig = { mode: 'elimination', parameters: {} }
            tournament.strategyData = {}
          }

          // Ensure strategyData exists
          if (!tournament.strategyData) {
            tournament.strategyData = {}
          }

          // ✅ FIX: Initialize strategy data for migrated tournaments if needed
          // This ensures that old tournaments have their strategy data properly initialized
          if (tournament.status === 'active' && Object.keys(tournament.strategyData).length === 0) {
            try {
              const strategy = TournamentStrategyFactory.getStrategy(tournament.mode)
              strategy.getStrategyData(tournament)
            } catch (error) {
              console.warn(`Failed to initialize strategy data for tournament ${tournament.id}:`, error)
            }
          }

          return tournament
        })

        tournaments.value = migratedTournaments

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

  const storeReturn = {
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
    clearError,
    getTournamentById,

    // Strategy-related methods
    getAvailableModes,
    getTournamentStrategy
  }

  // Register this store with the battle service to avoid circular imports
  battleTournamentService.registerTournamentStore(() => storeReturn)

  return storeReturn
})
