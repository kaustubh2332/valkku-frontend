import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

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
    console.log('User set in store:', userData)
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
  return !!userStore.getUser
}

/**
 * Checks if user has pending details that need to be completed
 * @returns {boolean} True if user has pending details
 */
export function hasPendingDetails() {
  const userStore = useUserStore()
  const user = userStore.getUser
  return !!(user && user.pendingDetails)
}

/**
 * Saves user data to localStorage
 * @param {Object} userData - User data to save
 */
export function saveUserToLocalStorage(userData) {
  try {
    localStorage.setItem('valkku_user', JSON.stringify(userData))
    console.log('User saved to localStorage:', userData)
  } catch (error) {
    console.error('Failed to save user to localStorage:', error)
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
      console.log('User fetched from localStorage:', parsedUser)
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
    console.log('User removed from localStorage')
  } catch (error) {
    console.error('Failed to remove user from localStorage:', error)
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
    console.log('User fetched, set in store, and saved to localStorage:', userData)
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
      console.log('User loaded from localStorage and set in store:', userData)
      return userData
    }
    return null
  } catch (error) {
    console.error('Failed to load user from localStorage:', error)
    return null
  }
}
