/**
 * router/index.js
 *
 * Manual router configuration
 */

// Composables
import { authGuard } from '@auth0/auth0-vue'
import { createRouter, createWebHistory } from 'vue-router'

// Import your page components
import Home from '@/pages/Home.vue'
import Profile from '@/pages/Profile.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    beforeEnter: authGuard
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    beforeEnter: authGuard
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
