<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1200px"
    persistent
    scrollable
  >
    <v-card v-if="tournament" class="tournament-results-modal">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-6">
        <v-avatar class="mr-3" size="48">
          <v-img
            v-if="tournament.playlistData?.images?.[0]?.url"
            :src="tournament.playlistData.images[0].url"
            :alt="tournament.name"
          />
          <v-icon v-else>mdi-tournament</v-icon>
        </v-avatar>

        <div class="flex-grow-1">
          <h2 class="text-h5 mb-1">{{ tournament.name }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-0">Tournament Results</p>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <!-- Tournament Overview Stats -->
      <v-card-text class="pa-0">
        <v-container class="py-4">
          <v-row class="text-center">
            <v-col cols="6" md="3">
              <div class="text-h4 text-primary">{{ tournament.battles.length }}</div>
              <div class="text-caption text-medium-emphasis">Total Battles</div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-h4 text-success">{{ winnerTracks.length }}</div>
              <div class="text-caption text-medium-emphasis">Winners</div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-h4 text-error">{{ eliminatedTracks.length }}</div>
              <div class="text-caption text-medium-emphasis">Eliminated</div>
            </v-col>
            <v-col cols="6" md="3">
              <div class="text-h4 text-warning">{{ pendingTracks.length }}</div>
              <div class="text-caption text-medium-emphasis">Pending</div>
            </v-col>
          </v-row>
        </v-container>

        <!-- Search Bar -->
        <v-container class="py-2">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search tracks or artists..."
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </v-container>

        <!-- Content Tabs -->
        <v-tabs v-model="activeTab" color="primary" grow>
          <v-tab value="battles" prepend-icon="mdi-sword-cross">
            Battles ({{ filteredCompletedBattles.length }})
          </v-tab>
          <v-tab value="winners" prepend-icon="mdi-trophy">
            Winners ({{ filteredWinnerTracks.length }})
          </v-tab>
          <v-tab value="eliminated" prepend-icon="mdi-close-circle">
            Eliminated ({{ filteredEliminatedTracks.length }})
          </v-tab>
          <v-tab value="pending" prepend-icon="mdi-clock">
            Pending ({{ filteredPendingTracks.length }})
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-4">
          <!-- Battles Tab -->
          <v-window-item value="battles">
            <v-container>
              <div v-if="filteredCompletedBattles.length === 0" class="text-center py-8">
                <v-icon size="64" class="mb-4 text-medium-emphasis">mdi-sword-cross</v-icon>
                <p class="text-h6 text-medium-emphasis">
                  {{ searchQuery ? 'No battles match your search' : 'No battles completed yet' }}
                </p>
              </div>

              <v-row v-else>
                <v-col
                  v-for="(battle, index) in paginatedBattles"
                  :key="battle.id"
                  cols="12"
                  md="6"
                >
                  <v-card variant="outlined" class="battle-result-card">
                    <v-card-text>
                      <div class="d-flex justify-space-between align-center mb-3">
                        <v-chip size="small" variant="tonal">
                          Battle #{{ filteredCompletedBattles.length - index }}
                        </v-chip>
                        <span class="text-caption text-medium-emphasis">
                          {{ formatDate(battle.completedAt || battle.createdAt) }}
                        </span>
                      </div>

                      <div class="battle-matchup">
                        <!-- Track A -->
                        <div class="track-item" :class="{ 'winner': battle.winner === battle.trackA.id }">
                          <v-avatar size="40" class="mr-3">
                            <v-img :src="battle.trackA.album.images[0]?.url" />
                          </v-avatar>
                          <div class="flex-grow-1">
                            <div class="text-body-2 font-weight-medium">{{ battle.trackA.name }}</div>
                            <div class="text-caption text-medium-emphasis">
                              {{ battle.trackA.artists.map(a => a.name).join(', ') }}
                            </div>
                          </div>
                          <v-icon v-if="battle.winner === battle.trackA.id" color="success">
                            mdi-trophy
                          </v-icon>
                        </div>

                        <v-divider class="my-2" />

                        <!-- Track B -->
                        <div class="track-item" :class="{ 'winner': battle.winner === battle.trackB.id }">
                          <v-avatar size="40" class="mr-3">
                            <v-img :src="battle.trackB.album.images[0]?.url" />
                          </v-avatar>
                          <div class="flex-grow-1">
                            <div class="text-body-2 font-weight-medium">{{ battle.trackB.name }}</div>
                            <div class="text-caption text-medium-emphasis">
                              {{ battle.trackB.artists.map(a => a.name).join(', ') }}
                            </div>
                          </div>
                          <v-icon v-if="battle.winner === battle.trackB.id" color="success">
                            mdi-trophy
                          </v-icon>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Battles Pagination -->
              <div v-if="totalBattlePages > 1" class="d-flex justify-center mt-4">
                <v-pagination
                  v-model="battlePage"
                  :length="totalBattlePages"
                  :total-visible="5"
                />
              </div>
            </v-container>
          </v-window-item>

          <!-- Winners Tab -->
          <v-window-item value="winners">
            <v-container>
              <div v-if="filteredWinnerTracks.length === 0" class="text-center py-8">
                <v-icon size="64" class="mb-4 text-medium-emphasis">mdi-trophy-outline</v-icon>
                <p class="text-h6 text-medium-emphasis">
                  {{ searchQuery ? 'No winners match your search' : 'No winners yet' }}
                </p>
              </div>

              <v-row v-else>
                <v-col
                  v-for="track in paginatedWinners"
                  :key="track.id"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <v-card variant="outlined" class="track-card winner-card">
                    <v-card-text>
                      <div class="d-flex align-center">
                        <v-avatar size="60" class="mr-3">
                          <v-img :src="track.album.images[0]?.url" />
                        </v-avatar>
                        <div class="flex-grow-1">
                          <div class="text-body-1 font-weight-medium">{{ track.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ track.artists.map(a => a.name).join(', ') }}
                          </div>
                          <v-chip size="small" color="success" variant="tonal" class="mt-1">
                            <v-icon class="mr-1" size="small">mdi-trophy</v-icon>
                            {{ getTrackWins(track.id) }} wins
                          </v-chip>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Winners Pagination -->
              <div v-if="totalWinnerPages > 1" class="d-flex justify-center mt-4">
                <v-pagination
                  v-model="winnerPage"
                  :length="totalWinnerPages"
                  :total-visible="5"
                />
              </div>
            </v-container>
          </v-window-item>

          <!-- Eliminated Tab -->
          <v-window-item value="eliminated">
            <v-container>
              <div v-if="filteredEliminatedTracks.length === 0" class="text-center py-8">
                <v-icon size="64" class="mb-4 text-medium-emphasis">mdi-close-circle-outline</v-icon>
                <p class="text-h6 text-medium-emphasis">
                  {{ searchQuery ? 'No eliminated tracks match your search' : 'No tracks eliminated yet' }}
                </p>
              </div>

              <v-row v-else>
                <v-col
                  v-for="track in paginatedEliminated"
                  :key="track.id"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <v-card variant="outlined" class="track-card eliminated-card">
                    <v-card-text>
                      <div class="d-flex align-center">
                        <v-avatar size="60" class="mr-3">
                          <v-img :src="track.album.images[0]?.url" />
                        </v-avatar>
                        <div class="flex-grow-1">
                          <div class="text-body-1 font-weight-medium">{{ track.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ track.artists.map(a => a.name).join(', ') }}
                          </div>
                          <v-chip size="small" color="error" variant="tonal" class="mt-1">
                            <v-icon class="mr-1" size="small">mdi-close-circle</v-icon>
                            Eliminated
                          </v-chip>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Eliminated Pagination -->
              <div v-if="totalEliminatedPages > 1" class="d-flex justify-center mt-4">
                <v-pagination
                  v-model="eliminatedPage"
                  :length="totalEliminatedPages"
                  :total-visible="5"
                />
              </div>
            </v-container>
          </v-window-item>

          <!-- Pending Tab -->
          <v-window-item value="pending">
            <v-container>
              <div v-if="filteredPendingTracks.length === 0" class="text-center py-8">
                <v-icon size="64" class="mb-4 text-medium-emphasis">mdi-clock-outline</v-icon>
                <p class="text-h6 text-medium-emphasis">
                  {{ searchQuery ? 'No pending tracks match your search' : 'No tracks pending' }}
                </p>
              </div>

              <v-row v-else>
                <v-col
                  v-for="track in paginatedPending"
                  :key="track.id"
                  cols="12"
                  md="6"
                  lg="4"
                >
                  <v-card variant="outlined" class="track-card pending-card">
                    <v-card-text>
                      <div class="d-flex align-center">
                        <v-avatar size="60" class="mr-3">
                          <v-img :src="track.album.images[0]?.url" />
                        </v-avatar>
                        <div class="flex-grow-1">
                          <div class="text-body-1 font-weight-medium">{{ track.name }}</div>
                          <div class="text-caption text-medium-emphasis">
                            {{ track.artists.map(a => a.name).join(', ') }}
                          </div>
                          <v-chip size="small" color="warning" variant="tonal" class="mt-1">
                            <v-icon class="mr-1" size="small">mdi-clock</v-icon>
                            Waiting for battle
                          </v-chip>
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Pending Pagination -->
              <div v-if="totalPendingPages > 1" class="d-flex justify-center mt-4">
                <v-pagination
                  v-model="pendingPage"
                  :length="totalPendingPages"
                  :total-visible="5"
                />
              </div>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Tournament } from '../types/tournament.types'

