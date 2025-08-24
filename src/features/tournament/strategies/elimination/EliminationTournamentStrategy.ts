import type {
  TournamentStrategy,
  TournamentStrategyConfig,
  BattleMatchup
} from '../base/TournamentStrategy.interface'
import type { Tournament, TournamentProgress } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

export class EliminationTournamentStrategy implements TournamentStrategy {
  readonly name = 'Single Elimination'
  readonly description = 'Classic tournament bracket where losing a battle eliminates the track'

  readonly config: TournamentStrategyConfig = {
    requireMinimumTracks: 2,
    allowSkipping: true,
    supportsPausing: true,
    supportsResuming: true
  }

  initializeTournament(tracks: SpotifyTrack[]): TournamentProgress {
    const totalTracks = tracks.length
    const totalBattles = Math.max(0, totalTracks - 1)
    const totalRounds = totalTracks > 1 ? Math.ceil(Math.log2(totalTracks)) : 1

    return {
      totalTracks,
      battlesCompleted: 0,
      battlesRemaining: totalBattles,
      currentRound: 1,
      totalRounds,
      eliminatedTracks: [],
      remainingTracks: [...tracks],
      progressPercentage: 0
    }
  }

  updateProgress(tournament: Tournament, completedBattle: Battle): TournamentProgress {
    const progress = { ...tournament.progress }
    const winnerId = completedBattle.winner

    if (!winnerId) return progress

    const loserId = completedBattle.trackA.id === winnerId
      ? completedBattle.trackB.id
      : completedBattle.trackA.id

    // ✅ FIX: More rigorous elimination logic
    const loserTrack = progress.remainingTracks.find(t => t.id === loserId)
    if (loserTrack) {
      // Add to eliminated tracks
      progress.eliminatedTracks.push(loserTrack)

      // Remove from remaining tracks (ensure it's completely removed)
      progress.remainingTracks = progress.remainingTracks.filter(t => t.id !== loserId)

      console.log(`🏆 Track "${loserTrack.name}" eliminated. Remaining: ${progress.remainingTracks.length}`)
    }

    // ✅ FIX: Verify winner is still in remaining tracks (safety check)
    const winnerExists = progress.remainingTracks.find(t => t.id === winnerId)
    if (!winnerExists) {
      const winnerTrack = completedBattle.trackA.id === winnerId
        ? completedBattle.trackA
        : completedBattle.trackB
      console.warn(`⚠️ Winner track "${winnerTrack.name}" not found in remaining tracks. This shouldn't happen!`)
    }

    // Update battle counts
    progress.battlesCompleted++
    progress.battlesRemaining = Math.max(0, progress.remainingTracks.length - 1)
    progress.progressPercentage = progress.totalTracks > 1
      ? (progress.battlesCompleted / (progress.totalTracks - 1)) * 100
      : 100

    // ✅ FIX: Better round calculation
    const remainingCount = progress.remainingTracks.length
    if (remainingCount > 1) {
      // Calculate current round based on how many tracks are left
      const roundsFromEnd = Math.ceil(Math.log2(remainingCount))
      progress.currentRound = Math.max(1, progress.totalRounds - roundsFromEnd + 1)
    } else {
      progress.currentRound = progress.totalRounds
    }

    // ✅ FIX: Clear current matchups when round changes or no more matchups
    const strategyData = this.getStrategyData(tournament)
    if (strategyData.currentMatchups && strategyData.currentMatchups.length === 0) {
      // All matchups in current round completed, prepare for next round
      strategyData.currentMatchups = []
      this.updateStrategyData(tournament, strategyData)
    }

    return progress
  }

  getNextMatchup(tournament: Tournament): BattleMatchup | null {
    const remaining = tournament.progress.remainingTracks

    if (remaining.length < 2) {
      return null
    }

    // ✅ FIX: Get or initialize strategy data for bracket tracking
    let strategyData = this.getStrategyData(tournament)

    if (!strategyData.currentMatchups || strategyData.currentMatchups.length === 0) {
      // Initialize new round matchups
      strategyData = this.initializeRoundMatchups(tournament, remaining)
      this.updateStrategyData(tournament, strategyData)
    }

    // Get the next matchup from current round
    const nextMatchup = strategyData.currentMatchups.shift()

    if (!nextMatchup) {
      return null
    }

    // Find the actual track objects
    const trackA = remaining.find(t => t.id === nextMatchup.trackAId)
    const trackB = remaining.find(t => t.id === nextMatchup.trackBId)

    if (!trackA || !trackB) {
      // Tracks not found in remaining, try next matchup
      return this.getNextMatchup(tournament)
    }

    // Update strategy data
    this.updateStrategyData(tournament, strategyData)

    return {
      trackA,
      trackB,
      round: tournament.progress.currentRound,
      metadata: {
        battleType: 'elimination',
        roundNumber: tournament.progress.currentRound,
        totalRounds: tournament.progress.totalRounds
      }
    }
  }

  isCompleted(tournament: Tournament): boolean {
    return tournament.progress.remainingTracks.length <= 1
  }

  completeTournament(tournament: Tournament): Tournament {
    const updatedTournament = { ...tournament }
    updatedTournament.status = 'completed'
    updatedTournament.completedAt = new Date()

    if (updatedTournament.progress.remainingTracks.length === 1) {
      updatedTournament.champion = updatedTournament.progress.remainingTracks[0]
    }

    updatedTournament.progress.progressPercentage = 100
    updatedTournament.progress.battlesRemaining = 0

    return updatedTournament
  }

  validateTracks(tracks: SpotifyTrack[]): boolean {
    return tracks.length >= this.config.requireMinimumTracks
  }

  canStartBattle(tournament: Tournament): boolean {
    return tournament.progress.remainingTracks.length >= 2 &&
           tournament.status === 'active'
  }

  getStrategyData(tournament: Tournament): Record<string, any> {
    if (!tournament.strategyData.elimination) {
      tournament.strategyData.elimination = {
        currentMatchups: [],
        roundHistory: []
      }
    }
    return tournament.strategyData.elimination
  }

  updateStrategyData(tournament: Tournament, data: Record<string, any>): void {
    tournament.strategyData.elimination = data
  }

  /**
   * Initialize matchups for the current round
   */
  private initializeRoundMatchups(tournament: Tournament, remainingTracks: SpotifyTrack[]): Record<string, any> {
    const strategyData = this.getStrategyData(tournament)

    // Create matchups by pairing tracks sequentially (bracket style)
    const matchups = []
    const tracks = [...remainingTracks]

    // If odd number of tracks, one gets a bye (advances automatically)
    if (tracks.length % 2 === 1) {
      const byeTrack = tracks.pop() // Last track gets bye
      console.log(`🏆 Track "${byeTrack?.name}" advances with bye`)
    }

    // Pair remaining tracks
    for (let i = 0; i < tracks.length; i += 2) {
      if (i + 1 < tracks.length) {
        matchups.push({
          trackAId: tracks[i].id,
          trackBId: tracks[i + 1].id,
          completed: false
        })
      }
    }

    // Shuffle matchups for variety, but keep bracket integrity
    const shuffledMatchups = matchups.sort(() => 0.5 - Math.random())

    strategyData.currentMatchups = shuffledMatchups
    strategyData.roundHistory = strategyData.roundHistory || []

    console.log(`🏆 Elimination Round ${tournament.progress.currentRound}: ${matchups.length} matchups created`)

    return strategyData
  }
}
