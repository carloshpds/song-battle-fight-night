import { describe, test, expect, beforeEach } from 'vitest'
import { EliminationTournamentStrategy } from './EliminationTournamentStrategy'
import type { Tournament } from '../../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

const mockTracks: SpotifyTrack[] = [
  {
    id: '1',
    name: 'Track 1',
    artists: [{
      name: 'Artist 1',
      id: 'artist1',
      type: 'artist',
      uri: 'spotify:artist:artist1',
      external_urls: { spotify: 'http://spotify-artist1' }
    }],
    album: {
      id: 'album1',
      name: 'Album 1',
      artists: [],
      images: [],
      release_date: '2023-01-01',
      type: 'album',
      uri: 'spotify:album:album1',
      external_urls: { spotify: 'http://spotify-album1' }
    },
    preview_url: 'http://preview1.mp3',
    external_urls: { spotify: 'http://spotify1' },
    duration_ms: 180000,
    explicit: false,
    popularity: 80,
    disc_number: 1,
    track_number: 1,
    type: 'track',
    uri: 'spotify:track:1'
  },
  {
    id: '2',
    name: 'Track 2',
    artists: [{
      name: 'Artist 2',
      id: 'artist2',
      type: 'artist',
      uri: 'spotify:artist:artist2',
      external_urls: { spotify: 'http://spotify-artist2' }
    }],
    album: {
      id: 'album2',
      name: 'Album 2',
      artists: [],
      images: [],
      release_date: '2023-01-01',
      type: 'album',
      uri: 'spotify:album:album2',
      external_urls: { spotify: 'http://spotify-album2' }
    },
    preview_url: 'http://preview2.mp3',
    external_urls: { spotify: 'http://spotify2' },
    duration_ms: 200000,
    explicit: false,
    popularity: 75,
    disc_number: 1,
    track_number: 2,
    type: 'track',
    uri: 'spotify:track:2'
  },
  {
    id: '3',
    name: 'Track 3',
    artists: [{
      name: 'Artist 3',
      id: 'artist3',
      type: 'artist',
      uri: 'spotify:artist:artist3',
      external_urls: { spotify: 'http://spotify-artist3' }
    }],
    album: {
      id: 'album3',
      name: 'Album 3',
      artists: [],
      images: [],
      release_date: '2023-01-01',
      type: 'album',
      uri: 'spotify:album:album3',
      external_urls: { spotify: 'http://spotify-album3' }
    },
    preview_url: 'http://preview3.mp3',
    external_urls: { spotify: 'http://spotify3' },
    duration_ms: 190000,
    explicit: false,
    popularity: 70,
    disc_number: 1,
    track_number: 3,
    type: 'track',
    uri: 'spotify:track:3'
  },
  {
    id: '4',
    name: 'Track 4',
    artists: [{
      name: 'Artist 4',
      id: 'artist4',
      type: 'artist',
      uri: 'spotify:artist:artist4',
      external_urls: { spotify: 'http://spotify-artist4' }
    }],
    album: {
      id: 'album4',
      name: 'Album 4',
      artists: [],
      images: [],
      release_date: '2023-01-01',
      type: 'album',
      uri: 'spotify:album:album4',
      external_urls: { spotify: 'http://spotify-album4' }
    },
    preview_url: 'http://preview4.mp3',
    external_urls: { spotify: 'http://spotify4' },
    duration_ms: 210000,
    explicit: false,
    popularity: 85,
    disc_number: 1,
    track_number: 4,
    type: 'track',
    uri: 'spotify:track:4'
  }
] as SpotifyTrack[]

