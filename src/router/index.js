import { authGuard } from '@auth0/auth0-vue'
// import { jwtDecode } from 'jwt-decode'
import { createRouter, createWebHashHistory } from 'vue-router'

// Import your page components
import Home from '@/pages/Home.vue'
import Settings from '@/pages/Settings.vue'

import { useUserStore } from '@/stores/user'

import { getTokenFromLocalStorage } from '@/utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/signin',
    name: 'SignIn',
    meta: {
      hideSidebar: true,
      allowWithoutAuth: true
    },
    component: () => import('@/pages/Signin.vue')
  },
  {
    path: '/signup',
    name: 'SignUp',
    meta: {
      hideSidebar: true,
      allowWithoutAuth: true
    },
    component: () => import('@/pages/SignUp.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    meta: {
      allowWithoutDetails: true,
      allowWithoutTeam: true
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
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/pages/Users.vue')
  },
  {
    path: '/create-team',
    name: 'CreateTeam',
    component: () => import('@/pages/CreateTeam.vue')
  }
]

const guardedRoutes = routes.map(route => ({ ...route, beforeEnter: authGuard }))

// BEFORE EACH GUARD
function beforeEachGuard(to, from, next) {
  const userStore = useUserStore()
  const user = userStore.user
  let token = userStore.token

  if(!token) {
    token = getTokenFromLocalStorage()

    if(token) {
      userStore.setToken(token)
    }
  }

  // If no user and not going to callback, redirect to callback
  if (!token && !to.meta.allowWithoutAuth) {
    next('/signin')
    return
  }

  // If user exists and has pendingDetails, redirect to details (highest priority)
  if (user && user.pendingDetails && to.path !== '/details' && !to.meta.allowWithoutDetails) {
    next('/details')
    return
  }

  // If user exists and has no teams, redirect to create-team (but only if details are complete)
  if (user && !user.pendingDetails && user.teams.length === 0 && to.path !== '/create-team' && to.path !== '/callback' && !to.meta.allowWithoutTeam) {
    next('/create-team')
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
