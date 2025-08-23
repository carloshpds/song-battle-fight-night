<template>
  <div
    class="battle-music-card"
    :class="{
      'winner': isWinner,
      'battle-card-left': side === 'left',
      'battle-card-right': side === 'right'
    }"
    elevation="2"
    @click="handleCardClick"
  >
    <!-- Spotify Embed -->
    <div class="spotify-embed-container">
      <iframe
        v-if="embedUrl"
        :src="embedUrl"
        width="100%"
        :height="embedHeight"
        frameBorder="0"
        allowfullscreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style="border-radius: 12px;"
        class="spotify-embed"
        :title="`Spotify preview for ${track.name} by ${artistNames}`"
      />

      <!-- Fallback when no embed available -->
      <div v-else class="embed-fallback">
        <v-img
          :src="track.album.images[0]?.url"
          :alt="track.name"
          :height="embedHeight"
          cover
          class="fallback-image"
        >
          <div class="fallback-overlay">
            <v-icon size="x-large" color="white" class="mb-2">
              mdi-music-off
            </v-icon>
            <p class="text-white text-center">
              Preview not available
            </p>
            <v-btn
              :href="track.external_urls.spotify"
              target="_blank"
              variant="elevated"
              color="success"
              size="small"
              class="mt-2"
            >
              <v-icon class="mr-1">mdi-spotify</v-icon>
              Open in Spotify
            </v-btn>
          </div>
        </v-img>
      </div>

      <!-- Winner Overlay -->
      <div v-if="isWinner" class="winner-overlay">
        <v-chip
          color="success"
          size="large"
          variant="elevated"
          class="winner-chip"
        >
          <v-icon class="mr-1">mdi-trophy</v-icon>
          Winner!
        </v-chip>
      </div>
    </div>

    <v-card class="mt-4" color="gray">
      <!-- Track Information -->
      <v-card-text class="track-info pa-4">
        <!-- Track Details -->
        <div class="track-details d-flex align-center mb-2">
          <v-chip
            size="small"
            variant="tonal"
            class="mr-2"
          >
            {{ formatDuration(track.duration_ms) }}
          </v-chip>

          <v-chip
            v-if="track.explicit"
            size="small"
            color="warning"
            variant="tonal"
            class="mr-2"
          >
            Explicit
          </v-chip>

          <v-chip
            size="small"
            variant="tonal"
            color="primary"
          >
            {{ track.popularity }}% Popular
          </v-chip>
        </div>

        <!-- Spotify Link -->
        <v-btn
          :href="track.external_urls.spotify"
          target="_blank"
          variant="text"
          size="small"
          color="success"
          class="mb-2"
        >
          <v-icon class="mr-1">mdi-spotify</v-icon>
          Open in Spotify
        </v-btn>
      </v-card-text>

      <!-- Vote Button -->
      <v-card-actions v-if="canVote" class="pt-0">
        <v-btn
          color="primary"
          size="large"
          block
          variant="elevated"
          @click.stop="handleVote"
          :disabled="isVoteDisabled"
        >
          <v-icon class="mr-2">mdi-heart</v-icon>
          Vote for This Track
        </v-btn>
      </v-card-actions>

      <!-- Vote Result -->
      <v-card-actions v-else-if="isWinner" class="pt-0">
        <v-alert
          type="success"
          variant="tonal"
          class="ma-0"
          density="compact"
          block
        >
          <v-icon class="mr-2">mdi-trophy</v-icon>
          You voted for this track!
        </v-alert>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

interface Props {
  track: SpotifyTrack
  side: 'left' | 'right'
  canVote?: boolean
  winnerId?: string | null
}

interface Emits {
  (e: 'vote', trackId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  canVote: true,
  winnerId: null
})

const emit = defineEmits<Emits>()

// Vuetify display breakpoints
const { mobile, smAndUp } = useDisplay()

// Computed
const artistNames = computed(() => {
  return props.track.artists.map(artist => artist.name).join(', ')
})

const isWinner = computed(() => {
  return props.winnerId === props.track.id
})

const isVoteDisabled = computed(() => {
  // Se não tem preview_url nem external_urls, desabilita voto
  return !props.track.preview_url && !props.track.external_urls?.spotify
})

// Generate Spotify embed URL from track ID
const embedUrl = computed(() => {
  if (!props.track.id) return null

  // Extract track ID if it's a full Spotify URI
  const trackId = props.track.id.includes(':')
    ? props.track.id.split(':').pop()
    : props.track.id

  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`
})

// Responsive embed height
const embedHeight = computed(() => {
  if (mobile.value) return '280'
  if (!smAndUp.value) return '320'
  return '352'
})

// Methods
const handleCardClick = () => {
  // Card click behavior - can be used for analytics or other actions
}

const handleVote = () => {
  emit('vote', props.track.id)
}

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.battle-music-card {
  position: relative;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
}

.battle-music-card.winner {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  border: 2px solid rgb(16, 185, 129);
}

.battle-card-left {
  transform-origin: right center;
}

.battle-card-right {
  transform-origin: left center;
}

.spotify-embed-container {
  position: relative;
  flex-shrink: 0;
}

.spotify-embed {
  display: block;
  transition: opacity 0.3s ease-in-out;
}

/* Fallback styles when embed is not available */
.embed-fallback {
  position: relative;
}

.fallback-image {
  filter: brightness(0.7);
}

.fallback-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}

.winner-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  pointer-events: none;
}

.winner-chip {
  animation: bounce 1s ease-in-out;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

.track-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.track-title {
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.track-artist {
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.track-album {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.track-details {
  flex-wrap: wrap;
  gap: 4px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .track-info {
    padding: 16px !important;
  }
}

@media (max-width: 960px) {
  .battle-music-card {
    margin-bottom: 16px;
  }

  .track-info {
    padding: 12px !important;
  }
}

@media (max-width: 600px) {
  .winner-overlay {
    top: 8px;
    left: 8px;
  }

  .winner-chip {
    font-size: 0.875rem;
  }
}
</style>
