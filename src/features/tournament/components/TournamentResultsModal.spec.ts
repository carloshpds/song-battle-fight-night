import { describe, test, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import TournamentResultsModal from './TournamentResultsModal.vue'
import type { Tournament } from '../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'
import type { Battle } from '@/features/battle/types/battle.types'

const vuetify = createVuetify()

const mockTrack: SpotifyTrack = {
  id: 'test-track-1',
  name: 'Test Song',
  artists: [{
    id: 'artist-1',
    name: 'Test Artist',
    type: 'artist',
    uri: 'spotify:artist:artist-1',
    external_urls: { spotify: 'https://spotify.com/artist/artist-1' }
  }],
  album: {
    id: 'album-1',
    name: 'Test Album',
    artists: [{
      id: 'artist-1',
      name: 'Test Artist',
      type: 'artist',
      uri: 'spotify:artist:artist-1',
      external_urls: { spotify: 'https://spotify.com/artist/artist-1' }
    }],
    release_date: '2023-01-01',
    type: 'album',
    uri: 'spotify:album:album-1',
    external_urls: { spotify: 'https://spotify.com/album/album-1' },
    images: [{ url: 'https://example.com/image.jpg', width: 300, height: 300 }]
  },
  duration_ms: 180000,
  explicit: false,
  popularity: 75,
  preview_url: 'https://example.com/preview.mp3',
  external_urls: { spotify: 'https://spotify.com/track/test' },
  disc_number: 1,
  track_number: 1,
  type: 'track',
  uri: 'spotify:track:test-track-1'
}

const mockTrack2: SpotifyTrack = {
  ...mockTrack,
  id: 'test-track-2',
  name: 'Test Song 2',
  uri: 'spotify:track:test-track-2',
  artists: [{
    id: 'artist-2',
    name: 'Test Artist 2',
    type: 'artist',
    uri: 'spotify:artist:artist-2',
    external_urls: { spotify: 'https://spotify.com/artist/artist-2' }
  }]
}

const mockBattle: Battle = {
  id: 'battle-1',
  trackA: mockTrack,
  trackB: mockTrack2,
  votes: [],
  winner: 'test-track-1',
  createdAt: new Date(),
  completedAt: new Date()
}

const mockTournament: Tournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
  playlistId: 'playlist-1',
  status: 'active',
  tracks: [mockTrack, mockTrack2],
  battles: [mockBattle],
  createdAt: new Date(),
  progress: {
    totalTracks: 2,
    battlesCompleted: 1,
    battlesRemaining: 0,
    currentRound: 1,
    totalRounds: 1,
    eliminatedTracks: [mockTrack2],
    remainingTracks: [mockTrack],
    progressPercentage: 50
  }
}

describe('TournamentResultsModal', () => {
  describe('when modal is closed', () => {
    test('then should not render dialog content', () => {
      const wrapper = mount(TournamentResultsModal, {
        props: {
          modelValue: false,
          tournament: null
        },
        global: {
          plugins: [vuetify]
        }
      })

      expect(wrapper.find('.tournament-results-modal').exists()).toBe(false)
    })
  })

  describe('when modal is open', () => {
    describe('and tournament is provided', () => {
      let wrapper: any

      beforeEach(() => {
        wrapper = mount(TournamentResultsModal, {
          props: {
            modelValue: true,
            tournament: mockTournament
          },
          global: {
            plugins: [vuetify]
          }
        })
      })

      test('then should render tournament name', () => {
        expect(wrapper.text()).toContain('Test Tournament')
      })

      test('then should display battle statistics', () => {
        expect(wrapper.text()).toContain('1') // Total battles
        expect(wrapper.text()).toContain('Total Battles')
      })

      test('then should show all tabs', () => {
        expect(wrapper.text()).toContain('Battles')
        expect(wrapper.text()).toContain('Winners')
        expect(wrapper.text()).toContain('Eliminated')
        expect(wrapper.text()).toContain('Pending')
      })
    })

    describe('and tournament is null', () => {
      test('then should not render content', () => {
        const wrapper = mount(TournamentResultsModal, {
          props: {
            modelValue: true,
            tournament: null
          },
          global: {
            plugins: [vuetify]
          }
        })

        expect(wrapper.find('.tournament-results-modal').exists()).toBe(false)
      })
    })
  })

  describe('when component emits events', () => {
    test('then should emit update:modelValue correctly', async () => {
      const wrapper = mount(TournamentResultsModal, {
        props: {
          modelValue: true,
          tournament: mockTournament
        },
        global: {
          plugins: [vuetify]
        }
      })

      await wrapper.vm.$emit('update:modelValue', false)

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emittedEvents = wrapper.emitted('update:modelValue')
      expect(emittedEvents).toBeDefined()
      expect(emittedEvents![0]).toEqual([false])
    })
  })
})
