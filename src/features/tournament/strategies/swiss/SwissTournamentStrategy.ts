import type { 
  TournamentStrategy, 
  TournamentStrategyConfig,
  BattleMatchup 
} from '../base/TournamentStrategy.interface'
import type { Tournament, TournamentProgress } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

interface SwissStanding {
  trackId: string
  track: SpotifyTrack
  points: number
  won: number
  lost: number
  played: number
  opponents: string[] // Track IDs of previous opponents
}

interface SwissRound {
  roundNumber: number
  pairings: Array<{
    trackAId: string
    trackBId: string
    completed: boolean
    winnerId?: string
    battleId?: string
  }>
  completed: boolean
}

interface SwissData {
  standings: SwissStanding[]
  rounds: SwissRound[]
  currentRound: number
  currentPairingIndex: number
  totalRounds: number
}

export class SwissTournamentStrategy implements TournamentStrategy {
  readonly name = 'Swiss System'
  readonly description = 'Tracks are paired based on similar performance. No elimination, best record after fixed rounds wins.'
  
  readonly config: TournamentStrategyConfig = {
    requireMinimumTracks: 4,
    allowSkipping: false,
    supportsPausing: true,
    supportsResuming: true
  }

  initializeTournament(tracks: SpotifyTrack[]): TournamentProgress {
    const totalRounds = this.calculateOptimalRounds(tracks.length)
    const totalBattles = Math.floor(tracks.length / 2) * totalRounds
    
    return {
      totalTracks: tracks.length,
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
    const data = this.getStrategyData(tournament) as SwissData

    if (!completedBattle.winner) return progress

    // Update current pairing
    const currentRound = data.rounds[data.currentRound - 1]
    const pairing = currentRound.pairings[data.currentPairingIndex]
    
    if (pairing) {
      pairing.completed = true
      pairing.winnerId = completedBattle.winner
      pairing.battleId = completedBattle.id
    }

    // Update standings
    this.updateStandings(data, completedBattle)

    // Move to next pairing
    data.currentPairingIndex++

    // Check if current round is completed
    if (data.currentPairingIndex >= currentRound.pairings.length) {
      currentRound.completed = true
      data.currentRound++
      data.currentPairingIndex = 0

      // Generate next round pairings if not the last round
      if (data.currentRound <= data.totalRounds) {
        this.generateRoundPairings(data)
      }
    }

    // Update progress
    progress.battlesCompleted++
    progress.battlesRemaining = this.calculateRemainingBattles(data)
    progress.progressPercentage = (progress.battlesCompleted / (progress.battlesCompleted + progress.battlesRemaining)) * 100
    progress.currentRound = data.currentRound

    this.updateStrategyData(tournament, data)
    return progress
  }

  getNextMatchup(tournament: Tournament): BattleMatchup | null {
    const data = this.getStrategyData(tournament) as SwissData

    if (data.currentRound > data.totalRounds) {
      return null // Tournament completed
    }

    const currentRound = data.rounds[data.currentRound - 1]
    if (!currentRound || data.currentPairingIndex >= currentRound.pairings.length) {
      return null
    }

    const pairing = currentRound.pairings[data.currentPairingIndex]
    const trackA = tournament.tracks.find(t => t.id === pairing.trackAId)
    const trackB = tournament.tracks.find(t => t.id === pairing.trackBId)

    if (!trackA || !trackB) return null

    return {
      trackA,
      trackB,
      round: data.currentRound,
      metadata: {
        battleType: 'swiss',
        roundNumber: data.currentRound,
        totalRounds: data.totalRounds,
        pairingIndex: data.currentPairingIndex,
        totalPairings: currentRound.pairings.length
      }
    }
  }

  isCompleted(tournament: Tournament): boolean {
    const data = this.getStrategyData(tournament) as SwissData
    return data.currentRound > data.totalRounds
  }

  completeTournament(tournament: Tournament): Tournament {
    const updatedTournament = { ...tournament }
    const data = this.getStrategyData(tournament) as SwissData
    
    updatedTournament.status = 'completed'
    updatedTournament.completedAt = new Date()

    // Champion é quem tem mais pontos
    const sortedStandings = [...data.standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won
      return a.lost - b.lost
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
    if (!tournament.strategyData.swiss) {
      const totalRounds = this.calculateOptimalRounds(tournament.tracks.length)
      
      tournament.strategyData.swiss = {
        standings: tournament.tracks.map(track => ({
          trackId: track.id,
          track,
          points: 0,
          won: 0,
          lost: 0,
          played: 0,
          opponents: []
        })),
        rounds: [],
        currentRound: 1,
        currentPairingIndex: 0,
        totalRounds
      }

      // Generate first round pairings
      this.generateRoundPairings(tournament.strategyData.swiss)
    }
    return tournament.strategyData.swiss
  }

  updateStrategyData(tournament: Tournament, data: Record<string, any>): void {
    tournament.strategyData.swiss = data
  }

  private calculateOptimalRounds(trackCount: number): number {
    // Swiss system typically uses log2(n) rounds, but we'll use a bit more for better results
    return Math.max(3, Math.ceil(Math.log2(trackCount)) + 1)
  }

  private generateRoundPairings(data: SwissData): void {
    const roundNumber = data.currentRound
    const standings = [...data.standings]

    // Sort by points (and tiebreakers) for pairing
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won
      return a.lost - b.lost
    })

    const pairings = []
    const paired = new Set<string>()

    // Swiss pairing algorithm: pair tracks with similar scores
    for (let i = 0; i < standings.length && paired.size < standings.length - 1; i++) {
      const trackA = standings[i]
      
      if (paired.has(trackA.trackId)) continue

      // Find best opponent (similar score, hasn't played before)
      let bestOpponent = null

      for (let j = i + 1; j < standings.length; j++) {
        const trackB = standings[j]
        
        if (paired.has(trackB.trackId)) continue
        if (trackA.opponents.includes(trackB.trackId)) continue

        bestOpponent = trackB
        break
      }

      // If no suitable opponent found, pair with next available
      if (!bestOpponent) {
        for (let j = i + 1; j < standings.length; j++) {
          const trackB = standings[j]
          if (!paired.has(trackB.trackId)) {
            bestOpponent = trackB
            break
          }
        }
      }

      if (bestOpponent) {
        pairings.push({
          trackAId: trackA.trackId,
          trackBId: bestOpponent.trackId,
          completed: false
        })
        
        paired.add(trackA.trackId)
        paired.add(bestOpponent.trackId)
      }
    }

    // Handle bye (odd number of players)
    if (paired.size < standings.length) {
      const unpaired = standings.find(s => !paired.has(s.trackId))
      if (unpaired) {
        // Give bye (automatic win)
        unpaired.points += 1
        unpaired.won += 1
        unpaired.played += 1
      }
    }

    const round: SwissRound = {
      roundNumber,
      pairings,
      completed: false
    }

    data.rounds.push(round)
  }

