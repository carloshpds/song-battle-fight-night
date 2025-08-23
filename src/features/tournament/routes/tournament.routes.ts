import type { RouteRecordRaw } from 'vue-router'

const tournamentRoutes: RouteRecordRaw[] = [
  {
    path: '/tournament',
    name: 'TournamentList',
    component: () => import('../views/TournamentListView.vue'),
    meta: {
      title: 'Your Tournaments - Music Battle Fight Night',
      requiresAuth: true
    }
  },
  {
    path: '/tournament/:id',
    name: 'TournamentDetail',
    component: () => import('../views/TournamentDetailView.vue'),
    meta: {
      title: 'Tournament Details - Music Battle Fight Night',
      requiresAuth: true
    }
  }
]

export default tournamentRoutes
