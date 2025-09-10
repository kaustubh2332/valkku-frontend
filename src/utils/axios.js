// src/lib/api.js
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8333/api',
  timeout: 10_000,
  withCredentials: true, // send HttpOnly refresh cookie to /auth/refresh
  headers: { 'Content-Type': 'application/json' }
})

// ---- single-flight refresh ----
let refreshPromise = null
function isAuthEndpoint(url = '') {
  return url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/logout')
}
function tokenLikelyExpired(error) {
  const code = error?.response?.data?.error || error?.response?.data?.messageCode
  const www  = error?.response?.headers?.['www-authenticate'] || ''
  return code === 'token_expired' || /token expired/i.test(www) || /invalid_token/i.test(www)
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    const userStore = useUserStore()
    refreshPromise = api
      .post('/auth/refresh', null) // cookie sent automatically
      .then((res) => {
        const newToken = res?.data?.token
        if (!newToken) {
          throw new Error('No access token in refresh response')
        }
        if (userStore.setToken) {
          userStore.setToken(newToken)
        } else {
          userStore.token = newToken
        }
        return newToken
      })
      .catch((error) => {
        // clear auth state on refresh failure
        if (userStore.clearUser) {
          userStore.clearUser()
        }
        if (userStore.setToken) {
          userStore.setToken(null)
        } else {
          userStore.token = null
        }
        throw error
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

// ---- request interceptor ----
api.interceptors.request.use(async (config) => {
  const userStore = useUserStore()

  const token = (userStore.getToken && userStore.getToken()) || userStore.token
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  // custom header
  const user = (typeof userStore.getUser === 'function') ? userStore.getUser() : userStore.getUser
  const currentTeamId = user?.currentTeamId
  if (currentTeamId) {
    config.headers = config.headers || {}
    config.headers['x-current-team-id'] = currentTeamId
  }

  return config
})

// ---- response interceptor (auto-refresh + retry once) ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const original = error.config || {}
    const url = original.url || ''

    // Only attempt refresh on token-expired 401s, not on auth endpoints, and only once
    if (
      status === 401 &&
      !original._retry &&
      !isAuthEndpoint(url) &&
      tokenLikelyExpired(error)
    ) {
      original._retry = true
      try {
        const newToken = await refreshAccessToken()
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api.request(original)
      } catch (error) {
        console.error('Error refreshing access token:', error)
        // fall through to redirect below
      }
    }

    // Central handling
    if (status === 401) {
      if (!location.pathname.includes('/callback') && !location.pathname.includes('/login')) {
        location.href = '/login'
      }
    } else if (status === 403) {
      console.error('Access forbidden')
    } else if (
      status >= 500 &&
      !url.includes('/logout') &&
      !location.pathname.includes('/callback')
    ) {
      console.error('Server error:', error.response?.data)
    }

    throw error
  }
)

export default api

export function setupAxiosAuth() {
  // Interceptors are attached by importing this module.
}
