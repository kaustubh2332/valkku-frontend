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
        // Get token from Auth0 for every request
        const token = await auth0Instance.getAccessTokenSilently({
          audience: 'https://valkku.eu.auth0.com/api/v2/'
        });
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get access token:', error)
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
      // Unauthorized - redirect to login or refresh token
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden')
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data)
    }

    return Promise.reject(error)
  }
)

export default api
