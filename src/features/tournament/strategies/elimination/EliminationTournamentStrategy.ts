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

    // Move loser to eliminated
    const loserTrack = progress.remainingTracks.find(t => t.id === loserId)
    if (loserTrack) {
      progress.eliminatedTracks.push(loserTrack)
      progress.remainingTracks = progress.remainingTracks.filter(t => t.id !== loserId)
    }

    // Update battle counts
    progress.battlesCompleted++
    progress.battlesRemaining = Math.max(0, progress.totalTracks - 1 - progress.battlesCompleted)
    progress.progressPercentage = progress.totalTracks > 1
      ? (progress.battlesCompleted / (progress.totalTracks - 1)) * 100
      : 100

    // Update current round
    if (progress.remainingTracks.length > 1) {
      const tracksInCurrentRound = Math.pow(2, Math.floor(Math.log2(progress.remainingTracks.length)))
      const expectedRound = progress.totalRounds - Math.floor(Math.log2(tracksInCurrentRound)) + 1
      progress.currentRound = Math.max(1, Math.min(expectedRound, progress.totalRounds))
    } else {
      progress.currentRound = progress.totalRounds
    }

    return progress
  }

  getNextMatchup(tournament: Tournament): BattleMatchup | null {
    const remaining = tournament.progress.remainingTracks

    if (remaining.length < 2) {
      return null
    }

    // Simple random selection (could be improved with bracket logic)
    const shuffled = [...remaining].sort(() => 0.5 - Math.random())

    return {
      trackA: shuffled[0],
      trackB: shuffled[1],
      round: tournament.progress.currentRound
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
    return tournament.strategyData || {}
  }

  updateStrategyData(tournament: Tournament, data: Record<string, any>): void {
    tournament.strategyData = { ...tournament.strategyData, ...data }
  }
}