  private updateStandings(data: SwissData, battle: Battle): void {
    if (!battle.winner) return

    const winnerId = battle.winner
    const loserId = battle.trackA.id === winnerId ? battle.trackB.id : battle.trackA.id

    const winner = data.standings.find(s => s.trackId === winnerId)
    const loser = data.standings.find(s => s.trackId === loserId)

    if (winner) {
      winner.points += 1
      winner.won += 1
      winner.played += 1
      winner.opponents.push(loserId)
    }

    if (loser) {
      loser.lost += 1
      loser.played += 1
      loser.opponents.push(winnerId)
    }

    // Sort standings
    data.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.won !== a.won) return b.won - a.won
      return a.lost - b.lost
    })
  }

  private calculateRemainingBattles(data: SwissData): number {
    let remaining = 0

    for (let roundIndex = data.currentRound - 1; roundIndex < data.totalRounds; roundIndex++) {
      const round = data.rounds[roundIndex]
      
      if (round) {
        if (roundIndex === data.currentRound - 1) {
          // Current round: count remaining pairings
          remaining += round.pairings.length - data.currentPairingIndex
        } else {
          // Future rounds: count all pairings
          remaining += round.pairings.length
        }
      } else {
        // Future round not yet generated: estimate
        remaining += Math.floor(data.standings.length / 2)
      }
    }

    return remaining
  }
}
