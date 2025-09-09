import { defineStore } from 'pinia'
import { removeUserFromLocalStorage, saveUserToLocalStorage } from '@/utils/auth'
import api from '@/utils/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    pendingClickCount: 0,
    batchTimer: null,
    fetchInterval: null,
  }),

  getters: {
    getUser: (state) => state.user,
    firstName: (state) => state.user?.firstName,
    lastName: (state) => state.user?.lastName,
    fullName: (state) => {
      return state.user?.firstName && state.user?.lastName
        ? state.user.firstName + ' ' + state.user.lastName
        : null
    }
  },

  actions: {
    setUser(user) {
      this.user = user
      saveUserToLocalStorage(user)
    },
    fetchUser() {
      console.log('Fetching user')
      return new Promise((resolve, reject) => {
        api.get('/user').then((response) => {
          if (response.data && response.data.data) {
            this.setUser(response.data.data)
            resolve(response.data.data)
          } else {
            console.log('Invalid response format from user endpoint')
            reject(new Error('Invalid response format from user endpoint'))
          }
        })
      })
    },
    logout() {
      // Clear any pending batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
        this.batchTimer = null
      }

      // Clear fetch interval
      this.stopPeriodicFetch()

      // Reset pending click count
      this.pendingClickCount = 0

      // Clear user data
      this.user = null
      removeUserFromLocalStorage()
    },
    startPeriodicFetch() {
      // Clear any existing interval
      this.stopPeriodicFetch()

      // Set up new interval to fetch user data every minute
      this.fetchInterval = setInterval(() => {
        this.fetchUser().catch(error => {
          console.error('Periodic user fetch failed:', error)
        })
      }, 60_000) // 60 seconds = 1 minute
    },
    stopPeriodicFetch() {
      if (this.fetchInterval) {
        clearInterval(this.fetchInterval)
        this.fetchInterval = null
      }
    },
    incrementEmojiClickCount() {
      if (!this.user || this.user.emojiClickedCount === null || this.user.emojiClickedCount === undefined) {
        console.log('No user found in store or emojiClickedCount is null or undefined')
        return
      }

      // Update the count instantly in the frontend
      this.user.emojiClickedCount += 1
      this.pendingClickCount += 1

      // Clear existing timer if it exists
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
      }

      // Set a new timer to batch the API call
      this.batchTimer = setTimeout(() => {
        this.flushPendingClicks()
      }, 2000) // 2 seconds
    },

    async updateUser(updates) {
      try {
        const response = await api.patch('/user', updates)

        if (response.data && response.data.success) {
          // Update the user in the store with the complete response data
          this.setUser(response.data.data)
          return { success: true, data: response.data.data }
        } else {
          return { success: false, message: response.data?.message || 'Update failed' }
        }
      } catch (error) {
        console.error('Failed to update user:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update user'
        }
      }
    },

    async flushPendingClicks() {
      if (this.pendingClickCount === 0) {
        return
      }

      const clicksToSend = this.pendingClickCount
      this.pendingClickCount = 0
      this.batchTimer = null

      try {
        const result = await this.updateUser({
          emojiClickedCount: this.user.emojiClickedCount
        })

        if (!result.success) {
          // Revert the pending clicks on error
          this.user.emojiClickedCount -= clicksToSend
          this.pendingClickCount += clicksToSend
          console.log(`Reverted ${clicksToSend} clicks due to API error`)
        }
      } catch (error) {
        console.error('Failed to update emoji click count:', error)
        // Revert the pending clicks on error
        this.user.emojiClickedCount -= clicksToSend
        this.pendingClickCount += clicksToSend
        console.log(`Reverted ${clicksToSend} clicks due to API error`)
      }
    }

  }
})