interface TournamentResultsModalProps {
  modelValue: boolean
  tournament: Tournament | null
}

const props = defineProps<TournamentResultsModalProps>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Reactive state
const activeTab = ref('battles')
const searchQuery = ref('')

// Pagination state
const battlePage = ref(1)
const winnerPage = ref(1)
const eliminatedPage = ref(1)
const pendingPage = ref(1)
const itemsPerPage = 12

// Computed properties for data organization
const completedBattles = computed(() => {
  if (!props.tournament) return []
  return props.tournament.battles
    .filter(battle => battle.winner)
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
})

const eliminatedTracks = computed(() => {
  if (!props.tournament) return []
  return props.tournament.progress.eliminatedTracks || []
})

const pendingTracks = computed(() => {
  if (!props.tournament) return []

  const battleTrackIds = new Set()
  props.tournament.battles.forEach(battle => {
    battleTrackIds.add(battle.trackA.id)
    battleTrackIds.add(battle.trackB.id)
  })

  return props.tournament.tracks.filter(track => !battleTrackIds.has(track.id))
})

const winnerTracks = computed(() => {
  if (!props.tournament) return []

  const winnerTrackIds = new Set()
  props.tournament.battles
    .filter(battle => battle.winner)
    .forEach(battle => {
      winnerTrackIds.add(battle.winner)
    })

  return props.tournament.tracks.filter(track => winnerTrackIds.has(track.id))
})

