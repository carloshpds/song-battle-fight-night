import type { RouteRecordRaw } from 'vue-router'

const battleRoutes: RouteRecordRaw[] = [
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('../views/BattleView.vue'),
    meta: {
      title: 'Battle Arena - Music Battle Fight Night',
      requiresSpotify: true
    }
  },
  {
    path: '/battle/import',
    name: 'BattleImport',
    component: () => import('@/features/spotify-integration/views/PlaylistImportView.vue'),
    meta: {
      title: 'Import Music - Music Battle Fight Night',
      requiresSpotify: true
    }
  }
]

export default battleRoutes
