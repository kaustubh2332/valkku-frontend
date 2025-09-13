import { createRouter, createWebHashHistory } from 'vue-router'

// Import your page components
import Home from '@/pages/Home.vue'
import Settings from '@/pages/Settings.vue'
import SignIn from '@/pages/Signin.vue'
import Users from '@/pages/Users.vue'

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
    component: SignIn
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
    path: '/callback',
    name: 'Callback',
    meta: {
      hideSidebar: false,
    },
    component: () => import('@/pages/Callback.vue')
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
    path: '/users',
    name: 'Users',
    component: Users
  },
  {
    path: '/create-team',
    name: 'CreateTeam',
    component: () => import('@/pages/CreateTeam.vue')
  }
]

const guardedRoutes = routes

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

  if(token && !user && to.path !== '/callback') {
    next({
      path: '/callback',
      query: { redirect: to.fullPath }
    })
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
