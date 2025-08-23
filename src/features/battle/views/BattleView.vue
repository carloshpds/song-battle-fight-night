<template>
  <v-container fluid class="pa-0">

    <!-- Tournament Progress Section -->
    <div v-if="isTournamentActive && tournamentProgress" class="tournament-progress-section">
      <v-container>
        <v-card color="surface" class="mb-4">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-tournament</v-icon>
              Tournament: {{ activeTournament?.name }}
            </div>
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-chart-line"
              @click="showTournamentResults = true"
            >
              View Results
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="12" md="12">
                <div class="mb-3">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>Progress</span>
                    <span>{{ tournamentProgress.progressPercentage.toFixed(1) }}%</span>
                  </div>
                  <v-progress-linear
                    :model-value="tournamentProgress.progressPercentage"
                    color="primary"
                    height="8"
                    rounded
                  />
                </div>

                <v-row class="text-center">
                  <v-col cols="3">
                    <div class="text-h6">{{ tournamentProgress.currentRound }}</div>
                    <div class="text-caption text-medium-emphasis">Round</div>
                  </v-col>
                  <v-col cols="3">
                    <div class="text-h6">{{ tournamentProgress.remainingTracks.length }}</div>
                    <div class="text-caption text-medium-emphasis">Remaining</div>
                  </v-col>
                  <v-col cols="3">
                    <div class="text-h6">{{ tournamentProgress.battlesCompleted }}</div>
                    <div class="text-caption text-medium-emphasis">Battles</div>
                  </v-col>
                  <v-col cols="3">
                    <div class="text-h6">{{ tournamentProgress.eliminatedTracks.length }}</div>
                    <div class="text-caption text-medium-emphasis">Eliminated</div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-container>
    </div>

    <!-- Tournament Completed Section -->
    <div v-if="isTournamentCompleted && tournamentChampion" class="tournament-completed-section">
      <v-container>
        <v-card color="success" class="mb-4" variant="tonal">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="success">mdi-trophy</v-icon>
              Tournament Complete!
            </div>
            <v-btn
              variant="outlined"
              size="small"
              prepend-icon="mdi-chart-line"
              color="success"
              @click="showTournamentResults = true"
            >
              View Results
            </v-btn>
          </v-card-title>

          <v-card-text>
            <div class="text-center py-4">
              <v-avatar size="80" class="mb-4">
                <v-img :src="tournamentChampion.album.images[0]?.url" />
              </v-avatar>
              <h2 class="text-h5 mb-2">🏆 {{ tournamentChampion.name }}</h2>
              <p class="text-body-1 mb-4">by {{ tournamentChampion.artists.map(a => a.name).join(', ') }}</p>

              <div class="d-flex justify-center gap-3 mt-6">
                <v-btn
                  color="primary"
                  size="large"
                  @click="recreateTournament"
                  prepend-icon="mdi-restart"
                >
                  Recreate Tournament
                </v-btn>

                <v-btn
                  color="success"
                  size="large"
                  variant="outlined"
                  @click="$router.push('/spotify/import')"
                  prepend-icon="mdi-plus"
                >
                  New Tournament
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-container>
    </div>

    <!-- Main Battle Area -->
    <div class="battle-container">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="mt-4 text-h6">Loading battle...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
        <h2 class="text-h5 mb-4">{{ error }}</h2>
        <v-btn color="primary" @click="initializeBattle">Try Again</v-btn>
      </div>

      <!-- No Tracks State -->
      <div v-else-if="availableTracks.length === 0" class="text-center py-12">
        <v-icon size="64" class="mb-4 text-medium-emphasis">mdi-music-off</v-icon>
        <h2 class="text-h5 mb-4">No Tracks Available</h2>
        <p class="text-body-1 mb-6 text-medium-emphasis">
          Import some music from Spotify to start battling!
        </p>
        <v-btn color="primary" size="large" @click="$router.push('/spotify/import')">
          Import Music
        </v-btn>
      </div>

      <!-- Battle Arena -->
      <div v-else-if="currentBattle && !isTournamentCompleted" class="battle-arena">
        <div class="battle-header text-center mb-6">
        </div>

        <v-row class="battle-cards" no-gutters justify="center">
          <!-- Track A -->
          <v-col cols="12" md="5" class="pa-2">
            <battle-music-card
              :track="currentBattle.trackA"
              side="left"
              @vote="voteForTrack"
              :can-vote="!currentBattle.winner"
              :winner-id="currentBattle.winner"
            />
          </v-col>

          <!-- VS Divider -->
          <v-col cols="12" md="2" class="d-flex align-center justify-center pa-2">
            <div class="vs-divider">
              <v-chip
                size="x-large"
                color="primary"
                variant="elevated"
                class="text-h4 font-weight-bold"
              >
                VS
              </v-chip>
            </div>
          </v-col>

          <!-- Track B -->
          <v-col cols="12" md="5" class="pa-2">
            <battle-music-card
              :track="currentBattle.trackB"
              side="right"
              @vote="voteForTrack"
              :can-vote="!currentBattle.winner"
              :winner-id="currentBattle.winner"
            />
          </v-col>
        </v-row>

        <!-- Battle Controls -->
        <!-- <div class="battle-controls text-center mt-6">
          <v-btn
            variant="outlined"
            color="secondary"
            @click="skipBattle"
            class="mr-4"
          >
            <v-icon class="mr-2">mdi-skip-next</v-icon>
            Skip Battle
          </v-btn>

        </div> -->
      </div>

      <!-- No Current Battle -->
      <div v-else-if="!isTournamentCompleted" class="text-center py-12">
        <v-icon size="64" class="mb-4 text-primary">mdi-sword-cross</v-icon>
        <h2 class="text-h5 mb-4">Ready for Battle!</h2>
        <p class="text-body-1 mb-6 text-medium-emphasis">
          {{ availableTracks.length }} tracks loaded and ready to fight.
        </p>
        <v-btn color="primary" size="large" @click="startNewBattle">
          <v-icon class="mr-2">mdi-play</v-icon>
          Start Battle
        </v-btn>
      </div>
    </div>

    <!-- Battle Stats Sidebar (Hidden on mobile) -->
    <v-navigation-drawer
      v-model="showStats"
      location="right"
      temporary
      width="300"
    >
      <v-list>
        <v-list-item>
          <v-list-item-title class="text-h6">Battle Stats</v-list-item-title>
        </v-list-item>
        <v-divider />

        <v-list-item>
          <v-list-item-title>Total Battles</v-list-item-title>
          <v-list-item-subtitle>{{ battleCount }}</v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <v-list-item-title>Tracks Available</v-list-item-title>
          <v-list-item-subtitle>{{ availableTracks.length }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Leaderboard Dialog -->
    <leaderboard-dialog v-model="showLeaderboard" />

    <!-- Tournament Results Modal -->
    <tournament-results-modal
      v-model="showTournamentResults"
      :tournament="activeTournament"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBattleStore } from '../stores/battleStore'
