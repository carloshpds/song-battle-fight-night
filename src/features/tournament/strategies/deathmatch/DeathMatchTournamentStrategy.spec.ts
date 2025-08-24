import { describe, test, expect, beforeEach } from 'vitest'
import { DeathMatchTournamentStrategy } from './DeathMatchTournamentStrategy'
import type { Tournament } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

// Mock tracks
const mockTracks: SpotifyTrack[] = Array.from({ length: 6 }, (_, i) => ({
  id: `track-${i + 1}`,
  name: `Track ${i + 1}`,
  artists: [{
    name: `Artist ${i + 1}`,
    id: `artist-${i + 1}`,
    type: 'artist',
    uri: `spotify:artist:artist-${i + 1}`,
    external_urls: { spotify: `http://spotify-artist${i + 1}` }
  }],
  album: {
    id: `album-${i + 1}`,
    name: `Album ${i + 1}`,
    artists: [],
    images: [],
    release_date: '2023-01-01',
    type: 'album',
    uri: `spotify:album:album-${i + 1}`,
    external_urls: { spotify: `http://spotify-album${i + 1}` }
  },
  preview_url: `http://preview${i + 1}.mp3`,
  external_urls: { spotify: `http://spotify${i + 1}` },
  duration_ms: 180000,
  explicit: false,
  popularity: 80 - i * 5,
  disc_number: 1,
  track_number: i + 1,
  type: 'track',
  uri: `spotify:track:track-${i + 1}`
})) as SpotifyTrack[]

describe('DeathMatchTournamentStrategy', () => {
  let strategy: DeathMatchTournamentStrategy
  let tournament: Tournament

  beforeEach(() => {
    strategy = new DeathMatchTournamentStrategy()
    tournament = {
      id: 'test-tournament',
      name: 'Test Death Match',
      playlistId: 'playlist-1',
      status: 'active',
      mode: 'deathmatch',
      modeConfig: { mode: 'deathmatch', parameters: {} },
      tracks: mockTracks,
      battles: [],
      createdAt: new Date(),
      progress: strategy.initializeTournament(mockTracks),
      strategyData: {}
    }
  })

  describe('when initializing tournament', () => {
    test('then should set up death match format', () => {
      const progress = strategy.initializeTournament(mockTracks)

      expect(progress.totalTracks).toBe(6)
      expect(progress.battlesCompleted).toBe(0)
      expect(progress.currentRound).toBe(1)
      expect(progress.totalRounds).toBe(1) // Death match is one long round
      expect(progress.remainingTracks).toHaveLength(6)
      expect(progress.eliminatedTracks).toHaveLength(0)
    })
  })

  describe('when updating progress after battles', () => {
    test('then should accumulate scores correctly', () => {
      const battle: Battle = {
        id: 'battle-1',
        trackA: mockTracks[0],
        trackB: mockTracks[1],
        votes: [],
        winner: mockTracks[0].id,
        createdAt: new Date(),
        completedAt: new Date()
      }

      const updatedProgress = strategy.updateProgress(tournament, battle)
      const data = strategy.getStrategyData(tournament)

      expect(updatedProgress.battlesCompleted).toBe(1)
      expect(data.scores[mockTracks[0].id]).toBe(1)
      expect(data.leaderboard).toHaveLength(1)
      expect(data.leaderboard[0].score).toBe(1)
      expect(data.leaderboard[0].trackId).toBe(mockTracks[0].id)
    })

    test('then should handle multiple battles and rankings', () => {
      // First battle: track 1 beats track 2
      let battle: Battle = {
        id: 'battle-1',
        trackA: mockTracks[0],
        trackB: mockTracks[1],
        votes: [],
        winner: mockTracks[0].id,
        createdAt: new Date(),
        completedAt: new Date()
      }
      
      strategy.updateProgress(tournament, battle)

      // Second battle: track 2 beats track 3
      battle = {
        id: 'battle-2',
        trackA: mockTracks[1],
        trackB: mockTracks[2],
        votes: [],
        winner: mockTracks[1].id,
        createdAt: new Date(),
        completedAt: new Date()
      }

      strategy.updateProgress(tournament, battle)

      const data = strategy.getStrategyData(tournament)

      expect(data.scores[mockTracks[0].id]).toBe(1)
      expect(data.scores[mockTracks[1].id]).toBe(1)
      expect(data.leaderboard).toHaveLength(2)
    })
  })

  describe('when getting next matchup', () => {
    test('then should return random tracks initially', () => {
      const matchup = strategy.getNextMatchup(tournament)

      expect(matchup).not.toBeNull()
      expect(matchup?.trackA).toBeDefined()
      expect(matchup?.trackB).toBeDefined()
      expect(matchup?.trackA.id).not.toBe(matchup?.trackB.id)
      expect(matchup?.metadata?.battleType).toBe('deathmatch')
    })
  })

  describe('when checking completion', () => {
    test('then should complete when target score reached', () => {
      // Simulate someone reaching target score
      const data = strategy.getStrategyData(tournament)
      data.scores[mockTracks[0].id] = 10 // Target score
      data.leaderboard = [{ 
        trackId: mockTracks[0].id, 
        score: 10, 
        track: mockTracks[0] 
      }]
      strategy.updateStrategyData(tournament, data)

      expect(strategy.isCompleted(tournament)).toBe(true)
    })

    test('then should complete when max battles reached', () => {
      // Simulate max battles reached
      tournament.progress.battlesCompleted = 50 // Assuming default max is 50

      expect(strategy.isCompleted(tournament)).toBe(true)
    })
  })

  describe('when completing tournament', () => {
    test('then should set champion correctly', () => {
      const data = strategy.getStrategyData(tournament)
      data.leaderboard = [{ 
        trackId: mockTracks[0].id, 
        score: 10, 
        track: mockTracks[0] 
      }]
      strategy.updateStrategyData(tournament, data)

      const completedTournament = strategy.completeTournament(tournament)

      expect(completedTournament.status).toBe('completed')
      expect(completedTournament.champion).toBe(mockTracks[0])
      expect(completedTournament.progress.progressPercentage).toBe(100)
    })
  })
})
