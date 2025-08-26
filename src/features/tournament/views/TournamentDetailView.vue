<template>
  <v-container fluid>
    <!-- Loading State -->
    <div v-if="!tournament" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="mt-4 text-h6">Loading tournament...</p>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="d-flex align-center mb-6">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="$router.push('/tournaments')"
          class="mr-4"
        />

        <div class="flex-grow-1">
          <h1 class="text-h4 mb-2">{{ tournament.name }}</h1>
          <div class="d-flex align-center gap-3">
            <TournamentStatusBadge :status="tournament.status" />
            <span class="text-body-2 text-medium-emphasis">
              {{ tournament.tracks.length }} tracks • Created {{ formatDate(tournament.createdAt) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tournament Progress Card -->
      <v-card class="mb-6">
        <v-card-title>Tournament Progress</v-card-title>
        <v-card-text>
          <TournamentProgress
            :progress="tournament.progress"
            :champion="tournament.champion"
          />
        </v-card-text>
      </v-card>

      <!-- Champion Card -->
      <v-card v-if="tournament.champion" class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon color="yellow-darken-2" class="mr-2">mdi-crown</v-icon>
          Tournament Champion
        </v-card-title>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar class="mr-4" size="80">
              <v-img
                v-if="tournament.champion.album.images?.[0]?.url"
                :src="tournament.champion.album.images[0].url"
                :alt="tournament.champion.name"
              />
              <v-icon v-else size="large">mdi-music</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <h3 class="text-h5 mb-2">{{ tournament.champion.name }}</h3>
              <p class="text-h6 text-medium-emphasis mb-2">
                {{ tournament.champion.artists.map(a => a.name).join(', ') }}
              </p>
              <p class="text-body-2">
                Album: {{ tournament.champion.album.name }}
              </p>
              <v-btn
                v-if="tournament.champion.preview_url"
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-play"
                class="mt-2"
                @click="playPreview(tournament.champion.preview_url!)"
              >
                Play Preview
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Battle History -->
      <v-card v-if="tournament.battles.length > 0" class="mb-6">
        <v-card-title>Battle History</v-card-title>
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-4">
            <span class="text-body-1">{{ tournament.battles.length }} battles completed</span>
            <v-btn
              variant="outlined"
              size="small"
              @click="showAllBattles = !showAllBattles"
            >
              {{ showAllBattles ? 'Show Less' : 'Show All' }}
            </v-btn>
          </div>

          <v-list>
            <v-list-item
              v-for="(battle, index) in displayedBattles"
              :key="battle.id"
              class="battle-item"
            >
              <template #prepend>
                <v-avatar size="32" color="primary" class="mr-3">
                  <span class="text-body-2">{{ tournament.battles.length - index }}</span>
                </v-avatar>
              </template>

              <v-list-item-title class="d-flex align-center">
                <span
                  :class="{ 'font-weight-bold': battle.winner === battle.trackA.id }"
                  class="mr-2"
                >
                  {{ battle.trackA.name }}
                </span>
                <span class="text-medium-emphasis mx-2">vs</span>
                <span
                  :class="{ 'font-weight-bold': battle.winner === battle.trackB.id }"
                  class="ml-2"
                >
                  {{ battle.trackB.name }}
                </span>
              </v-list-item-title>

              <v-list-item-subtitle>
                Winner: {{ getWinnerName(battle) }} • {{ formatDate(battle.createdAt) }}
              </v-list-item-subtitle>

              <template #append>
                <v-icon color="success">mdi-trophy</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- Tournament Stats -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Tournament Statistics</v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-3">
                <span>Total Tracks:</span>
                <span class="font-weight-bold">{{ tournament.tracks.length }}</span>
              </div>
              <div class="d-flex justify-space-between mb-3">
                <span>Battles Completed:</span>
                <span class="font-weight-bold">{{ tournament.progress.battlesCompleted }}</span>
              </div>
              <div class="d-flex justify-space-between mb-3">
                <span>Current Round:</span>
                <span class="font-weight-bold">{{ tournament.progress.currentRound }} / {{ tournament.progress.totalRounds }}</span>
              </div>
              <div class="d-flex justify-space-between mb-3">
                <span>Tracks Remaining:</span>
                <span class="font-weight-bold">{{ tournament.progress.remainingTracks.length }}</span>
              </div>
              <div v-if="tournament.completedAt" class="d-flex justify-space-between">
                <span>Duration:</span>
                <span class="font-weight-bold">{{ getTournamentDuration(tournament) }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Remaining Tracks</v-card-title>
            <v-card-text>
              <div v-if="tournament.progress.remainingTracks.length === 0" class="text-center py-4">
                <v-icon size="48" color="medium-emphasis">mdi-check-circle</v-icon>
                <p class="mt-2">Tournament completed!</p>
              </div>
              <v-list v-else density="compact">
                <v-list-item
                  v-for="track in tournament.progress.remainingTracks.slice(0, 10)"
                  :key="track.id"
                >
                  <template #prepend>
                    <v-avatar size="24">
                      <v-img
                        v-if="track.album.images?.[0]?.url"
                        :src="track.album.images[0].url"
                        :alt="track.name"
                      />
                      <v-icon v-else size="small">mdi-music</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-truncate">{{ track.name }}</v-list-item-title>
                  <v-list-item-subtitle class="text-truncate">
                    {{ track.artists.map(a => a.name).join(', ') }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <div v-if="tournament.progress.remainingTracks.length > 10" class="text-center mt-2">
                <span class="text-caption text-medium-emphasis">
                  and {{ tournament.progress.remainingTracks.length - 10 }} more...
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <div class="text-center mt-6">
        <v-btn
          v-if="tournament.status === 'active' && tournament.progress.remainingTracks.length > 1"
          color="success"
          size="large"
          prepend-icon="mdi-sword-cross"
          @click="continueTournament"
        >
          Continue Tournament
        </v-btn>

        <v-btn
          v-if="tournament.status === 'completed'"
          color="primary"
          size="large"
          prepend-icon="mdi-restart"
          variant="outlined"
          class="ml-4"
          @click="restartTournament"
        >
          Start New Tournament
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../stores/tournamentStore'
import { useBattleStore } from '@/features/battle/stores/battleStore'
import TournamentStatusBadge from '../components/TournamentStatusBadge.vue'
import TournamentProgress from '../components/TournamentProgress.vue'
import type { Tournament } from '../types/tournament.types'
import type { Battle } from '@/features/battle/types/battle.types'

const route = useRoute()
const router = useRouter()
const tournamentStore = useTournamentStore()
const battleStore = useBattleStore()

const showAllBattles = ref(false)

const tournament = computed((): Tournament | undefined => {
  const tournamentId = route.params.id as string
  return tournamentStore.tournaments.find(t => t.id === tournamentId)
})

const displayedBattles = computed(() => {
  if (!tournament.value) return []

  const battles = [...tournament.value.battles].reverse() // Show most recent first
  return showAllBattles.value ? battles : battles.slice(0, 5)
})

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getWinnerName = (battle: Battle): string => {
  if (!battle.winner) return 'Unknown'

  return battle.winner === battle.trackA.id
    ? battle.trackA.name
    : battle.trackB.name
}

const getTournamentDuration = (tournament: Tournament): string => {
  if (!tournament.completedAt) return 'Ongoing'

  const start = new Date(tournament.createdAt)
  const end = new Date(tournament.completedAt)
  const diffMs = end.getTime() - start.getTime()

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

const playPreview = (previewUrl: string) => {
  // Simple implementation - could be enhanced with proper audio player
  const audio = new Audio(previewUrl)
  audio.play().catch(console.error)
}

const continueTournament = async () => {
  if (!tournament.value) return

  try {
    tournamentStore.continueTournament(tournament.value.id)

    // Get next matchup and start battle
    const nextMatchup = tournamentStore.getNextMatchup(tournament.value)

    if (nextMatchup) {
      await battleStore.loadTracksFromPlaylist(tournament.value.playlistId)
      router.push('/battle')
    }
  } catch (error) {
    console.error('Failed to continue tournament:', error)
  }
}

const restartTournament = () => {
  router.push('/spotify/import')
}

onMounted(() => {
  tournamentStore.initializeTournaments()

  // If tournament not found, redirect to tournaments list
  if (!tournament.value) {
    router.push('/tournaments')
  }
})
</script>

<style scoped>
.battle-item {
  border-left: 3px solid transparent;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.battle-item:hover {
  border-left-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>
