import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

export const useTeamStore = defineStore('team', {
  state: () => ({
    teamUsers: [],
    loadingTeamUsers: false,
    loadedForTeamId: null,
    teamInvites: [],
    loadingTeamInvites: false,
    loadedInvitesForTeamId: null
  }),
  actions: {
    async inviteUser(payload) {
      return new Promise((resolve, reject) => {
        api.post(`/team/${payload.teamId}/invite`, payload)
          .then((response) => {
            resolve(response.data.data)
            console.log('response.data.data', response.data.data)
            this.teamInvites = this.teamInvites.concat(response.data.data.invite)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async fetchTeamUsers(teamId = null) {
      this.loadingTeamUsers = true

      try {
        // If no teamId provided, get current team from user store
        if (!teamId) {
          const userStore = useUserStore()
          const currentTeamId = userStore.currentTeamId
          if (!currentTeamId) {
            throw new Error('No team ID provided and no current team found')
          }
          teamId = currentTeamId
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
