import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Import feature routes
import battleRoutes from '@/features/battle/routes/battle.routes'
import spotifyRoutes from '@/features/spotify-integration/routes/spotify.routes'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/spotify/connect'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: 'Music Battle Fight Night'
    }
  },
  // Feature routes
  ...battleRoutes,
  ...spotifyRoutes,
  // Catch all route - 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '404 - Page Not Found'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  // Update document title
  const title = to.meta?.title as string
  if (title) {
    document.title = title
  }

  next()
})

export default router
