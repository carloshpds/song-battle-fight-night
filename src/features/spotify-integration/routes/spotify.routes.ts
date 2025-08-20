import type { RouteRecordRaw } from 'vue-router'

const spotifyRoutes: RouteRecordRaw[] = [
  {
    path: '/spotify/connect',
    name: 'SpotifyConnect',
    component: () => import('../views/SpotifyConnectView.vue'),
    meta: {
      title: 'Connect Spotify - Music Battle Fight Night'
    }
  },
  {
    path: '/spotify/import',
    name: 'SpotifyImport',
    component: () => import('../views/PlaylistImportView.vue'),
    meta: {
      title: 'Import from Spotify - Music Battle Fight Night',
      requiresSpotify: true
    }
  },
  {
    path: '/auth/callback',
    name: 'SpotifyCallback',
    component: () => import('../views/AuthCallbackView.vue'),
    meta: {
      title: 'Connecting to Spotify...'
    }
  }
]

export default spotifyRoutes
