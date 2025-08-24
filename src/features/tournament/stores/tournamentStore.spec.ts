import { describe, test, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTournamentStore } from './tournamentStore'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

// Mock Spotify tracks for testing
const mockTracks: SpotifyTrack[] = [
  {
    id: 'track1',
    name: 'Track 1',
    artists: [{
      id: 'artist1',
      name: 'Artist 1',
      type: 'artist' as const,
      uri: 'spotify:artist:artist1',
      external_urls: { spotify: 'https://open.spotify.com/artist/artist1' }
    }],
    album: {
      id: 'album1',
      name: 'Album 1',
      images: [{ url: 'image1.jpg', height: 300, width: 300 }],
      artists: [],
      release_date: '2024-01-01',
      type: 'album' as const,
      uri: 'spotify:album:album1',
      external_urls: { spotify: 'https://open.spotify.com/album/album1' }
    },
    preview_url: 'preview1.mp3',
    external_urls: { spotify: 'spotify:track:track1' },
    duration_ms: 210000,
    explicit: false,
    popularity: 75,
    disc_number: 1,
    track_number: 1,
    type: 'track' as const,
    uri: 'spotify:track:track1'
  },
  {
    id: 'track2',
    name: 'Track 2',
    artists: [{
      id: 'artist2',
      name: 'Artist 2',
      type: 'artist' as const,
      uri: 'spotify:artist:artist2',
      external_urls: { spotify: 'https://open.spotify.com/artist/artist2' }
    }],
    album: {
      id: 'album2',
      name: 'Album 2',
      images: [{ url: 'image2.jpg', height: 300, width: 300 }],
      artists: [],
      release_date: '2024-01-02',
      type: 'album' as const,
      uri: 'spotify:album:album2',
      external_urls: { spotify: 'https://open.spotify.com/album/album2' }
    },
    preview_url: 'preview2.mp3',
    external_urls: { spotify: 'spotify:track:track2' },
    duration_ms: 190000,
    explicit: false,
    popularity: 68,
    disc_number: 1,
    track_number: 1,
    type: 'track' as const,
    uri: 'spotify:track:track2'
  },
  {
    id: 'track3',
    name: 'Track 3',
    artists: [{
      id: 'artist3',
      name: 'Artist 3',
      type: 'artist' as const,
      uri: 'spotify:artist:artist3',
      external_urls: { spotify: 'https://open.spotify.com/artist/artist3' }
    }],
    album: {
      id: 'album3',
      name: 'Album 3',
      images: [{ url: 'image3.jpg', height: 300, width: 300 }],
      artists: [],
      release_date: '2024-01-03',
      type: 'album' as const,
      uri: 'spotify:album:album3',
      external_urls: { spotify: 'https://open.spotify.com/album/album3' }
    },
    preview_url: 'preview3.mp3',
    external_urls: { spotify: 'spotify:track:track3' },
    duration_ms: 205000,
    explicit: false,
    popularity: 82,
    disc_number: 1,
    track_number: 1,
    type: 'track' as const,
    uri: 'spotify:track:track3'
  },
  {
    id: 'track4',
    name: 'Track 4',
    artists: [{
      id: 'artist4',
      name: 'Artist 4',
      type: 'artist' as const,
      uri: 'spotify:artist:artist4',
      external_urls: { spotify: 'https://open.spotify.com/artist/artist4' }
    }],
    album: {
      id: 'album4',
      name: 'Album 4',
      images: [{ url: 'image4.jpg', height: 300, width: 300 }],
      artists: [],
      release_date: '2024-01-04',
      type: 'album' as const,
      uri: 'spotify:album:album4',
      external_urls: { spotify: 'https://open.spotify.com/album/album4' }
    },
    preview_url: 'preview4.mp3',
    external_urls: { spotify: 'spotify:track:track4' },
    duration_ms: 230000,
    explicit: false,
    popularity: 73,
    disc_number: 1,
    track_number: 1,
    type: 'track' as const,
    uri: 'spotify:track:track4'
  }
]

