<template>
  <v-card
    class="tournament-card"
    :class="{ 'tournament-card--completed': tournament.status === 'completed' }"
    hover
    @click="$emit('continue', tournament.id)"
  >
    <v-card-title class="d-flex align-center">
      <v-avatar class="mr-3" size="48">
        <v-img
          v-if="tournament.playlistData?.images?.[0]?.url"
          :src="tournament.playlistData.images[0].url"
          :alt="tournament.name"
        />
        <v-icon v-else color="primary">mdi-music-box-multiple</v-icon>
      </v-avatar>

      <div class="flex-grow-1">
        <div class="text-h6 text-truncate">{{ tournament.name }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ tournament.tracks.length }} tracks
        </div>
      </div>

      <TournamentStatusBadge :status="tournament.status" />
    </v-card-title>

    <v-card-text>
      <!-- Progress Section -->
      <TournamentProgress
        :progress="tournament.progress"
        :champion="tournament.champion"
        class="mb-3"
      />

      <!-- Tournament Info -->
      <div class="tournament-info">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2 text-medium-emphasis">Created:</span>
          <span class="text-body-2">{{ formatDate(tournament.createdAt) }}</span>
        </div>

        <div v-if="tournament.lastBattleAt" class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2 text-medium-emphasis">Last battle:</span>
          <span class="text-body-2">{{ formatDate(tournament.lastBattleAt) }}</span>
        </div>

        <div v-if="tournament.status === 'completed' && tournament.completedAt" class="d-flex justify-space-between align-center">
          <span class="text-body-2 text-medium-emphasis">Completed:</span>
          <span class="text-body-2">{{ formatDate(tournament.completedAt) }}</span>
        </div>
      </div>
    </v-card-text>

    <!-- Champion Section -->
    <v-card-text v-if="tournament.champion" class="pt-0">
      <v-divider class="mb-3" />
      <div class="champion-section">
        <div class="text-subtitle2 mb-2 d-flex align-center">
          <v-icon color="yellow-darken-2" class="mr-2">mdi-crown</v-icon>
          Champion
        </div>
        <div class="d-flex align-center">
          <v-avatar class="mr-3" size="40">
            <v-img
              v-if="tournament.champion.album.images?.[0]?.url"
              :src="tournament.champion.album.images[0].url"
              :alt="tournament.champion.name"
            />
            <v-icon v-else>mdi-music</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ tournament.champion.name }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ tournament.champion.artists.map(a => a.name).join(', ') }}
            </div>
          </div>
        </div>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer />

      <v-menu>
        <template #activator="{ props }">
          <v-btn
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            v-bind="props"
            @click.stop
          />
        </template>

        <v-list density="compact">
          <v-list-item
            v-if="tournament.status !== 'completed'"
            @click="$emit('pause', tournament.id)"
            :disabled="tournament.status === 'paused'"
          >
            <template #prepend>
              <v-icon>mdi-pause</v-icon>
            </template>
            <v-list-item-title>Pause Tournament</v-list-item-title>
          </v-list-item>

          <v-list-item
            v-if="tournament.status === 'paused'"
            @click="$emit('resume', tournament.id)"
          >
            <template #prepend>
              <v-icon>mdi-play</v-icon>
            </template>
            <v-list-item-title>Resume Tournament</v-list-item-title>
          </v-list-item>

          <v-list-item
            @click="$emit('delete', tournament.id)"
            class="text-error"
          >
            <template #prepend>
              <v-icon>mdi-delete</v-icon>
            </template>
            <v-list-item-title>Delete Tournament</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        :color="tournament.status === 'completed' ? 'primary' : 'success'"
        variant="elevated"
        @click.stop="$emit('continue', tournament.id)"
      >
        <v-icon class="mr-2">
          {{ tournament.status === 'completed' ? 'mdi-trophy' : 'mdi-sword-cross' }}
        </v-icon>
        {{ tournament.status === 'completed' ? 'View Results' : 'Continue Battle' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'
import TournamentProgress from './TournamentProgress.vue'
import TournamentStatusBadge from './TournamentStatusBadge.vue'
import type { Tournament } from '../types/tournament.types'

interface Props {
  tournament: Tournament
}

interface Emits {
  continue: [tournamentId: string]
  pause: [tournamentId: string]
  resume: [tournamentId: string]
  delete: [tournamentId: string]
}

defineProps<Props>()
defineEmits<Emits>()

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.tournament-card {
  transition: transform 0.2s ease-in-out;
}

.tournament-card:hover {
  transform: translateY(-2px);
}

.tournament-card--completed {
  border-left: 4px solid rgb(var(--v-theme-success));
}

.champion-section {
  background-color: rgba(var(--v-theme-primary), 0.1);
  border-radius: 8px;
  padding: 12px;
}

.tournament-info {
  font-size: 0.875rem;
}
</style>
