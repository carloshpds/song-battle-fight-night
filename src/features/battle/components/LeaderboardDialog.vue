<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-trophy</v-icon>
        Leaderboard
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider />

      <v-card-text style="height: 500px;">
        <div v-if="leaderboard.length === 0" class="text-center py-8">
          <v-icon size="64" class="mb-4 text-medium-emphasis">
            mdi-trophy-outline
          </v-icon>
          <h3 class="text-h6 mb-2">No battles yet!</h3>
          <p class="text-body-2 text-medium-emphasis">
            Start some battles to see the leaderboard.
          </p>
        </div>

        <v-list v-else>
          <v-list-item
            v-for="(entry, index) in leaderboard"
            :key="entry.track.id"
            class="leaderboard-item"
          >
            <template #prepend>
              <div class="rank-badge">
                <v-avatar
                  :color="getRankColor(entry.rank)"
                  :size="index < 3 ? 40 : 32"
                >
                  <v-icon v-if="entry.rank === 1" color="white">mdi-trophy</v-icon>
                  <v-icon v-else-if="entry.rank === 2" color="white">mdi-medal</v-icon>
                  <v-icon v-else-if="entry.rank === 3" color="white">mdi-medal-outline</v-icon>
                  <span v-else class="text-body-2 font-weight-bold">{{ entry.rank }}</span>
                </v-avatar>
              </div>
            </template>

            <template #default>
              <div class="d-flex align-center">
                <v-avatar size="48" class="mr-3">
                  <v-img
                    v-if="entry.track.album.images?.[0]?.url"
                    :src="entry.track.album.images[0].url"
                    :alt="entry.track.name"
                  />
                  <v-icon v-else>mdi-music</v-icon>
                </v-avatar>

                <div class="flex-grow-1">
                  <v-list-item-title class="font-weight-medium">
                    {{ entry.track.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ entry.track.artists.map(a => a.name).join(', ') }}
                  </v-list-item-subtitle>
                </div>

                <div class="stats-section text-right">
                  <div class="score-display mb-1">
                    <span class="text-h6 font-weight-bold text-primary">
                      {{ entry.score }}
                    </span>
                    <span class="text-caption text-medium-emphasis ml-1">pts</span>
                  </div>

                  <div class="win-rate">
                    <v-chip
                      :color="getWinRateColor(entry.stats.winRate)"
                      size="small"
                      variant="tonal"
                    >
                      {{ Math.round(entry.stats.winRate) }}% wins
                    </v-chip>
                  </div>
                </div>
              </div>

              <!-- Detailed Stats (Expandable) -->
              <v-expand-transition>
                <div v-if="expandedItems.has(entry.track.id)" class="mt-3 pt-3 border-t">
                  <v-row dense>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h6 text-success font-weight-bold">
                          {{ entry.stats.wins }}
                        </div>
                        <div class="text-caption text-medium-emphasis">Wins</div>
                      </div>
                    </v-col>

                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h6 text-error font-weight-bold">
                          {{ entry.stats.losses }}
                        </div>
                        <div class="text-caption text-medium-emphasis">Losses</div>
                      </div>
                    </v-col>

                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h6 font-weight-bold">
                          {{ entry.stats.totalBattles }}
                        </div>
                        <div class="text-caption text-medium-emphasis">Total</div>
                      </div>
                    </v-col>

                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-caption text-medium-emphasis">Last Battle</div>
                        <div class="text-body-2">
                          {{ formatDate(entry.stats.lastBattleAt) }}
                        </div>
                      </div>
                    </v-col>
                  </v-row>

                  <div class="mt-2">
                    <v-btn
                      :href="entry.track.external_urls.spotify"
                      target="_blank"
                      variant="text"
                      size="small"
                      color="success"
                    >
                      <v-icon class="mr-1">mdi-spotify</v-icon>
                      Open in Spotify
                    </v-btn>
                  </div>
                </div>
              </v-expand-transition>
            </template>

            <template #append>
              <v-btn
                :icon="expandedItems.has(entry.track.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                variant="text"
                size="small"
                @click="toggleExpanded(entry.track.id)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          color="error"
          variant="outlined"
          @click="showResetDialog = true"
        >
          Reset Stats
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          @click="$emit('update:modelValue', false)"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Reset Confirmation Dialog -->
    <v-dialog v-model="showResetDialog" max-width="400">
      <v-card>
        <v-card-title>Reset Statistics?</v-card-title>
        <v-card-text>
          This will permanently delete all battle history and track statistics.
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showResetDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmReset">Reset</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBattleStore } from '../stores/battleStore'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

defineProps<Props>()
defineEmits<Emits>()

const battleStore = useBattleStore()

// State
const expandedItems = ref<Set<string>>(new Set())
const showResetDialog = ref(false)

// Computed
const leaderboard = computed(() => battleStore.leaderboard)

// Methods
const toggleExpanded = (trackId: string) => {
  if (expandedItems.value.has(trackId)) {
    expandedItems.value.delete(trackId)
  } else {
    expandedItems.value.add(trackId)
  }
}

const getRankColor = (rank: number): string => {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return 'primary'
}

const getWinRateColor = (winRate: number): string => {
  if (winRate >= 80) return 'success'
  if (winRate >= 60) return 'warning'
  if (winRate >= 40) return 'orange'
  return 'error'
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

const confirmReset = () => {
  battleStore.resetBattleData()
  showResetDialog.value = false
}
</script>

<style scoped>
.leaderboard-item {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 16px;
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.rank-badge {
  margin-right: 16px;
}

.stats-section {
  min-width: 120px;
}

.score-display {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
}

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Custom colors for medals */
.v-avatar.gold {
  background: linear-gradient(45deg, #FFD700, #FFA500);
}

.v-avatar.silver {
  background: linear-gradient(45deg, #C0C0C0, #A8A8A8);
}

.v-avatar.bronze {
  background: linear-gradient(45deg, #CD7F32, #B8860B);
}
</style>
