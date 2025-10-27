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
const MAX_REFRESH_RETRIES = 3

function isAuthEndpoint(url = '') {
  return url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/logout')
}
function isAutoFetchUserEndpoint(url = '') {
  return url.includes('/user/me?periodic=true')
}
function tokenLikelyExpired(error) {
  const code = error?.response?.data?.code || error?.response?.data?.messageCode
  return code === 'token_expired' || code === 'unauthorized'
}

async function refreshAccessToken(suppressLogoutOnFail = false) {
  if (!refreshPromise) {
    const userStore = useUserStore()
    refreshPromise = (async () => {
      let lastError
      for (let attempt = 1; attempt <= MAX_REFRESH_RETRIES; attempt++) {
        try {
          // Refresh token is sent automatically via HTTP-only cookie
          const res = await api.post('/auth/refresh')
          const newToken = res?.data?.token

          if (!newToken) {
            throw new Error('No access token in refresh response')
          }

          userStore.setToken(newToken)

          return newToken
        } catch (error) {
          lastError = error
          if (attempt === MAX_REFRESH_RETRIES) {
            // Fully clear auth state and navigate to signin
            if (!suppressLogoutOnFail) {
              if (typeof userStore.finishLogout === 'function') {
                userStore.finishLogout(true)
              } else {
                // Fallback: clear token only
                if (typeof userStore.setToken === 'function') {
                  userStore.setToken(null)
                } else {
                  userStore.token = null
                }
              }
            }
            throw lastError
          }
        }
      }
    })()
      .finally(() => {
        refreshPromise = null
      })
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

    if(isAutoFetchUserEndpoint(url)) {
      // For auto-fetch user endpoints, do a non-fatal background refresh to keep session alive
      if (status === 401 && tokenLikelyExpired(error)) {
        // Fire-and-forget; never logs the user out on failure
        refreshAccessToken(true).catch(() => {})
      }
      // Never redirect or propagate for periodic checks
      return
    }

    // Only attempt refresh on token-expired 401s, not on auth endpoints
    if (
      status === 401 &&
      !isAuthEndpoint(url) &&
      tokenLikelyExpired(error) &&
      !original._refreshAttempted
    ) {
      original._refreshAttempted = true

      try {
        // Wait for refresh (either our attempt or a concurrent one)
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

    // Central handling
    if (status === 401) {
      // Do not redirect on auth endpoint failures (e.g., signup/signin errors)
      // or when currently on public auth pages
      if (isAuthEndpoint(url) || location.pathname.includes('/signup') || location.pathname.includes('/signin')) {
        throw error
      }

      if (!location.pathname.includes('/callback')) {
        // Only redirect with exp=true if refresh token has expired
        // Check if this is a refresh token expiration (not just access token)
        const isRefreshTokenExpired = url.includes('/auth/refresh') ||
          (original._refreshAttempted && tokenLikelyExpired(error))

        if (isRefreshTokenExpired) {
          router.push('/signin?exp=true')
        } else {
          // Regular 401 (access token expired but refresh token still valid)
          router.push('/signin')
        }
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
