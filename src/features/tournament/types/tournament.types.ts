import type { SpotifyTrack, SpotifyPlaylist } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

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
  tracks: SpotifyTrack[]
  battles: Battle[]
  champion?: SpotifyTrack
  createdAt: Date
  completedAt?: Date
  lastBattleAt?: Date
  progress: TournamentProgress
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
  settings?: Partial<TournamentSettings>
}
