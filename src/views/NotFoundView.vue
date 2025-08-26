<template>
  <v-container class="text-center">
    <v-row justify="center" align="center" style="min-height: 50vh;">
      <v-col>
        <v-icon size="120" color="error" class="mb-4">mdi-music-off</v-icon>
        <h1 class="text-h3 mb-4">404 - Page Not Found</h1>
        <p class="text-h6 text-medium-emphasis mb-6">
          The page you're looking for doesn't exist.
        </p>
        <v-btn color="primary" size="large" to="/">
          Go Home
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// 404 page
</script>
