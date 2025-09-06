import { defineStore } from 'pinia'
import api from '@/utils/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    pendingClickCount: 0,
    batchTimer: null,
  }),

  getters: {
    getUser: (state) => state.user
  },

  actions: {
    setUser(user) {
      this.user = user
    },

    incrementEmojiClickCount() {
      if (!this.user || this.user.emojiClickedCount === null || this.user.emojiClickedCount === undefined) {
        console.log('No user found in store or emojiClickedCount is null or undefined')
        return
      }

      // Update the count instantly in the frontend
      this.user.emojiClickedCount += 1
      this.pendingClickCount += 1
      console.log('Emoji click count updated instantly:', this.user.emojiClickedCount)

      // Clear existing timer if it exists
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
      }

      // Set a new timer to batch the API call
      this.batchTimer = setTimeout(() => {
        this.flushPendingClicks()
      }, 5000) // 5 seconds
    },

    async flushPendingClicks() {
      if (this.pendingClickCount === 0) {
        return
      }

      const clicksToSend = this.pendingClickCount
      this.pendingClickCount = 0
      this.batchTimer = null

      try {
        const response = await api.patch('/user', {
          emojiClickedCount: this.user.emojiClickedCount
        })

        if (response.data && response.data.success) {
          // Update the user in the store with the complete response data
          this.user = response.data.data
          console.log(`Emoji click count synced with backend: ${clicksToSend} clicks sent, total: ${response.data.data.emojiClickedCount}`)
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
