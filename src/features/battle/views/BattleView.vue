<template>
  <v-container fluid class="pa-0">
    <!-- Header -->
    <v-app-bar color="primary" dark elevation="4">
      <v-app-bar-title>
        <v-icon class="mr-2">mdi-sword-cross</v-icon>
        Music Battle Fight Night
      </v-app-bar-title>

      <v-spacer />

      <v-btn
        icon="mdi-playlist-plus"
        @click="$router.push('/spotify/import')"
        title="Import more music"
      />

      <v-btn
        icon="mdi-trophy"
        @click="showLeaderboard = true"
        title="View leaderboard"
      />
    </v-app-bar>

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
      <div v-else-if="currentBattle" class="battle-arena">
        <div class="battle-header text-center mb-6">
          <h1 class="text-h4 mb-2">Choose Your Champion!</h1>
          <p class="text-body-1 text-medium-emphasis">
            Battle {{ battleCount + 1 }} • {{ availableTracks.length }} tracks loaded
          </p>
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
        <div class="battle-controls text-center mt-6">
          <v-btn
            variant="outlined"
            color="secondary"
            @click="skipBattle"
            class="mr-4"
          >
            <v-icon class="mr-2">mdi-skip-next</v-icon>
            Skip Battle
          </v-btn>

          <v-btn
            v-if="currentBattle.winner"
            color="success"
            size="large"
            @click="nextBattle"
          >
            <v-icon class="mr-2">mdi-sword-cross</v-icon>
            Next Battle
          </v-btn>
        </div>
      </div>

      <!-- No Current Battle -->
      <div v-else class="text-center py-12">
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBattleStore } from '../stores/battleStore'
import { useSpotifyStore } from '@/features/spotify-integration/stores/spotifyStore'
import BattleMusicCard from '../components/BattleMusicCard.vue'
import LeaderboardDialog from '../components/LeaderboardDialog.vue'

const router = useRouter()
const battleStore = useBattleStore()
const spotifyStore = useSpotifyStore()

// Reactive state
const showStats = ref(false)
const showLeaderboard = ref(false)

// Computed
const currentBattle = computed(() => battleStore.currentBattle)
const availableTracks = computed(() => battleStore.availableTracks)
const battleCount = computed(() => battleStore.battleCount)
const isLoading = computed(() => battleStore.isLoading)
const error = computed(() => battleStore.error)

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
  } catch (err) {
    console.error('Failed to vote for track:', err)
  }
}

const skipBattle = () => {
  battleStore.skipBattle()
  startNewBattle()
}

const nextBattle = () => {
  startNewBattle()
}

// Initialize on mount
onMounted(() => {
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
</style>
