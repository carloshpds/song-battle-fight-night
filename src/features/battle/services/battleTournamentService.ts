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

        // ✅ FIX: Validate that this battle corresponds to the expected tournament matchup
        const expectedMatchup = tournamentStore.getNextMatchup(tournamentStore.activeTournament.value)

        if (expectedMatchup && this.isBattleMatchingExpectedMatchup(battle, expectedMatchup)) {
          console.log('🏆 Valid tournament battle completed, notifying tournament store')

          // ✅ FIX: Await tournament update to ensure synchronization
          await tournamentStore.onBattleCompleted(battle)

          console.log('✅ Tournament store notified and updated successfully')
        } else {
          console.warn('⚠️ Battle does not match expected tournament matchup, skipping tournament notification', {
            battle: {
              trackA: battle.trackA.name,
              trackB: battle.trackB.name,
              winner: battle.winner
            },
            expected: expectedMatchup ? {
              trackA: expectedMatchup.trackA.name,
              trackB: expectedMatchup.trackB.name
            } : 'No expected matchup'
          })
        }
      }
    } catch (error) {
      console.error('❌ Failed to notify tournament of battle completion:', error)
      throw error // ✅ FIX: Re-throw error to allow battle store to handle it
    }
  }

  /**
   * Validate if a completed battle matches the expected tournament matchup
   */
  private isBattleMatchingExpectedMatchup(battle: Battle, expectedMatchup: any): boolean {
    const battleTrackIds = new Set([battle.trackA.id, battle.trackB.id])
    const matchupTrackIds = new Set([expectedMatchup.trackA.id, expectedMatchup.trackB.id])

    // Check if both sets contain the same track IDs
    return battleTrackIds.size === matchupTrackIds.size &&
           Array.from(battleTrackIds).every(id => matchupTrackIds.has(id))
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

  /**
   * Check if a battle can be started (validates against tournament strategy if active)
   */
  canStartBattle(trackA: SpotifyTrack, trackB: SpotifyTrack): boolean {
    if (!this.tournamentStoreGetter) {
      return true // No tournament constraints
    }

    try {
      const tournamentStore = this.tournamentStoreGetter()

      if (tournamentStore.activeTournament.value &&
          tournamentStore.activeTournament.value.status === 'active') {

        const expectedMatchup = tournamentStore.getNextMatchup(tournamentStore.activeTournament.value)

        if (expectedMatchup) {
          // Check if the proposed battle matches the expected tournament matchup
          const proposedTrackIds = new Set([trackA.id, trackB.id])
          const expectedTrackIds = new Set([expectedMatchup.trackA.id, expectedMatchup.trackB.id])

          return proposedTrackIds.size === expectedTrackIds.size &&
                 Array.from(proposedTrackIds).every(id => expectedTrackIds.has(id))
        } else {
          // No more matchups available in tournament
          return false
        }
      }

      return true // No active tournament, battle can proceed
    } catch (error) {
      console.warn('Failed to check if battle can start:', error)
      return true // Default to allowing battle
    }
  }
}

export const battleTournamentService = BattleTournamentService.getInstance()
