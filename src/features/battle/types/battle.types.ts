import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

export interface BattleVote {
  id: string
  trackId: string
  timestamp: Date
  userId: string
}

export interface Battle {
  id: string
  trackA: SpotifyTrack
  trackB: SpotifyTrack
  votes: BattleVote[]
  winner: string | null
  createdAt: Date
  completedAt?: Date
}

export interface BattleStats {
  totalBattles: number
  totalVotes: number
  winRate: number
  averageBattleDuration: number
}

export interface TrackStats {
  trackId: string
  track: SpotifyTrack
  wins: number
  losses: number
  totalBattles: number
  winRate: number
  lastBattleAt: Date
}

export interface LeaderboardEntry {
  rank: number
  track: SpotifyTrack
  stats: TrackStats
  score: number
  change: number // Position change from last ranking
}

export type BattleStatus = 'pending' | 'active' | 'completed'

export interface BattleSession {
  id: string
  name: string
  description?: string
  tracks: SpotifyTrack[]
  battles: Battle[]
  status: BattleStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  settings: {
    requirePreview: boolean
    maxBattlesPerTrack: number
    randomize: boolean
  }
}
