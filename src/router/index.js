/**
 * router/index.js
 *
 * Manual router configuration
 */

// Composables
import { authGuard } from '@auth0/auth0-vue'
import { createRouter, createWebHashHistory } from 'vue-router'

// Import your page components
import Home from '@/pages/Home.vue'
import Settings from '@/pages/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    beforeEnter: authGuard
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    beforeEnter: authGuard
  },
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/pages/Callback.vue'),
    beforeEnter: authGuard
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
