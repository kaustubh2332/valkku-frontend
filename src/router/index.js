import { createRouter, createWebHashHistory } from 'vue-router'
import { usePostHog } from '@/composables/usePostHog'

// Import your page components
import Calendar from '@/pages/Calendar.vue'
import Home from '@/pages/Home.vue'
import Library from '@/pages/Library.vue'
import Settings from '@/pages/Settings.vue'
import SignIn from '@/pages/SignIn.vue'
import Users from '@/pages/Users.vue'

import { useUserStore } from '@/stores/user'

import { decodeToken, getTokenFromLocalStorage, isTokenExpired } from '@/utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar
  },
  {
    path: '/signin',
    name: 'SignIn',
    meta: {
      hideSidebar: true,
      allowWithoutAuth: true,
      disallowWithAuth: true
    },
    component: SignIn
  },
  {
    path: '/join',
    name: 'Join',
    meta: {
      allowWithoutAuth: true,
      disallowWithAuth: false
    },
    component: () => import('@/pages/Join.vue')
  },
  {
    path: '/signup',
    name: 'SignUp',
    meta: {
      hideSidebar: true,
      allowWithoutAuth: true,
      disallowWithAuth: true
    },
    component: () => import('@/pages/SignUp.vue')
  },
  {
    path: '/add-details',
    name: 'AddDetails',
    meta: {
      hideSidebar: true,
      allowWithoutAuth: true,
      disallowWithAuth: true
    },
    component: () => import('@/pages/AddDetails.vue')
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
    meta: {
      roles: ['owner', 'admin']
    },
    component: Users
  },
  {
    path: '/library',
    name: 'Library',
    component: Library
  },
  {
    path: '/users/:userId',
    name: 'UserDetail',
    meta: {
      roles: ['owner', 'admin']
    },
    component: Users
  },
  {
    path: '/create-team',
    name: 'CreateTeam',
    component: () => import('@/pages/CreateTeam.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/pages/Admin.vue')
  }
]

const guardedRoutes = routes

// Helper function to validate and get token
function validateAndGetToken(userStore) {
  let token = userStore.token

  if(!token) {
    token = getTokenFromLocalStorage()
    if(token) {
      userStore.setToken(token)
    }
  }

  // Decode and validate token if it exists
  if (token) {
    // Check if token is expired
    if (isTokenExpired(token)) {
      userStore.finishLogout(true)
      return null
    }

    // Decode token for additional validation or logging
    const decodedToken = decodeToken(token)
    // You can access token payload here
    // Example: decodedToken.sub (user ID), decodedToken.email, etc.
    if (!decodedToken) {
      console.warn('Invalid token format')
      return null
    }
  }

  return token
}

// BEFORE EACH GUARD
function beforeEachGuard(to, from, next) {
  const userStore = useUserStore()
  const user = userStore.user
  const token = validateAndGetToken(userStore)

  // If no user and not going to callback, redirect to callback
  if (!token && !to.meta.allowWithoutAuth) {
    next('/signin')
    return
  }

  if(token && to.meta.disallowWithAuth) {
    next('/')
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
  if (user && !user?.pendingDetails && user?.teams?.length === 0 && to.path !== '/create-team' && to.path !== '/callback' && !to.meta.allowWithoutTeam) {
    next('/create-team')
    return
  }

  if(user && to.meta.roles && !to.meta.roles.includes(userStore?.currentRoleId)) {
    next('/')
    return
  }

  if(to.path === '/admin' && !user?.superAdmin) {
    next('/')
    return
  }

  next()
}

// Initialize PostHog
usePostHog()

const router = createRouter({
  history: createWebHashHistory(),
  routes: guardedRoutes,
  scrollBehavior() {
    // Always scroll to top when navigating to a new route
    return { top: 0 }
  }
})

router.beforeEach(beforeEachGuard)

export default router
