import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

/**
 * Service to handle communication between battle and tournament systems
 * This service acts as a mediator to avoid circular dependencies
 */
export class BattleTournamentService {
  private static instance: BattleTournamentService
  private tournamentStoreGetter: (() => any) | null = null

  static getInstance(): BattleTournamentService {
    if (!BattleTournamentService.instance) {
      BattleTournamentService.instance = new BattleTournamentService()
    }
    return BattleTournamentService.instance
  }

  /**
   * Register tournament store getter to avoid circular imports
   */
  registerTournamentStore(getter: () => any): void {
    this.tournamentStoreGetter = getter
  }

  /**
   * Get tracks for battle based on active tournament
   * Returns tournament remaining tracks if tournament is active, otherwise null
   */
  getTracksForBattle(): SpotifyTrack[] | null {
    if (!this.tournamentStoreGetter) {
      return null
    }

    try {
      const tournamentStore = this.tournamentStoreGetter()

      if (tournamentStore.activeTournament.value &&
          tournamentStore.activeTournament.value.status === 'active' &&
          tournamentStore.activeTournament.value.progress.remainingTracks.length >= 2) {
        return tournamentStore.activeTournament.value.progress.remainingTracks
      }
    } catch (error) {
      console.warn('Failed to get tournament tracks:', error)
    }

    return null
  }

  /**
   * Get two tracks for battle from tournament remaining tracks
   */
  getTournamentBattlePair(): [SpotifyTrack, SpotifyTrack] | null {
    if (!this.tournamentStoreGetter) {
      return null
    }

    try {
      const tournamentStore = this.tournamentStoreGetter()
      
      if (tournamentStore.activeTournament.value &&
          tournamentStore.activeTournament.value.status === 'active') {
        
        const matchup = tournamentStore.getNextMatchup(tournamentStore.activeTournament.value)
        
        if (matchup) {
          return [matchup.trackA, matchup.trackB]
        }
      }
    } catch (error) {
      console.warn('Failed to get tournament battle pair:', error)
    }

    return null
  }

  /**
   * Notify tournament of battle completion
   */
  async notifyBattleCompletion(battle: Battle): Promise<void> {
    if (!this.tournamentStoreGetter || !battle.winner) {
      return
    }

    try {
      const tournamentStore = this.tournamentStoreGetter()

      if (tournamentStore.activeTournament &&
          tournamentStore.activeTournament.value.status === 'active') {
        await tournamentStore.onBattleCompleted(battle)
      }
    } catch (error) {
      console.warn('Failed to notify tournament of battle completion:', error)
    }
  }

  /**
   * Check if there's an active tournament
   */
  hasActiveTournament(): boolean {
    if (!this.tournamentStoreGetter) {
      return false
    }

    try {
      const tournamentStore = this.tournamentStoreGetter()
      return !!(tournamentStore.activeTournament.value &&
                tournamentStore.activeTournament.value.status === 'active')
    } catch {
      return false
    }
  }
}

export const battleTournamentService = BattleTournamentService.getInstance()