// Search filtering
const filteredCompletedBattles = computed(() => {
  if (!searchQuery.value) return completedBattles.value

  const query = searchQuery.value.toLowerCase()
  return completedBattles.value.filter(battle =>
    battle.trackA.name.toLowerCase().includes(query) ||
    battle.trackB.name.toLowerCase().includes(query) ||
    battle.trackA.artists.some(artist => artist.name.toLowerCase().includes(query)) ||
    battle.trackB.artists.some(artist => artist.name.toLowerCase().includes(query))
  )
})

const filteredWinnerTracks = computed(() => {
  if (!searchQuery.value) return winnerTracks.value

  const query = searchQuery.value.toLowerCase()
  return winnerTracks.value.filter(track =>
    track.name.toLowerCase().includes(query) ||
    track.artists.some(artist => artist.name.toLowerCase().includes(query))
  )
})

const filteredEliminatedTracks = computed(() => {
  if (!searchQuery.value) return eliminatedTracks.value

  const query = searchQuery.value.toLowerCase()
  return eliminatedTracks.value.filter(track =>
    track.name.toLowerCase().includes(query) ||
    track.artists.some(artist => artist.name.toLowerCase().includes(query))
  )
})

const filteredPendingTracks = computed(() => {
  if (!searchQuery.value) return pendingTracks.value

  const query = searchQuery.value.toLowerCase()
  return pendingTracks.value.filter(track =>
    track.name.toLowerCase().includes(query) ||
    track.artists.some(artist => artist.name.toLowerCase().includes(query))
  )
})

// Pagination computed properties
const totalBattlePages = computed(() => Math.ceil(filteredCompletedBattles.value.length / itemsPerPage))
const totalWinnerPages = computed(() => Math.ceil(filteredWinnerTracks.value.length / itemsPerPage))
const totalEliminatedPages = computed(() => Math.ceil(filteredEliminatedTracks.value.length / itemsPerPage))
const totalPendingPages = computed(() => Math.ceil(filteredPendingTracks.value.length / itemsPerPage))

const paginatedBattles = computed(() => {
  const start = (battlePage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCompletedBattles.value.slice(start, end)
})

const paginatedWinners = computed(() => {
  const start = (winnerPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredWinnerTracks.value.slice(start, end)
})

const paginatedEliminated = computed(() => {
  const start = (eliminatedPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEliminatedTracks.value.slice(start, end)
})

const paginatedPending = computed(() => {
  const start = (pendingPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPendingTracks.value.slice(start, end)
})

// Helper methods
const getTrackWins = (trackId: string): number => {
  if (!props.tournament) return 0
  return props.tournament.battles.filter(battle => battle.winner === trackId).length
}

const formatDate = (date: Date | undefined): string => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.tournament-results-modal {
  max-height: 90vh;
}

.track-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.track-item.winner {
  background-color: rgba(var(--v-theme-success), 0.1);
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

.battle-result-card {
  border-left: 4px solid rgba(var(--v-theme-primary), 0.5);
}

.track-card {
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.track-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.winner-card {
  border-left: 4px solid rgba(var(--v-theme-success), 0.7);
}

.eliminated-card {
  border-left: 4px solid rgba(var(--v-theme-error), 0.7);
}

.pending-card {
  border-left: 4px solid rgba(var(--v-theme-warning), 0.7);
}
</style>
