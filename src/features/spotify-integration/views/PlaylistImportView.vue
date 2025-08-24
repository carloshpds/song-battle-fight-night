<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-h3 mb-2">Import Your Music</h1>
          <p class="text-h6 text-medium-emphasis">
            Choose how you want to import music for your battles
          </p>
        </div>

        <v-card class="elevation-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-spotify</v-icon>
            Import from Spotify
          </v-card-title>

          <v-card-text>
            <!-- Tournament Mode Selection -->
            <div class="mb-6">
              <TournamentModeSelector
                v-model="selectedTournamentMode"
                :track-count="estimatedTrackCount"
                @update:config="onModeConfigUpdate"
              />
            </div>

            <v-tabs v-model="activeTab" color="primary">
              <v-tab value="playlist">
                <v-icon class="mr-2">mdi-playlist-music</v-icon>
                From Playlist
              </v-tab>
              <v-tab value="url">
                <v-icon class="mr-2">mdi-link</v-icon>
                From URLs
              </v-tab>
            </v-tabs>

            <v-tabs-window v-model="activeTab" class="mt-4">
              <!-- Playlist Import Tab -->
              <v-tabs-window-item value="playlist">
                <div class="py-4">
                  <v-text-field
                    v-model="playlistSearch"
                    label="Search your playlists"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    clearable
                    class="mb-4"
                  />

                  <div v-if="isLoadingPlaylists" class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" size="48" />
                    <p class="mt-4">Loading your playlists...</p>
                  </div>

                  <v-alert v-else-if="playlistError" type="error" class="mb-4">
                    {{ playlistError }}
                    <template #append>
                      <v-btn
                        size="small"
                        variant="text"
                        @click="loadPlaylists"
                      >
                        Retry
                      </v-btn>
                    </template>
                  </v-alert>

                  <div v-else-if="filteredPlaylists.length > 0">
                    <p class="mb-4 text-medium-emphasis">
                      Found {{ filteredPlaylists.length }} playlist{{ filteredPlaylists.length !== 1 ? 's' : '' }}
                    </p>

                    <v-list>
                      <v-list-item
                        v-for="playlist in paginatedPlaylists"
                        :key="playlist.id"
                        @click="selectPlaylist(playlist)"
                        :loading="selectedPlaylistId === playlist.id"
                        class="mb-2"
                      >
                        <template #prepend>
                          <v-avatar size="56">
                            <v-img
                              v-if="playlist.images?.[0]?.url"
                              :src="playlist.images[0].url"
                              :alt="playlist.name"
                            />
                            <v-icon v-else size="large">mdi-music-box-multiple</v-icon>
                          </v-avatar>
                        </template>

                        <v-list-item-title class="font-weight-medium">
                          {{ playlist.name }}
                        </v-list-item-title>

                        <v-list-item-subtitle>
                          {{ playlist.tracks.total }} tracks • {{ playlist.owner.display_name }}
                        </v-list-item-subtitle>

                        <template #append>
                          <v-btn
                            icon="mdi-chevron-right"
                            variant="text"
                            size="small"
                          />
                        </template>
                      </v-list-item>
                    </v-list>

                    <!-- Pagination for playlists -->
                    <div v-if="filteredPlaylists.length > playlistsPerPage" class="text-center mt-4">
                      <v-pagination
                        v-model="playlistPage"
                        :length="Math.ceil(filteredPlaylists.length / playlistsPerPage)"
                        :total-visible="5"
                      />
                    </div>
                  </div>

                  <v-alert v-else type="info" variant="tonal">
                    No playlists found. Make sure you're connected to Spotify and have some playlists.
                  </v-alert>
                </div>
              </v-tabs-window-item>

              <!-- URL Import Tab -->
              <v-tabs-window-item value="url">
                <div class="py-4">
                  <v-textarea
                    v-model="urlsInput"
                    label="Paste Spotify URLs (one per line)"
                    placeholder="https://open.spotify.com/track/...&#10;https://open.spotify.com/playlist/...&#10;spotify:track:..."
                    variant="outlined"
                    rows="6"
                    class="mb-4"
                  />

                  <div class="d-flex gap-2 mb-4">
                    <v-btn
                      color="primary"
                      @click="parseUrls"
                      :loading="isParsingUrls"
                      :disabled="!urlsInput.trim()"
                    >
                      Parse URLs
                    </v-btn>

                    <v-btn
                      variant="outlined"
                      @click="clearUrls"
                      :disabled="!urlsInput.trim()"
                    >
                      Clear
                    </v-btn>
                  </div>

                  <div v-if="parsedTracks.length > 0" class="mt-4">
                    <h4 class="mb-3">Found {{ parsedTracks.length }} valid track{{ parsedTracks.length !== 1 ? 's' : '' }}:</h4>

                    <v-list density="compact" class="mb-4">
                      <v-list-item
                        v-for="track in parsedTracks"
                        :key="track.id"
                      >
                        <template #prepend>
                          <v-avatar size="40">
                            <v-img
                              v-if="track.album.images?.[0]?.url"
                              :src="track.album.images[0].url"
                              :alt="track.name"
                            />
                            <v-icon v-else>mdi-music</v-icon>
                          </v-avatar>
                        </template>

                        <v-list-item-title>{{ track.name }}</v-list-item-title>
                        <v-list-item-subtitle>
                          {{ track.artists.map(a => a.name).join(', ') }}
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>

                    <v-btn
                      color="success"
                      size="large"
                      @click="startTournamentWithTracks"
                      block
                    >
                      Create Tournament with These Tracks
                    </v-btn>
                  </div>

                  <v-alert v-if="urlParseError" type="error" class="mt-4">
                    {{ urlParseError }}
                  </v-alert>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyStore } from '../stores/spotifyStore'
