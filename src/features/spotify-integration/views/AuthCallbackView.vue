<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6">
        <v-card class="elevation-8 pa-8 text-center">
          <div v-if="isProcessing">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
              class="mb-4"
            />
            <v-card-title class="text-h5 mb-2">
              Connecting to Spotify...
            </v-card-title>
            <v-card-subtitle>
              Please wait while we complete the authentication process.
            </v-card-subtitle>
          </div>

          <div v-else-if="error">
            <v-icon color="error" size="64" class="mb-4">
              mdi-alert-circle
            </v-icon>
            <v-card-title class="text-h5 mb-2 text-error">
              Authentication Failed
            </v-card-title>
            <v-alert
              type="error"
              variant="tonal"
              class="mb-4 text-left"
            >
              {{ error }}
            </v-alert>

            <v-btn
              color="primary"
              @click="retryConnection"
              class="mr-2"
            >
              Try Again
            </v-btn>

            <v-btn
              color="secondary"
              variant="outlined"
              @click="goHome"
            >
              Go Home
            </v-btn>
          </div>

          <div v-else>
            <v-icon color="success" size="64" class="mb-4">
              mdi-check-circle
            </v-icon>
            <v-card-title class="text-h5 mb-2 text-success">
              Successfully Connected!
            </v-card-title>
            <v-card-subtitle class="mb-4">
              Welcome back! Redirecting you to import your music...
            </v-card-subtitle>

            <v-progress-linear
              indeterminate
              color="success"
              class="mb-4"
            />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSpotifyStore } from '../stores/spotifyStore'

const router = useRouter()
const route = useRoute()
const spotifyStore = useSpotifyStore()

const isProcessing = ref(true)
const error = ref<string | null>(null)

const handleCallback = async () => {
  try {
    const code = route.query.code as string
    const state = route.query.state as string
    const errorParam = route.query.error as string

    // Check for authentication errors
    if (errorParam) {
      throw new Error(`Spotify authentication error: ${errorParam}`)
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter')
    }

    // Process the authentication
    await spotifyStore.handleAuthCallback(code, state)

    // Success - redirect after a short delay
    setTimeout(() => {
      router.push('/spotify/import')
    }, 2000)

  } catch (err) {
    console.error('Authentication callback error:', err)
    error.value = err instanceof Error ? err.message : 'Unknown authentication error'
  } finally {
    isProcessing.value = false
  }
}

const retryConnection = () => {
  router.push('/spotify/connect')
}

const goHome = () => {
  router.push('/')
}

onMounted(() => {
  handleCallback()
})
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
