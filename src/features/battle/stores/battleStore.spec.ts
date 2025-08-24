import { describe, test, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleStore } from './battleStore'
import { battleTournamentService } from '../services/battleTournamentService'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

// Mock tracks
const mockTrack1: SpotifyTrack = {
  id: 'track1',
  name: 'Track 1',
  artists: [{
    id: 'artist1',
    name: 'Artist 1',
    type: 'artist',
    uri: 'spotify:artist:artist1',
    external_urls: { spotify: 'https://open.spotify.com/artist/artist1' }
  }],
  album: {
    id: 'album1',
    name: 'Album 1',
    images: [{ url: 'image1.jpg', height: 300, width: 300 }],
    artists: [],
    release_date: '2024-01-01',
    type: 'album',
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
  type: 'track',
  uri: 'spotify:track:track1'
}

const mockTrack2: SpotifyTrack = {
  id: 'track2',
  name: 'Track 2',
  artists: [{
    id: 'artist2',
    name: 'Artist 2',
    type: 'artist',
    uri: 'spotify:artist:artist2',
    external_urls: { spotify: 'https://open.spotify.com/artist/artist2' }
  }],
  album: {
    id: 'album2',
    name: 'Album 2',
    images: [{ url: 'image2.jpg', height: 300, width: 300 }],
    artists: [],
    release_date: '2024-01-02',
    type: 'album',
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
  type: 'track',
  uri: 'spotify:track:track2'
}

// Mock spotifyStore
vi.mock('@/features/spotify-integration/stores/spotifyStore', () => ({
  useSpotifyStore: () => ({
    isAuthenticated: true
  })
}))

describe('BattleStore - Tournament Strategy Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('when tournament is active', () => {
    beforeEach(() => {
      // Mock tournament service to return specific tracks
      vi.spyOn(battleTournamentService, 'hasActiveTournament').mockReturnValue(true)
      vi.spyOn(battleTournamentService, 'getTournamentBattlePair').mockReturnValue([mockTrack1, mockTrack2])
      vi.spyOn(battleTournamentService, 'canStartBattle').mockReturnValue(true)
      vi.spyOn(battleTournamentService, 'notifyBattleCompletion').mockResolvedValue()
    })

    describe('and starting a new battle', () => {
      test('then should use tournament tracks', () => {
        const store = useBattleStore()

        const battle = store.startNewBattle()

        expect(battle.trackA.id).toBe('track1')
        expect(battle.trackB.id).toBe('track2')
        expect(battleTournamentService.getTournamentBattlePair).toHaveBeenCalled()
      })

      test('then should validate battle can start', () => {
        const store = useBattleStore()

        store.startNewBattle()

        expect(battleTournamentService.canStartBattle).toHaveBeenCalledWith(mockTrack1, mockTrack2)
      })
    })

    describe('and voting for track', () => {
      test('then should notify tournament service', () => {
        const store = useBattleStore()

        const battle = store.startNewBattle()
        store.voteForTrack(battle.trackA.id)

        expect(battleTournamentService.notifyBattleCompletion).toHaveBeenCalledWith(
          expect.objectContaining({
            winner: battle.trackA.id,
            trackA: mockTrack1,
            trackB: mockTrack2
          })
        )
      })

      test('then should reject invalid vote', () => {
        const store = useBattleStore()

        store.startNewBattle()

        expect(() => {
          store.voteForTrack('invalid-track-id')
        }).toThrow('Invalid vote: track is not part of the current battle')
      })
    })
  })

  describe('when tournament service rejects battle', () => {
    beforeEach(() => {
      vi.spyOn(battleTournamentService, 'hasActiveTournament').mockReturnValue(true)
      vi.spyOn(battleTournamentService, 'getTournamentBattlePair').mockReturnValue([mockTrack1, mockTrack2])
      vi.spyOn(battleTournamentService, 'canStartBattle').mockReturnValue(false)
    })

    test('then should throw error when starting battle', () => {
      const store = useBattleStore()

      expect(() => {
        store.startNewBattle()
      }).toThrow('Cannot start this battle - it does not match the expected tournament matchup')
    })
  })

  describe('when no active tournament', () => {
    beforeEach(() => {
      vi.spyOn(battleTournamentService, 'hasActiveTournament').mockReturnValue(false)
      vi.spyOn(battleTournamentService, 'getTournamentBattlePair').mockReturnValue(null)
    })

    test('then should use available tracks for regular battle', () => {
      const store = useBattleStore()

      // Add tracks to available tracks
      store.availableTracks.push(mockTrack1, mockTrack2)

      const battle = store.startNewBattle()

      expect([mockTrack1.id, mockTrack2.id]).toContain(battle.trackA.id)
      expect([mockTrack1.id, mockTrack2.id]).toContain(battle.trackB.id)
      expect(battle.trackA.id).not.toBe(battle.trackB.id)
    })
  })
})