import { useTournamentStore } from '@/features/tournament/stores/tournamentStore'
import { TrackParsingService } from '../services/trackParsingService'
import TournamentModeSelector from '@/features/tournament/components/TournamentModeSelector.vue'
import type { SpotifyPlaylist, SpotifyTrack } from '../types/spotify.types'
import type { TournamentMode } from '@/features/tournament/strategies/base/StrategyTypes'

const router = useRouter()
const spotifyStore = useSpotifyStore()
const tournamentStore = useTournamentStore()

// Reactive state
const activeTab = ref('playlist')
const playlistSearch = ref('')
const playlistPage = ref(1)
const playlistsPerPage = 10
const selectedPlaylistId = ref<string | null>(null)
const isLoadingPlaylists = ref(false)
const playlistError = ref<string | null>(null)

const urlsInput = ref('')
const isParsingUrls = ref(false)
const parsedTracks = ref<SpotifyTrack[]>([])
const urlParseError = ref<string | null>(null)
const parsedPlaylistId = ref<string | null>(null)

// Tournament mode selection
const selectedTournamentMode = ref<TournamentMode>('elimination')
const tournamentModeConfig = ref<Record<string, any>>({})

// Computed
const filteredPlaylists = computed(() => {
  if (!playlistSearch.value) return spotifyStore.userPlaylists

  return spotifyStore.userPlaylists.filter(playlist =>
    playlist.name.toLowerCase().includes(playlistSearch.value.toLowerCase())
  )
})

const paginatedPlaylists = computed(() => {
  const start = (playlistPage.value - 1) * playlistsPerPage
  const end = start + playlistsPerPage
  return filteredPlaylists.value.slice(start, end)
})

const estimatedTrackCount = computed(() => {
  if (activeTab.value === 'playlist' && selectedPlaylistId.value) {
    const playlist = spotifyStore.userPlaylists.find(p => p.id === selectedPlaylistId.value)
    return playlist?.tracks.total || 0
  } else if (activeTab.value === 'url') {
    return parsedTracks.value.length
  }
  return 10 // Default estimate for mode selection
})

