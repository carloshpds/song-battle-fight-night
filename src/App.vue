<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSpotifyStore } from '@/features/spotify-integration/stores/spotifyStore'
import { useBattleStore } from '@/features/battle/stores/battleStore'

// Initialize stores
const spotifyStore = useSpotifyStore()
const battleStore = useBattleStore()

onMounted(async () => {
  // Initialize authentication state
  await spotifyStore.initializeAuth()

  // Initialize battle store
  battleStore.initializeBattle()
})
</script>

<style>
html {
  overflow-y: auto;
}

.v-application {
  font-family: 'Roboto', sans-serif;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}
</style>
