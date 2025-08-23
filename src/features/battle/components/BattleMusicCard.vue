<template>
  <v-card
    class="battle-music-card"
    :class="{
      'playing': isPlaying,
      'winner': isWinner,
      'battle-card-left': side === 'left',
      'battle-card-right': side === 'right'
    }"
    elevation="4"
    @click="handleCardClick"
  >
    <!-- Album Art -->
    <div class="card-image-container">
      <v-img
        :src="track.album.images[0]?.url"
        :alt="track.name"
        height="220"
        cover
        class="battle-card-image"
      >
        <!-- Play Overlay -->
        <div class="play-overlay">
          <v-btn
            icon
            size="x-large"
            color="white"
            elevation="4"
            @click.stop="handlePlayClick"
            :loading="isLoading"
          >
            <v-icon size="large">
              {{ isPlaying ? 'mdi-pause' : 'mdi-play' }}
            </v-icon>
          </v-btn>
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

        <!-- Preview Indicator -->
        <div v-if="isVoteDisabled" class="no-preview-overlay">
          <v-chip
            color="warning"
            size="small"
            variant="elevated"
          >
            <v-icon class="mr-1" size="small">mdi-music-off</v-icon>
            No Preview
          </v-chip>
        </div>
      </v-img>
    </div>

    <!-- Track Information -->
    <v-card-text class="track-info pa-4">
      <h3 class="track-title text-h6 mb-2" :title="track.name">
        {{ track.name }}
      </h3>

      <p class="track-artist text-body-2 text-medium-emphasis mb-2" :title="artistNames">
        {{ artistNames }}
      </p>

      <p class="track-album text-caption text-medium-emphasis mb-2" :title="track.album.name">
        {{ track.album.name }}
      </p>

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

      <!-- Progress Bar (when playing) -->
      <div v-if="isPlaying && progress !== undefined" class="progress-container mb-2">
        <v-progress-linear
          :model-value="progress"
          color="primary"
          height="4"
          rounded
        />
        <div class="d-flex justify-space-between text-caption mt-1">
          <span>{{ formattedCurrentTime }}</span>
          <span>{{ formattedDuration }}</span>
        </div>
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

interface Props {
  track: SpotifyTrack
  side: 'left' | 'right'
  isPlaying?: boolean
  canVote?: boolean
  isLoading?: boolean
  progress?: number
  formattedCurrentTime?: string
  formattedDuration?: string
  winnerId?: string | null // ✅ Add winner prop to show battle results
}

interface Emits {
  (e: 'vote', trackId: string): void
  (e: 'play', track: SpotifyTrack): void
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false,
  canVote: true,
  isLoading: false,
  progress: undefined,
  formattedCurrentTime: '0:00',
  formattedDuration: '0:30',
  winnerId: null // ✅ Default value for winnerId
})

const emit = defineEmits<Emits>()

// Computed
const artistNames = computed(() => {
  return props.track.artists.map(artist => artist.name).join(', ')
})

const isWinner = computed(() => {
  // ✅ Check if this track is the winner of the battle
  return props.winnerId === props.track.id
})

const isVoteDisabled = computed(() => {
  return !props.track.preview_url && !props.track.external_urls.spotify
})

// Methods
const handleCardClick = () => {
  if (props.track.preview_url && props.canVote) {
    handlePlayClick()
  }
}

const handlePlayClick = () => {
  if (props.track.preview_url) {
    emit('play', props.track)
  }
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
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  height: 100%;
  max-height: 550px; /* ✅ Limita altura máxima do card */
  display: flex;
  flex-direction: column;
}

.battle-music-card:hover {
  transform: translateY(-4px);
}

.battle-music-card.playing {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  border: 2px solid rgb(139, 92, 246);
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

.card-image-container {
  position: relative;
  flex-shrink: 0;
}

.battle-card-image {
  transition: filter 0.3s ease-in-out;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.battle-music-card:hover .play-overlay,
.battle-music-card.playing .play-overlay {
  opacity: 1;
}

.winner-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
}

.no-preview-overlay {
  position: absolute;
  top: 16px;
  right: 16px;
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

.progress-container {
  margin-top: auto;
}

@media (max-width: 1200px) {
  .battle-music-card {
    max-height: 500px; /* ✅ Altura intermediária para tablets */
  }
  
  .card-image-container {
    height: 200px; /* ✅ Altura intermediária da imagem */
  }
}

@media (max-width: 960px) {
  .battle-music-card {
    margin-bottom: 16px;
    max-height: 450px; /* ✅ Reduz altura máxima em mobile */
  }

  .card-image-container {
    height: 180px; /* ✅ Reduz altura da imagem em mobile */
  }
  
  /* ✅ Reduz padding do conteúdo em mobile */
  .battle-music-card .track-info {
    padding: 12px !important;
  }
}
</style>
