import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.profile,
    userName: (state) => state.profile?.name || '',
    userEmail: (state) => state.profile?.email || ''
  },

  actions: {
    setProfile(profile) {
      this.profile = profile
      this.error = null
    },

    setLoading(loading) {
      this.isLoading = loading
    },

    setError(error) {
      this.error = error
      this.isLoading = false
    },

    clearProfile() {
      this.profile = null
      this.error = null
      this.isLoading = false
    }
  }
})
