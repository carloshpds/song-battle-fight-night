import type { SpotifyTrack, SpotifyPlaylist } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'
import type { TournamentMode, TournamentModeConfig } from '../strategies/base/StrategyTypes'

export type TournamentStatus = 'active' | 'completed' | 'paused'

export interface TournamentProgress {
  totalTracks: number
  battlesCompleted: number
  battlesRemaining: number
  currentRound: number
  totalRounds: number
  eliminatedTracks: SpotifyTrack[]
  remainingTracks: SpotifyTrack[]
  progressPercentage: number
}

export interface Tournament {
  id: string
  name: string // nome da playlist
  playlistId: string
  playlistData?: SpotifyPlaylist
  status: TournamentStatus
  mode: TournamentMode // NOVO
  modeConfig: TournamentModeConfig // NOVO
  tracks: SpotifyTrack[]
  battles: Battle[]
  champion?: SpotifyTrack
  createdAt: Date
  completedAt?: Date
  lastBattleAt?: Date
  progress: TournamentProgress
  strategyData: Record<string, any> // NOVO - dados específicos da estratégia
}

export interface TournamentSettings {
  eliminationStyle: 'single' | 'double'
  requirePreview: boolean
  allowSkipping: boolean
  randomizeOrder: boolean
}

export interface TournamentCard {
  tournament: Tournament
  canContinue: boolean
  nextMatchup?: {
    trackA: SpotifyTrack
    trackB: SpotifyTrack
  }
}

export interface TournamentCreateRequest {
  playlistId: string
  playlistName: string
  tracks: SpotifyTrack[]
  mode?: TournamentMode // NOVO - padrão 'elimination'
  modeConfig?: Partial<TournamentModeConfig> // NOVO
  settings?: Partial<TournamentSettings>
}
