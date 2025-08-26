<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-8 pa-6 text-center">
          <v-card-title class="text-h4 mb-4">
            <v-icon color="success" size="x-large" class="mr-2">
              mdi-spotify
            </v-icon>
            Song Battle Fight Night
          </v-card-title>

          <v-card-subtitle class="text-h6 mb-6">
            Connect your Spotify account to start battling your favorite tracks!
          </v-card-subtitle>

          <div v-if="!isLoading && !error">
            <v-list class="mb-6">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-music-box-multiple</v-icon>
                </template>
                <v-list-item-title>Import your playlists</v-list-item-title>
                <v-list-item-subtitle>
                  Battle tracks from your favorite playlists
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="secondary">mdi-sword-cross</v-icon>
                </template>
                <v-list-item-title>Create epic battles</v-list-item-title>
                <v-list-item-subtitle>
                  Vote for your favorites in head-to-head matchups
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template #prepend>
                  <v-icon color="accent">mdi-trophy</v-icon>
                </template>
                <v-list-item-title>Track rankings</v-list-item-title>
                <v-list-item-subtitle>
                  See which songs dominate the battlefield
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-btn
              size="large"
              color="success"
              class="mb-4"
              @click="connectSpotify"
              block
              prepend-icon="mdi-spotify"
            >
              Connect with Spotify
            </v-btn>

            <p class="text-caption text-medium-emphasis">
              We only read your public playlists and track information.
              <br>
              We don't post anything to your account.
            </p>
          </div>

          <div v-else-if="isLoading" class="py-8">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
              class="mb-4"
            />
            <p class="text-h6">Connecting to Spotify...</p>
          </div>

          <div v-else-if="error" class="py-4">
            <v-alert
              type="error"
              variant="tonal"
              class="mb-4"
            >
              {{ error }}
            </v-alert>

            <v-btn
              color="primary"
              @click="clearError"
              variant="outlined"
            >
              Try Again
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyStore } from '../stores/spotifyStore'

const router = useRouter()
const spotifyStore = useSpotifyStore()

// Computed
const isLoading = computed(() => spotifyStore.isLoading)
const error = computed(() => spotifyStore.error)

// Methods
const connectSpotify = async () => {
  try {
    await spotifyStore.login()
  } catch (err) {
    console.error('Failed to connect to Spotify:', err)
  }
}

const clearError = () => {
  spotifyStore.clearError()
}

// Check if already authenticated
if (spotifyStore.isAuthenticated) {
  router.push('/spotify/import')
}
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
