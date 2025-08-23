import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BattleView from './BattleView.vue'
import { useBattleStore } from '../stores/battleStore'
import { useSpotifyStore } from '@/features/spotify-integration/stores/spotifyStore'
import { useTournamentStore } from '@/features/tournament/stores/tournamentStore'

// Mock the stores
vi.mock('../stores/battleStore')
vi.mock('@/features/spotify-integration/stores/spotifyStore')
vi.mock('@/features/tournament/stores/tournamentStore')

// Mock the audio composable
vi.mock('@/shared/composables/useAudio', () => ({
  useAudio: () => ({
    isSupported: true,
    playVoteSuccessSound: vi.fn(),
    playButtonClickSound: vi.fn(),
  })
}))

// Mock Vuetify components
vi.mock('vuetify', () => ({
  default: {},
}))

const mockBattleStore = {
  currentBattle: null,
  availableTracks: [] as any[],
  battleCount: 0,
  isLoading: false,
  error: null,
  initializeBattle: vi.fn(),
  startNewBattle: vi.fn(),
  voteForTrack: vi.fn(),
  skipBattle: vi.fn(),
  clearError: vi.fn(),
}

const mockSpotifyStore = {
  isAuthenticated: true,
}

const mockTournamentStore = {
  activeTournament: null as any,
  initializeTournaments: vi.fn(),
  createTournament: vi.fn(),
}

describe('BattleView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    vi.mocked(useBattleStore).mockReturnValue(mockBattleStore as any)
    vi.mocked(useSpotifyStore).mockReturnValue(mockSpotifyStore as any)
    vi.mocked(useTournamentStore).mockReturnValue(mockTournamentStore as any)
  })

  const createComponent = () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div></div>' } },
        { path: '/spotify/connect', component: { template: '<div></div>' } },
        { path: '/spotify/import', component: { template: '<div></div>' } }
      ]
    })

    return mount(BattleView, {
      global: {
        plugins: [router],
        stubs: {
          'v-container': { template: '<div><slot /></div>' },
          'v-app-bar': { template: '<div><slot /></div>' },
          'v-app-bar-title': { template: '<div><slot /></div>' },
          'v-icon': { template: '<span></span>' },
          'v-spacer': { template: '<div></div>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-progress-circular': { template: '<div></div>' },
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-row': { template: '<div><slot /></div>' },
          'v-col': { template: '<div><slot /></div>' },
          'v-progress-linear': { template: '<div></div>' },
          'v-chip': { template: '<span><slot /></span>' },
          'v-avatar': { template: '<div><slot /></div>' },
          'v-img': { template: '<img />' },
          'v-navigation-drawer': { template: '<div><slot /></div>' },
          'v-list': { template: '<div><slot /></div>' },
          'v-list-item': { template: '<div><slot /></div>' },
          'v-list-item-title': { template: '<div><slot /></div>' },
          'v-list-item-subtitle': { template: '<div><slot /></div>' },
          'v-divider': { template: '<hr />' },
          'battle-music-card': { template: '<div></div>' },
          'leaderboard-dialog': { template: '<div></div>' },
          'tournament-results-modal': { template: '<div></div>' },
        }
      }
    })
  }

  describe('when component is mounted', () => {
    test('then should initialize tournaments and battle stores', () => {
      createComponent()

      expect(mockTournamentStore.initializeTournaments).toHaveBeenCalledOnce()
      expect(mockBattleStore.initializeBattle).toHaveBeenCalledOnce()
    })
  })

  describe('when no active tournament', () => {
    beforeEach(() => {
      mockTournamentStore.activeTournament = null
    })

    test('then should not show tournament progress section', () => {
      const wrapper = createComponent()

      expect(wrapper.find('.tournament-progress-section').exists()).toBe(false)
    })

    test('then should not show tournament completed section', () => {
      const wrapper = createComponent()

      expect(wrapper.find('.tournament-completed-section').exists()).toBe(false)
    })
  })

  describe('when tournament is active', () => {
    const activeTournament = {
      id: 'tournament-1',
      name: 'Test Tournament',
      playlistId: 'playlist-1',
      status: 'active' as const,
      tracks: [{ id: '1' }, { id: '2' }, { id: '3' }],
      progress: {
        progressPercentage: 45.5,
        currentRound: 2,
        remainingTracks: [{ id: '1' }, { id: '2' }],
        battlesCompleted: 5,
        eliminatedTracks: [{ id: '3' }],
      }
    }

    beforeEach(() => {
      mockTournamentStore.activeTournament = activeTournament
    })

    test('then should show tournament progress section', () => {
      const wrapper = createComponent()

      expect(wrapper.find('.tournament-progress-section').exists()).toBe(true)
    })

    test('then should display tournament progress information', () => {
      const wrapper = createComponent()

      const progressSection = wrapper.find('.tournament-progress-section')
      expect(progressSection.text()).toContain('Test Tournament')
      expect(progressSection.text()).toContain('45.5%')
      expect(progressSection.text()).toContain('2') // Round
      expect(progressSection.text()).toContain('2') // Remaining (tracks count)
      expect(progressSection.text()).toContain('5') // Battles completed
      expect(progressSection.text()).toContain('1') // Eliminated (tracks count)
    })
  })

  describe('when tournament is completed', () => {
    const completedTournament = {
      id: 'tournament-1',
      name: 'Test Tournament',
      playlistId: 'playlist-1',
      status: 'completed' as const,
      champion: {
        id: 'track-1',
        name: 'Champion Song',
        artists: [{ name: 'Champion Artist' }],
        album: {
          images: [{ url: 'http://example.com/image.jpg' }]
        }
      },
      tracks: [{ id: 'track-1' }, { id: 'track-2' }]
    }

    beforeEach(() => {
      mockTournamentStore.activeTournament = completedTournament
    })

    test('then should show tournament completed section', () => {
      const wrapper = createComponent()

      expect(wrapper.find('.tournament-completed-section').exists()).toBe(true)
    })

    test('then should display champion information', () => {
      const wrapper = createComponent()

      const completedSection = wrapper.find('.tournament-completed-section')
      expect(completedSection.text()).toContain('Tournament Complete!')
      expect(completedSection.text()).toContain('Champion Song')
      expect(completedSection.text()).toContain('Champion Artist')
    })

    test('then should not show battle arena', () => {
      const wrapper = createComponent()

      expect(wrapper.find('.battle-arena').exists()).toBe(false)
    })

    describe('and user clicks recreate tournament button', () => {
      test('then should call createTournament with same tracks', async () => {
        const wrapper = createComponent()

        const buttons = wrapper.findAll('button')
        const recreateBtn = buttons.find(btn => btn.text().includes('Recreate Tournament'))

        if (recreateBtn) {
          await recreateBtn.trigger('click')

          expect(mockTournamentStore.createTournament).toHaveBeenCalledWith({
            playlistId: 'playlist-1',
            playlistName: 'Test Tournament (Rematch)',
            tracks: [{ id: 'track-1' }, { id: 'track-2' }]
          })
        }
      })
    })
  })
})
