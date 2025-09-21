// src/lib/api.js
import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8333/api',
  timeout: 10_000,
  withCredentials: true, // send HttpOnly refresh cookie to /auth/refresh
  headers: { 'Content-Type': 'application/json' }
})

// ---- single-flight refresh ----
let refreshPromise = null
let refreshRetryCount = 0
const MAX_REFRESH_RETRIES = 3

function isAuthEndpoint(url = '') {
  return url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/logout')
}
function isAutoFetchUserEndpoint(url = '') {
  return url.includes('/user/me?periodic=true')
}
function tokenLikelyExpired(error) {
  console.log('Error:', error)
  const code = error?.response?.data?.code || error?.response?.data?.messageCode
  console.log('Code:', code)
  return code === 'token_expired' || code === 'unauthorized'
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    const userStore = useUserStore()
    refreshPromise = api
      .post('/auth/refresh') // cookie sent automatically
      .then((res) => {
        console.log('Refresh response:', res)
        const newToken = res?.data?.token
        if (!newToken) {
          throw new Error('No access token in refresh response')
        }

        userStore.setToken(newToken)
        refreshRetryCount = 0 // Reset retry count on success
        return newToken
      })
      .catch((error) => {
        refreshRetryCount++
        console.log(`Refresh attempt ${refreshRetryCount} failed:`, error)

        if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
          // clear auth state on final refresh failure
          console.log('Max refresh retries reached, clearing auth state')
          if (userStore.clearUser) {
            userStore.clearUser()
          }
          if (userStore.setToken) {
            userStore.setToken(null)
          } else {
            userStore.token = null
          }
          refreshRetryCount = 0 // Reset for next session
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

  const token = userStore.token || window.localStorage.getItem('valkku:accessToken')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ---- response interceptor (auto-refresh + retry up to 3 times) ----
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const original = error.config || {}
    const url = original.url || ''

    console.log('Status:', status)
    console.log('Original:', original)
    console.log('URL:', url)
    console.log('Is auth endpoint:', isAuthEndpoint(url))
    console.log('Token likely expired:', tokenLikelyExpired(error))
    console.log('Is auto fetch user endpoint:', isAutoFetchUserEndpoint(url))

    if(isAutoFetchUserEndpoint(url)) {
      return
    }

    // Only attempt refresh on token-expired 401s, not on auth endpoints
    if (
      status === 401 &&
      !isAuthEndpoint(url) &&
      tokenLikelyExpired(error)
    ) {
      // Check if we've already tried refreshing for this request
      if (original._refreshAttempted) {
        console.log('Refresh already attempted for this request')
      } else {
        console.log('Attempting to refresh access token')
        original._refreshAttempted = true

        try {
          const newToken = await refreshAccessToken()
          original.headers = original.headers || {}
          original.headers.Authorization = `Bearer ${newToken}`
          return api.request(original)
        } catch (refreshError) {
          console.error('Error refreshing access token:', refreshError)
          // If refresh failed and we've reached max retries, the user will be logged out
          // by the refreshAccessToken function, so we can proceed to redirect
        }
      }
    }

    // Central handling
    if (status === 401) {
      // Do not redirect on auth endpoint failures (e.g., signup/signin errors)
      // or when currently on public auth pages
      if (isAuthEndpoint(url) || location.pathname.includes('/signup') || location.pathname.includes('/signin')) {
        throw error
      }

      if (!location.pathname.includes('/callback')) {
        router.push('/signin')
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
