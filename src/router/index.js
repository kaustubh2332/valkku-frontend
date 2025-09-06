
import { authGuard, useAuth0 } from '@auth0/auth0-vue'
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
  },
  {
    path: '/details',
    name: 'Details',
    component: () => import('@/pages/Callback.vue'),
    beforeEnter: authGuard
  }
]

// BEFORE EACH GUARD
function beforeEachGuard(to, from, next) {
  console.log('beforeEachGuard', to, from)
  console.log('isAuthenticated', useAuth0().isAuthenticated)
  // TODO: IF NO USER GO TO /callback
  // TODO: IF PENDING DETAILS GO TO /details
  // TODO: (LATER) IF NO TEAMS ASK FOR CODE

  next()
}

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(beforeEachGuard)

export default router
