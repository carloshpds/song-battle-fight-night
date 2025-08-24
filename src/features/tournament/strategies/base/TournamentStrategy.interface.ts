import type { Tournament, TournamentProgress } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

export interface TournamentStrategyConfig {
  requireMinimumTracks: number
  allowSkipping: boolean
  supportsPausing: boolean
  supportsResuming: boolean
}

export interface BattleMatchup {
  trackA: SpotifyTrack
  trackB: SpotifyTrack
  round?: number
  group?: string
  metadata?: Record<string, any>
}

export interface TournamentStrategy {
  readonly name: string
  readonly description: string
  readonly config: TournamentStrategyConfig

  // Core tournament lifecycle
  initializeTournament(tracks: SpotifyTrack[]): TournamentProgress
  updateProgress(tournament: Tournament, completedBattle: Battle): TournamentProgress
  getNextMatchup(tournament: Tournament): BattleMatchup | null
  isCompleted(tournament: Tournament): boolean
  completeTournament(tournament: Tournament): Tournament

  // Validation
  validateTracks(tracks: SpotifyTrack[]): boolean
  canStartBattle(tournament: Tournament): boolean

  // Strategy-specific data
  getStrategyData(tournament: Tournament): Record<string, any>
  updateStrategyData(tournament: Tournament, data: Record<string, any>): void
}