describe('EliminationTournamentStrategy', () => {
  let strategy: EliminationTournamentStrategy
  let tournament: Tournament

  beforeEach(() => {
    strategy = new EliminationTournamentStrategy()
    tournament = {
      id: 'test-tournament',
      name: 'Test Tournament',
      playlistId: 'playlist-1',
      status: 'active',
      mode: 'elimination',
      modeConfig: { mode: 'elimination', parameters: {} },
      tracks: mockTracks,
      battles: [],
      createdAt: new Date(),
      progress: strategy.initializeTournament(mockTracks),
      strategyData: {}
    }
  })

  describe('when initializing tournament', () => {
    test('then should calculate correct initial progress', () => {
      const progress = strategy.initializeTournament(mockTracks)

      expect(progress.totalTracks).toBe(4)
      expect(progress.battlesCompleted).toBe(0)
      expect(progress.battlesRemaining).toBe(3) // n-1 battles for elimination
      expect(progress.currentRound).toBe(1)
      expect(progress.totalRounds).toBe(2) // log2(4) = 2
      expect(progress.remainingTracks).toHaveLength(4)
      expect(progress.eliminatedTracks).toHaveLength(0)
      expect(progress.progressPercentage).toBe(0)
    })
  })

  describe('when updating progress after battle', () => {
    describe('and track 1 wins against track 2', () => {
      test('then should eliminate loser and update progress', () => {
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

        expect(updatedProgress.battlesCompleted).toBe(1)
        expect(updatedProgress.battlesRemaining).toBe(2)
        expect(updatedProgress.progressPercentage).toBeCloseTo(33.33)
        expect(updatedProgress.remainingTracks).toHaveLength(3)
        expect(updatedProgress.eliminatedTracks).toHaveLength(1)
        expect(updatedProgress.eliminatedTracks[0].id).toBe(mockTracks[1].id)
      })
    })
  })

  describe('when getting next matchup', () => {
    describe('and tournament has remaining tracks', () => {
      test('then should return valid matchup', () => {
        const matchup = strategy.getNextMatchup(tournament)

        expect(matchup).not.toBeNull()
        expect(matchup?.trackA).toBeDefined()
        expect(matchup?.trackB).toBeDefined()
        expect(matchup?.trackA.id).not.toBe(matchup?.trackB.id)
        expect(matchup?.round).toBe(1)
      })
    })

    describe('and only one track remains', () => {
      test('then should return null', () => {
        tournament.progress.remainingTracks = [mockTracks[0]]

        const matchup = strategy.getNextMatchup(tournament)

        expect(matchup).toBeNull()
      })
    })
  })

  describe('when checking if tournament is completed', () => {
    describe('and multiple tracks remain', () => {
      test('then should return false', () => {
        expect(strategy.isCompleted(tournament)).toBe(false)
      })
    })

    describe('and only one track remains', () => {
      test('then should return true', () => {
        tournament.progress.remainingTracks = [mockTracks[0]]

        expect(strategy.isCompleted(tournament)).toBe(true)
      })
    })
  })

  describe('when completing tournament', () => {
    test('then should set champion and update status', () => {
      tournament.progress.remainingTracks = [mockTracks[0]]

      const completedTournament = strategy.completeTournament(tournament)

      expect(completedTournament.status).toBe('completed')
      expect(completedTournament.champion).toBe(mockTracks[0])
      expect(completedTournament.progress.progressPercentage).toBe(100)
      expect(completedTournament.progress.battlesRemaining).toBe(0)
      expect(completedTournament.completedAt).toBeDefined()
    })
  })

  describe('when validating tracks', () => {
    describe('and tracks meet minimum requirement', () => {
      test('then should return true', () => {
        expect(strategy.validateTracks(mockTracks)).toBe(true)
      })
    })

    describe('and tracks do not meet minimum requirement', () => {
      test('then should return false', () => {
        expect(strategy.validateTracks([mockTracks[0]])).toBe(false)
      })
    })
  })

  describe('when checking if can start battle', () => {
    describe('and tournament is active with enough tracks', () => {
      test('then should return true', () => {
        expect(strategy.canStartBattle(tournament)).toBe(true)
      })
    })

    describe('and tournament is paused', () => {
      test('then should return false', () => {
        tournament.status = 'paused'
        expect(strategy.canStartBattle(tournament)).toBe(false)
      })
    })
  })
})