// Methods
const onModeConfigUpdate = (config: Record<string, any>) => {
  tournamentModeConfig.value = config
}
const loadPlaylists = async () => {
  if (!spotifyStore.isAuthenticated) {
    router.push('/spotify/connect')
    return
  }

  isLoadingPlaylists.value = true
  playlistError.value = null

  try {
    await spotifyStore.loadUserPlaylists()
  } catch (error) {
    console.error('Error loading playlists:', error)
    playlistError.value = error instanceof Error ? error.message : 'Failed to load playlists'
  } finally {
    isLoadingPlaylists.value = false
  }
}

const selectPlaylist = async (playlist: SpotifyPlaylist) => {
  selectedPlaylistId.value = playlist.id

  try {
    // Load tracks from playlist
    const tracks = await spotifyStore.getPlaylistTracks(playlist.id)

    // Create tournament instead of going directly to battle
    await tournamentStore.createTournament({
      playlistId: playlist.id,
      playlistName: playlist.name,
      tracks: tracks,
      mode: selectedTournamentMode.value,
      modeConfig: {
        mode: selectedTournamentMode.value,
        parameters: tournamentModeConfig.value
      }
    })

    // Navigate to tournaments list
    router.push('/tournament')
  } catch (error) {
    console.error('Error creating tournament:', error)
    playlistError.value = error instanceof Error ? error.message : 'Failed to create tournament'
  } finally {
    selectedPlaylistId.value = null
  }
}

const parseUrls = async () => {
  if (!urlsInput.value.trim()) return

  isParsingUrls.value = true
  parsedTracks.value = []
  urlParseError.value = null

  try {
    const urls = urlsInput.value.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    for (const url of urls) {
      if (TrackParsingService.isValidSpotifyUrl(url)) {
        parsedPlaylistId.value = TrackParsingService.extractPlaylistId(url)
        const parsed = TrackParsingService.parseSpotifyUrl(url)

        if (parsed.type === 'track') {
          try {
            const trackId = TrackParsingService.extractTrackId(url)
            if (trackId) {
              const track = await spotifyStore.getTrackById(trackId)
              if (track && track.preview_url && !parsedTracks.value.find(t => t.id === track.id)) {
                parsedTracks.value.push(track)
              }
            }
          } catch (error) {
            console.warn(`Failed to load track from URL: ${url}`, error)
          }
        } else if (parsed.type === 'playlist') {
          try {
            const tracks = await spotifyStore.getPlaylistTracks(parsed.id!)
            tracks.forEach((track: SpotifyTrack) => {
              if (!parsedTracks.value.find(t => t.id === track.id)) {
                parsedTracks.value.push(track)
              }
            })
          } catch (error) {
            console.warn(`Failed to load playlist from URL: ${url}`, error)
          }
        }
      }
    }

    if (parsedTracks.value.length === 0) {
      urlParseError.value = 'No valid tracks found in the provided URLs'
    }
  } catch (error) {
    urlParseError.value = error instanceof Error ? error.message : 'Error parsing URLs'
  } finally {
    isParsingUrls.value = false
  }
}

const clearUrls = () => {
  urlsInput.value = ''
  parsedTracks.value = []
  urlParseError.value = null
}

const startTournamentWithTracks = async () => {
  if (parsedTracks.value.length === 0) return

  try {
    // Create tournament with parsed tracks
    await tournamentStore.createTournament({
      playlistId: parsedPlaylistId.value || 'custom-' + Date.now(),
      playlistName: `Custom Tournament (${parsedTracks.value.length} tracks)`,
      tracks: parsedTracks.value,
      mode: selectedTournamentMode.value,
      modeConfig: {
        mode: selectedTournamentMode.value,
        parameters: tournamentModeConfig.value
      }
    })

    router.push('/tournament')
  } catch (error) {
    console.error('Error creating tournament from URLs:', error)
    urlParseError.value = error instanceof Error ? error.message : 'Failed to create tournament'
  }
}

// Initialize
onMounted(() => {
  loadPlaylists()
})
</script>
