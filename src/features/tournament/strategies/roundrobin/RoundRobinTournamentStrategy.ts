import type {
  TournamentStrategy,
  TournamentStrategyConfig,
  BattleMatchup
} from '../base/TournamentStrategy.interface'
import type { Tournament, TournamentProgress } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

interface RoundRobinFixture {
  trackAId: string
  trackBId: string
  completed: boolean
  winnerId?: string
  battleId?: string
}

interface RoundRobinStanding {
  trackId: string
  track: SpotifyTrack
  played: number
  won: number
  lost: number
  points: number
}

interface RoundRobinData {
  fixtures: RoundRobinFixture[]
  standings: RoundRobinStanding[]
  currentFixtureIndex: number
}

export class RoundRobinTournamentStrategy implements TournamentStrategy {
  readonly name = 'Round Robin'
  readonly description = 'All tracks face each other exactly once. Track with most wins becomes champion.'

  readonly config: TournamentStrategyConfig = {
    requireMinimumTracks: 3,
    allowSkipping: false,
    supportsPausing: true,
    supportsResuming: true
  }

  initializeTournament(tracks: SpotifyTrack[]): TournamentProgress {
    const totalBattles = this.calculateTotalBattles(tracks.length)

    return {
      totalTracks: tracks.length,
      battlesCompleted: 0,
      battlesRemaining: totalBattles,
      currentRound: 1,
      totalRounds: 1, // Round robin é tecnicamente uma rodada
      eliminatedTracks: [],
      remainingTracks: [...tracks],
      progressPercentage: 0
    }
  }

  updateProgress(tournament: Tournament, completedBattle: Battle): TournamentProgress {
    const progress = { ...tournament.progress }
    const data = this.getStrategyData(tournament) as RoundRobinData

    if (!completedBattle.winner) return progress

    // Marcar fixture como completada
    const fixture = data.fixtures[data.currentFixtureIndex]
    if (fixture) {
      fixture.completed = true
      fixture.winnerId = completedBattle.winner
      fixture.battleId = completedBattle.id
      data.currentFixtureIndex++
    }

    // Atualizar standings
    this.updateStandings(data, completedBattle)

    // Atualizar progresso
    progress.battlesCompleted++
    progress.battlesRemaining = data.fixtures.length - progress.battlesCompleted
    progress.progressPercentage = (progress.battlesCompleted / data.fixtures.length) * 100

    this.updateStrategyData(tournament, data)

    return progress
  }

  getNextMatchup(tournament: Tournament): BattleMatchup | null {
    const data = this.getStrategyData(tournament) as RoundRobinData

    if (data.currentFixtureIndex >= data.fixtures.length) {
      return null // Todas as partidas foram jogadas
    }

    const fixture = data.fixtures[data.currentFixtureIndex]
    const trackA = tournament.tracks.find(t => t.id === fixture.trackAId)
    const trackB = tournament.tracks.find(t => t.id === fixture.trackBId)

    if (!trackA || !trackB) return null

    return {
      trackA,
      trackB,
      round: 1,
      metadata: {
        fixtureIndex: data.currentFixtureIndex,
        totalFixtures: data.fixtures.length,
        battleType: 'roundrobin'
      }
    }
  }

  isCompleted(tournament: Tournament): boolean {
    const data = this.getStrategyData(tournament) as RoundRobinData
    return data.currentFixtureIndex >= data.fixtures.length
  }

  completeTournament(tournament: Tournament): Tournament {
    const updatedTournament = { ...tournament }
    const data = this.getStrategyData(tournament) as RoundRobinData

    updatedTournament.status = 'completed'
    updatedTournament.completedAt = new Date()

    // Champion é quem tem mais pontos
    const sortedStandings = [...data.standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won // Critério de desempate: mais vitórias
      return a.lost - b.lost // Segundo critério: menos derrotas
    })

    if (sortedStandings.length > 0) {
      updatedTournament.champion = sortedStandings[0].track
    }

    updatedTournament.progress.progressPercentage = 100
    updatedTournament.progress.battlesRemaining = 0

    return updatedTournament
  }

  validateTracks(tracks: SpotifyTrack[]): boolean {
    return tracks.length >= this.config.requireMinimumTracks
  }

  canStartBattle(tournament: Tournament): boolean {
    return !this.isCompleted(tournament) && tournament.status === 'active'
  }

  getStrategyData(tournament: Tournament): Record<string, any> {
    if (!tournament.strategyData.roundrobin) {
      const fixtures = this.generateFixtures(tournament.tracks)
      const standings = tournament.tracks.map(track => ({
        trackId: track.id,
        track,
        played: 0,
        won: 0,
        lost: 0,
        points: 0
      }))

      tournament.strategyData.roundrobin = {
        fixtures,
        standings,
        currentFixtureIndex: 0
      }
    }
    return tournament.strategyData.roundrobin
  }

  updateStrategyData(tournament: Tournament, data: Record<string, any>): void {
    tournament.strategyData.roundrobin = data
  }

  private calculateTotalBattles(trackCount: number): number {
    return (trackCount * (trackCount - 1)) / 2
  }

  private generateFixtures(tracks: SpotifyTrack[]): RoundRobinFixture[] {
    const fixtures: RoundRobinFixture[] = []

    for (let i = 0; i < tracks.length; i++) {
      for (let j = i + 1; j < tracks.length; j++) {
        fixtures.push({
          trackAId: tracks[i].id,
          trackBId: tracks[j].id,
          completed: false
        })
      }
    }

    // Embaralhar fixtures para ordem aleatória
    return fixtures.sort(() => 0.5 - Math.random())
  }

  private updateStandings(data: RoundRobinData, completedBattle: Battle): void {
    if (!completedBattle.winner) return

    const winnerId = completedBattle.winner
    const loserId = completedBattle.trackA.id === winnerId
      ? completedBattle.trackB.id
      : completedBattle.trackA.id

    // Atualizar winner
    const winner = data.standings.find(s => s.trackId === winnerId)
    if (winner) {
      winner.played++
      winner.won++
      winner.points += 3 // 3 pontos por vitória
    }

    // Atualizar loser
    const loser = data.standings.find(s => s.trackId === loserId)
    if (loser) {
      loser.played++
      loser.lost++
      // 0 pontos por derrota
    }

    // Ordenar standings por pontuação
    data.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won
      return a.lost - b.lost
    })
  }
}
