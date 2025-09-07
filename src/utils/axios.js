import axios from 'axios'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8333/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Function to setup axios with Auth0 instance
export function setupAxiosWithAuth0(auth0Instance) {
  // Request interceptor to add auth token
  api.interceptors.request.use(
    async (config) => {
      try {
        // Check if user is authenticated before trying to get token
        if (auth0Instance.isAuthenticated.value) {
          const token = await auth0Instance.getAccessTokenSilently({
            audience: 'https://valkku.eu.auth0.com/api/v2/'
          });
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
      } catch (error) {
        // Only log error if it's not related to missing refresh token during logout
        if (!error.message?.includes('Missing Refresh Token')) {
          console.error('Failed to get access token:', error)
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common HTTP errors
    if (error.response?.status === 401) {
      // Unauthorized - only redirect if not already on login/callback page
      if (!window.location.pathname.includes('/callback') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden')
    } else if (error.response?.status >= 500 && // Server error - only log if it's not during logout process
      !error.config?.url?.includes('/logout') && !window.location.pathname.includes('/callback')) {
        console.error('Server error:', error.response.data)
      }

    return Promise.reject(error)
  }
)

export default api