import { useSpotifyStore } from '@/features/spotify-integration/stores/spotifyStore'
import { useTournamentStore } from '@/features/tournament/stores/tournamentStore'
import BattleMusicCard from '../components/BattleMusicCard.vue'
import LeaderboardDialog from '../components/LeaderboardDialog.vue'
import TournamentResultsModal from '@/features/tournament/components/TournamentResultsModal.vue'

const router = useRouter()
const battleStore = useBattleStore()
const spotifyStore = useSpotifyStore()
const tournamentStore = useTournamentStore()

// Reactive state
const showStats = ref(false)
const showLeaderboard = ref(false)
const showTournamentResults = ref(false)

// Computed
const currentBattle = computed(() => battleStore.currentBattle)
const availableTracks = computed(() => battleStore.availableTracks)
const battleCount = computed(() => battleStore.battleCount)
const isLoading = computed(() => battleStore.isLoading)
const error = computed(() => battleStore.error)

// Tournament computeds
const activeTournament = computed(() => tournamentStore.activeTournament)
const tournamentProgress = computed(() => activeTournament.value?.progress)
const isTournamentActive = computed(() => activeTournament.value?.status === 'active')
const isTournamentCompleted = computed(() => activeTournament.value?.status === 'completed')
const tournamentChampion = computed(() => activeTournament.value?.champion)

// Methods
const initializeBattle = () => {
  // Check authentication
  if (!spotifyStore.isAuthenticated) {
    router.push('/spotify/connect')
    return
  }

  // Initialize battle store
  battleStore.initializeBattle()

  // If no tracks available, redirect to import
  if (availableTracks.value.length === 0) {
    router.push('/spotify/import')
  }
}

const startNewBattle = () => {
  try {
    battleStore.startNewBattle()
  } catch (err) {
    console.error('Failed to start new battle:', err)
  }
}

const voteForTrack = (trackId: string) => {
  try {
    battleStore.voteForTrack(trackId)

    setTimeout(() => {
      startNewBattle()
    }, 2000)
  } catch (err) {
    console.error('Failed to vote for track:', err)
  }
}

const recreateTournament = async () => {
  if (!activeTournament.value) return

  try {
    // Create a new tournament with the same tracks
    const newTournament = await tournamentStore.createTournament({
      playlistId: activeTournament.value.playlistId,
      playlistName: `${activeTournament.value.name} (Rematch)`,
      tracks: activeTournament.value.tracks
    })

    console.log('🎯 New tournament created:', newTournament.name)

    // Initialize battle with new tournament
    initializeBattle()
  } catch (err) {
    console.error('Failed to recreate tournament:', err)
    // Show error using battleStore's error handling
    battleStore.clearError()
  }
}

// Initialize on mount
onMounted(() => {
  // Initialize both stores
  tournamentStore.initializeTournaments()
  initializeBattle()
})
</script>

<style scoped>
.battle-container {
  max-width: 1000px; /* ✅ Reduz largura máxima do container */
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.battle-arena {
  margin-top: 32px;
}

.battle-cards {
  min-height: 450px; /* ✅ Reduz altura mínima dos cards */
}

.vs-divider {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px; /* ✅ Reduz altura mínima do divisor */
}

@media (max-width: 960px) {
  .vs-divider {
    writing-mode: horizontal-tb;
    margin: 16px 0;
  }

  .battle-cards {
    min-height: auto;
  }
}

.battle-controls {
  margin-top: 32px;
}

.tournament-progress-section {
  background: rgba(var(--v-theme-surface-variant), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.tournament-completed-section {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.1) 0%, rgba(var(--v-theme-success), 0.05) 100%);
  border-bottom: 1px solid rgba(var(--v-theme-success), 0.2);
}
</style>
