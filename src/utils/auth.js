import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'
import { jwtDecode } from 'jwt-decode'

/**
 * Decodes a JWT token and returns the payload
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function decodeToken(token) {
  if (!token) {
    return null
  }

  try {
    const decoded = jwtDecode(token)
    return decoded
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

/**
 * Checks if a JWT token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return true
  }

  // JWT exp is in seconds, Date.now() is in milliseconds
  const currentTime = Date.now() / 1000
  return decoded.exp < currentTime
}

/**
 * Fetches user data from the backend bootstrap endpoint
 * @returns {Promise<Object>} User data from the backend
 * @throws {Error} If the bootstrap call fails
 */
export async function fetchUser() {
  try {
    const response = await api.get('/user')

    if (response.data && response.data.success && response.data.data) {
      return response.data.data
    } else {
      throw new Error('Invalid response format from bootstrap endpoint')
    }
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw error
  }
}

/**
 * Fetches user data and sets it in the user store
 * @returns {Promise<Object>} User data from the backend
 * @throws {Error} If the bootstrap call fails
 */
export async function fetchAndSetUser() {
  try {
    const userData = await fetchUser()
    const userStore = useUserStore()
    userStore.setUser(userData)
    return userData
  } catch (error) {
    console.error('Failed to fetch and set user:', error)
    throw error
  }
}

/**
 * Checks if user is authenticated by checking if user exists in store
 * @returns {boolean} True if user is authenticated
 */
export function isAuthenticated() {
  const userStore = useUserStore()
  return !!userStore.user
}

/**
 * Checks if user has pending details that need to be completed
 * @returns {boolean} True if user has pending details
 */
export function hasPendingDetails() {
  const userStore = useUserStore()
  const user = userStore.user
  return !!(user && user.pendingDetails)
}

/**
 * Saves user data to localStorage
 * @param {Object} userData - User data to save
 */
export function saveUserToLocalStorage(userData) {
  try {
    localStorage.setItem('valkku_user', JSON.stringify(userData))
  } catch (error) {
    console.error('Failed to save user to localStorage:', error)
  }
}

export function getTokenFromLocalStorage() {
  try {
    const token = localStorage.getItem('valkku:accessToken')
    return token
  } catch (error) {
    console.error('Failed to fetch token from localStorage:', error)
    return null
  }
}

export function saveTokenToLocalStorage(token) {
  if(!token) {
    return
  }

  try {
    localStorage.setItem('valkku:accessToken', token)
  } catch (error) {
    console.error('Failed to save token to localStorage:', error)
  }
}

export function removeTokenFromLocalStorage() {
  try {
    localStorage.removeItem('valkku:accessToken')
  } catch (error) {
    console.error('Failed to remove token from localStorage:', error)
  }
}


/**
 * Fetches user data from localStorage
 * @returns {Object|null} User data from localStorage or null if not found
 */
export function getUserFromLocalStorage() {
  try {
    const userData = localStorage.getItem('valkku_user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      return parsedUser
    }
    return null
  } catch (error) {
    console.error('Failed to fetch user from localStorage:', error)
    return null
  }
}

/**
 * Removes user data from localStorage
 */
export function removeUserFromLocalStorage() {
  try {
    localStorage.removeItem('valkku_user')
  } catch (error) {
    console.error('Failed to remove user from localStorage:', error)
  }
}

export async function saveCurrentTeamToLocalStorage(teamId) {
  try {
    localStorage.setItem('valkku:currentTeamId', teamId)
  } catch (error) {
    console.error('Failed to save current team to localStorage:', error)
  }
}

export async function removeCurrentTeamFromLocalStorage() {
  try {
    localStorage.removeItem('valkku:currentTeamId')
  } catch (error) {
    console.error('Failed to remove current team from localStorage:', error)
  }
}

export function getCurrentTeamFromLocalStorage() {
  try {
    const teamId = localStorage.getItem('valkku:currentTeamId')
    return teamId
  } catch (error) {
    console.error('Failed to fetch current team from localStorage:', error)
    return null
  }
}

/**
 * Fetches user data and sets it in the user store, also saves to localStorage
 * @returns {Promise<Object>} User data from the backend
 * @throws {Error} If the bootstrap call fails
 */
export async function fetchSetAndSaveUser() {
  try {
    const userData = await fetchUser()
    const userStore = useUserStore()
    userStore.setUser(userData)
    saveUserToLocalStorage(userData)
    return userData
  } catch (error) {
    console.error('Failed to fetch, set, and save user:', error)
    throw error
  }
}

/**
 * Loads user from localStorage and sets it in the user store
 * @returns {Object|null} User data if found, null otherwise
 */
export function loadUserFromLocalStorage() {
  try {
    const userData = getUserFromLocalStorage()
    if (userData) {
      const userStore = useUserStore()
      userStore.setUser(userData)
      return userData
    }
    return null
  } catch (error) {
    console.error('Failed to load user from localStorage:', error)
    return null
  }
}

/**
 * Centralized logout function that calls the user store logout method
 * This is the single source of truth for logout functionality
 */
export function logout() {
  const userStore = useUserStore()
  userStore.logout()
}
