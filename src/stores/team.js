import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

export const useTeamStore = defineStore('team', {
  state: () => ({
    teamUsers: [],
    loadingTeamUsers: false,
    loadedForTeamId: null
  }),
  actions: {
    async fetchTeamUsers(teamId = null) {
      this.loadingTeamUsers = true

      try {
        // If no teamId provided, get current team from user store
        if (!teamId) {
          const userStore = useUserStore()
          const user = userStore.getUser
          if (!user || !user.currentTeamId) {
            throw new Error('No team ID provided and no current team found')
          }
          teamId = user.currentTeamId
        }

        if(this.loadedForTeamId !== teamId) {
          this.teamUsers = []
          this.loadingTeamUsers = true
        }
        this.loadedForTeamId = teamId

        const response = await api.get(`/team/${teamId}/users`)
        // const response = await api.get(`/team/${teamId}/users`)

        if (response.data && response.data.success) {
          this.teamUsers = response.data.data
          return { success: true, data: response.data.data }
        } else {
          return { success: false, message: response.data?.message || 'Failed to fetch team users' }
        }
      } catch (error) {
        console.error('Error fetching team users:', error)
        return { success: false, message: error.response?.data?.message || 'Failed to fetch team users' }
      } finally {
        this.loadingTeamUsers = false
      }
    }
  }
})
