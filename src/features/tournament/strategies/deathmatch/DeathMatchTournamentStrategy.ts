import type {
  TournamentStrategy,
  TournamentStrategyConfig,
  BattleMatchup
} from '../base/TournamentStrategy.interface'
import type { Tournament, TournamentProgress } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

interface DeathMatchData {
  scores: Record<string, number>
  targetScore: number
  totalBattles: number
  leaderboard: Array<{ trackId: string; score: number; track: SpotifyTrack }>
  maxBattles: number
}

export class DeathMatchTournamentStrategy implements TournamentStrategy {
  readonly name = 'Death Match'
  readonly description = 'Continuous battles where tracks accumulate points. First to target score or highest after time limit wins.'

  readonly config: TournamentStrategyConfig = {
    requireMinimumTracks: 2,
    allowSkipping: false,
    supportsPausing: true,
    supportsResuming: true
  }

  private readonly DEFAULT_TARGET_SCORE = 10
  private readonly DEFAULT_MAX_BATTLES = 50

  initializeTournament(tracks: SpotifyTrack[]): TournamentProgress {
    const maxBattles = Math.max(this.DEFAULT_MAX_BATTLES, tracks.length * 5) // At least 5 battles per track

    return {
      totalTracks: tracks.length,
      battlesCompleted: 0,
      battlesRemaining: maxBattles,
      currentRound: 1,
      totalRounds: 1, // Death match é uma única rodada longa
      eliminatedTracks: [],
      remainingTracks: [...tracks],
      progressPercentage: 0
    }
  }

  updateProgress(tournament: Tournament, completedBattle: Battle): TournamentProgress {
    const progress = { ...tournament.progress }
    const data = this.getStrategyData(tournament) as DeathMatchData

    if (!completedBattle.winner) return progress

    // Atualizar pontuação
    const currentScore = data.scores[completedBattle.winner] || 0
    data.scores[completedBattle.winner] = currentScore + 1

    // Atualizar leaderboard
    data.leaderboard = Object.entries(data.scores)
      .map(([trackId, score]) => {
        const track = tournament.tracks.find(t => t.id === trackId)!
        return { trackId, score, track }
      })
      .sort((a, b) => b.score - a.score)

    data.totalBattles++

    // Atualizar progresso
    progress.battlesCompleted++
    progress.battlesRemaining = Math.max(0, data.maxBattles - progress.battlesCompleted)
    progress.progressPercentage = Math.min(100, (progress.battlesCompleted / data.maxBattles) * 100)

    this.updateStrategyData(tournament, data)

    return progress
  }

  getNextMatchup(tournament: Tournament): BattleMatchup | null {
    const tracks = tournament.progress.remainingTracks

    if (tracks.length < 2 || this.isCompleted(tournament)) return null

    // Estratégia: emparelhar tracks com pontuações similares quando possível
    const data = this.getStrategyData(tournament) as DeathMatchData

    // Se temos poucos dados, usar seleção aleatória
    if (data.totalBattles < tracks.length) {
      const shuffled = [...tracks].sort(() => 0.5 - Math.random())
      return {
        trackA: shuffled[0],
        trackB: shuffled[1],
        round: tournament.progress.currentRound,
        metadata: {
          battleType: 'deathmatch',
          battlesRemaining: tournament.progress.battlesRemaining
        }
      }
    }

    // Estratégia avançada: emparelhar tracks com pontuações próximas
    const sortedByScore = [...tracks].sort((a, b) => {
      const scoreA = data.scores[a.id] || 0
      const scoreB = data.scores[b.id] || 0
      return Math.abs(scoreA - scoreB) // Ordena por diferença de pontuação
    })

    return {
      trackA: sortedByScore[0],
      trackB: sortedByScore[1],
      round: tournament.progress.currentRound,
      metadata: {
        battleType: 'deathmatch',
        battlesRemaining: tournament.progress.battlesRemaining
      }
    }
  }

  isCompleted(tournament: Tournament): boolean {
    const data = this.getStrategyData(tournament) as DeathMatchData

    // Completado se alguém atingiu o target score ou se atingiu max battles
    const hasWinner = data.leaderboard.length > 0 && data.leaderboard[0].score >= data.targetScore
    const maxBattlesReached = tournament.progress.battlesCompleted >= data.maxBattles

    return hasWinner || maxBattlesReached
  }

  completeTournament(tournament: Tournament): Tournament {
    const updatedTournament = { ...tournament }
    const data = this.getStrategyData(tournament) as DeathMatchData

    updatedTournament.status = 'completed'
    updatedTournament.completedAt = new Date()

    // Champion é quem tem mais pontos
    if (data.leaderboard.length > 0) {
      updatedTournament.champion = data.leaderboard[0].track
    }

    updatedTournament.progress.progressPercentage = 100
    updatedTournament.progress.battlesRemaining = 0

    return updatedTournament
  }

  validateTracks(tracks: SpotifyTrack[]): boolean {
    return tracks.length >= this.config.requireMinimumTracks
  }

  canStartBattle(tournament: Tournament): boolean {
    return !this.isCompleted(tournament) &&
           tournament.status === 'active' &&
           tournament.progress.remainingTracks.length >= 2
  }

  getStrategyData(tournament: Tournament): Record<string, any> {
    if (!tournament.strategyData.deathmatch) {
      const maxBattles = Math.max(this.DEFAULT_MAX_BATTLES, tournament.tracks.length * 5)
      tournament.strategyData.deathmatch = {
        scores: {},
        targetScore: this.DEFAULT_TARGET_SCORE,
        totalBattles: 0,
        leaderboard: [],
        maxBattles
      }
    }
    return tournament.strategyData.deathmatch
  }

  updateStrategyData(tournament: Tournament, data: Record<string, any>): void {
    tournament.strategyData.deathmatch = data
  }
}
