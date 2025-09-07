import { authGuard } from '@auth0/auth0-vue'
import { createRouter, createWebHashHistory } from 'vue-router'

// Import your page components
import Home from '@/pages/Home.vue'
import Settings from '@/pages/Settings.vue'

import { useUserStore } from '@/stores/user'

import { getUserFromLocalStorage } from '@/utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/settings',
    name: 'Settings',
    meta: {
      allowWithoutDetails: true
    },
    component: Settings
  },
  {
    path: '/callback',
    name: 'Callback',
    component: () => import('@/pages/Callback.vue')
  },
  {
    path: '/details',
    name: 'Details',
    component: () => import('@/pages/Details.vue')
  }
]

const guardedRoutes = routes.map(route => ({ ...route, beforeEnter: authGuard }))

// BEFORE EACH GUARD
function beforeEachGuard(to, from, next) {
  const userStore = useUserStore()
  let user = userStore.getUser

  if(!user) {
    user = getUserFromLocalStorage()
    if(user) {
      userStore.setUser(user)
    }
  }

  // If no user and not going to callback, redirect to callback
  if (!user && to.path !== '/callback') {
    next('/callback')
    return
  }

  // If user exists and has pendingDetails, redirect to details
  if (user && user.pendingDetails && to.path !== '/details' && !to.meta.allowWithoutDetails) {
    next('/details')
    return
  }

  // TODO: (LATER) IF NO TEAMS ASK FOR CODE

  next()
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: guardedRoutes
})

router.beforeEach(beforeEachGuard)

export default router