// Mock spotifyStore
const mockSpotifyStore = {
  isAuthenticated: true,
  getPlaylistTracks: () => Promise.resolve(mockTracks)
}

// Mock useSpotifyStore
vi.mock('@/features/spotify-integration/stores/spotifyStore', () => ({
  useSpotifyStore: () => mockSpotifyStore
}))

describe('TournamentStore - Strategy Initialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear localStorage
    localStorage.clear()
  })

  describe('when creating a tournament', () => {
    describe('and mode is elimination', () => {
      test('then should initialize strategy data correctly', async () => {
        const store = useTournamentStore()

        const tournament = await store.createTournament({
          playlistId: 'test-playlist',
          playlistName: 'Test Playlist',
          tracks: mockTracks,
          mode: 'elimination'
        })

        expect(tournament).toBeDefined()
        expect(tournament.mode).toBe('elimination')
        expect(tournament.strategyData).toBeDefined()
        expect(tournament.progress).toBeDefined()
        expect(tournament.progress.totalTracks).toBe(4)
      })
    })

    describe('and mode is swiss', () => {
      test('then should initialize strategy data correctly', async () => {
        const store = useTournamentStore()

        const tournament = await store.createTournament({
          playlistId: 'test-playlist',
          playlistName: 'Test Playlist',
          tracks: mockTracks,
          mode: 'swiss'
        })

        expect(tournament).toBeDefined()
        expect(tournament.mode).toBe('swiss')
        expect(tournament.strategyData).toBeDefined()
        expect(tournament.strategyData.swiss).toBeDefined()
        expect(tournament.strategyData.swiss.standings).toHaveLength(4)
        expect(tournament.strategyData.swiss.rounds).toHaveLength(1) // First round should be generated
      })
    })

    describe('and mode is roundrobin', () => {
      test('then should initialize strategy data correctly', async () => {
        const store = useTournamentStore()

        const tournament = await store.createTournament({
          playlistId: 'test-playlist',
          playlistName: 'Test Playlist',
          tracks: mockTracks,
          mode: 'roundrobin'
        })

        expect(tournament).toBeDefined()
        expect(tournament.mode).toBe('roundrobin')
        expect(tournament.strategyData).toBeDefined()
        expect(tournament.strategyData.roundrobin).toBeDefined()
        expect(tournament.strategyData.roundrobin.fixtures).toHaveLength(6) // C(4,2) = 6 combinations
        expect(tournament.strategyData.roundrobin.standings).toHaveLength(4)
      })
    })

    describe('and mode is groups', () => {
      test('then should initialize strategy data correctly', async () => {
        const store = useTournamentStore()

        // Need at least 6 tracks for groups mode
        const moreTracksMock = [...mockTracks,
          { ...mockTracks[0], id: 'track5', name: 'Track 5' },
          { ...mockTracks[1], id: 'track6', name: 'Track 6' }
        ]

        const tournament = await store.createTournament({
          playlistId: 'test-playlist',
          playlistName: 'Test Playlist',
          tracks: moreTracksMock,
          mode: 'groups'
        })

        expect(tournament).toBeDefined()
        expect(tournament.mode).toBe('groups')
        expect(tournament.strategyData).toBeDefined()
        expect(tournament.strategyData.groups).toBeDefined()
        expect(tournament.strategyData.groups.groups).toBeDefined()
        expect(tournament.strategyData.groups.groups.length).toBeGreaterThan(0)
      })
    })
  })

  describe('when getting next matchup', () => {
    describe('and tournament has swiss strategy initialized', () => {
      test('then should return valid matchup', async () => {
        const store = useTournamentStore()

        const tournament = await store.createTournament({
          playlistId: 'test-playlist',
          playlistName: 'Test Playlist',
          tracks: mockTracks,
          mode: 'swiss'
        })

        const matchup = store.getNextMatchup(tournament)

        expect(matchup).toBeDefined()
        expect(matchup?.trackA).toBeDefined()
        expect(matchup?.trackB).toBeDefined()
        expect(matchup?.trackA.id).not.toBe(matchup?.trackB.id)
      })
    })
  })
})
