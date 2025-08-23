<template>
  <div class="tournament-progress">
    <!-- Progress Bar -->
    <div class="mb-3">
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-body-2 font-weight-medium">Tournament Progress</span>
        <span class="text-body-2 text-medium-emphasis">
          {{ progress.progressPercentage.toFixed(0) }}%
        </span>
      </div>

      <v-progress-linear
        :model-value="progress.progressPercentage"
        :color="champion ? 'success' : 'primary'"
        height="8"
        rounded
        class="mb-2"
      />

      <div class="d-flex justify-space-between text-caption text-medium-emphasis">
        <span>{{ progress.battlesCompleted }} / {{ progress.battlesCompleted + progress.battlesRemaining }} battles</span>
        <span v-if="!champion">{{ progress.remainingTracks.length }} tracks remaining</span>
      </div>
    </div>

    <!-- Round Information -->
    <div v-if="!champion" class="mb-3">
      <v-chip
        :color="getRoundColor(progress.currentRound, progress.totalRounds)"
        variant="tonal"
        size="small"
        class="mr-2"
      >
        <v-icon start>{{ getRoundIcon(progress.currentRound, progress.totalRounds) }}</v-icon>
        {{ getRoundName(progress.currentRound, progress.totalRounds) }}
      </v-chip>

      <v-chip
        color="surface-variant"
        variant="tonal"
        size="small"
      >
        Round {{ progress.currentRound }} / {{ progress.totalRounds }}
      </v-chip>
    </div>

    <!-- Champion Display -->
    <div v-if="champion" class="champion-display">
      <v-chip
        color="yellow-darken-2"
        variant="tonal"
        size="small"
      >
        <v-icon start>mdi-crown</v-icon>
        Tournament Complete!
      </v-chip>
    </div>

    <!-- Remaining Tracks Preview -->
    <div v-if="!champion && progress.remainingTracks.length <= 4" class="remaining-tracks mt-3">
      <div class="text-caption text-medium-emphasis mb-2">Remaining tracks:</div>
      <div class="d-flex flex-wrap gap-1">
        <v-chip
          v-for="track in progress.remainingTracks"
          :key="track.id"
          size="x-small"
          variant="outlined"
          :title="track.name"
        >
          {{ truncateText(track.name, 20) }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TournamentProgress } from '../types/tournament.types'
import type { SpotifyTrack } from '@/features/spotify-integration/types/spotify.types'

interface Props {
  progress: TournamentProgress
  champion?: SpotifyTrack
}

defineProps<Props>()

const getRoundName = (currentRound: number, totalRounds: number): string => {
  const roundsFromEnd = totalRounds - currentRound + 1

  switch (roundsFromEnd) {
    case 1: return 'Final'
    case 2: return 'Semi-Final'
    case 3: return 'Quarter-Final'
    case 4: return 'Round of 8'
    case 5: return 'Round of 16'
    default: return `Round ${currentRound}`
  }
}

const getRoundColor = (currentRound: number, totalRounds: number): string => {
  const roundsFromEnd = totalRounds - currentRound + 1

  switch (roundsFromEnd) {
    case 1: return 'error'
    case 2: return 'warning'
    case 3: return 'info'
    default: return 'primary'
  }
}

const getRoundIcon = (currentRound: number, totalRounds: number): string => {
  const roundsFromEnd = totalRounds - currentRound + 1

  switch (roundsFromEnd) {
    case 1: return 'mdi-trophy'
    case 2: return 'mdi-medal'
    case 3: return 'mdi-star-circle'
    default: return 'mdi-sword-cross'
  }
}

const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>

<style scoped>
.tournament-progress {
  font-size: 0.875rem;
}

.champion-display {
  text-align: center;
  padding: 8px 0;
}

.remaining-tracks {
  max-height: 100px;
  overflow-y: auto;
}
</style>
