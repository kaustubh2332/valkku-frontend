import { defineStore } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

export const useTeamStore = defineStore('team', {
  state: () => ({
    teamUsers: [],
    loadingTeamUsers: false,
    loadedForTeamId: null,
    teamInvites: [],
    loadingTeamInvites: false,
    loadedInvitesForTeamId: null,
    searchQuery: ''
  }),
  actions: {
    async inviteUser(payload) {
      return new Promise((resolve, reject) => {
        api.post(`/team/${payload.teamId}/invite`, payload)
          .then((response) => {
            resolve(response.data.data)
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
    },
    deleteInvite({ teamId, userId }) {
      const notificationStore = useNotificationStore()
      return new Promise((resolve, reject) => {
        if (!teamId || !userId) {
          reject(new Error('Missing teamId or userId for deleteInvite'))
        }

        api.delete(`/team/${teamId}/user/${userId}`)
          .then((res) => {
            this.teamUsers = (this.teamUsers || []).filter(i => (i.userId || i.id) !== userId)
            resolve(res?.data)
          })
          .catch((error) => {
            reject(error)
            notificationStore.handleBackendError(error)
          })
      })

    },
    updateTeamUserRoles({ teamId, userId, roles }) {
      console.log(roles)
      const notificationStore = useNotificationStore()
      return new Promise((resolve, reject) => {
        if (!teamId) {
          const userStore = useUserStore()
          teamId = userStore.currentTeamId
        }

        roles = roles || []

        if (!teamId || !userId || !Array.isArray(roles)) {
          reject(new Error('Missing parameters for updateTeamUserRoles'))
          return
        }

        api.patch(`/team/${teamId}/user/${userId}/role`, { roles })
          .then(async (res) => {
            await this.fetchTeamUsers(teamId)
            resolve(res?.data)
          })
          .catch((error) => {
            notificationStore.handleBackendError(error)
            reject(error)
          })
      })
    },
    deleteUserTeamRole({ teamId, userId, role, guardianOf }) {
      const notificationStore = useNotificationStore()
      return new Promise((resolve, reject) => {
        if (!teamId) {
          const userStore = useUserStore()
          teamId = userStore.currentTeamId
        }

        if (!teamId || !userId || !role) {
          reject(new Error('Missing parameters for deleteUserTeamRole'))
          return
        }

        if (role === 'guardian' && !guardianOf) {
          reject(new Error('guardianOf parameter required for guardian role'))
          return
        }

        const url = `/team/${teamId}/user/${userId}/role/${role}${guardianOf ? `?guardianOf=${guardianOf}` : ''}`

        api.delete(url)
          .then(async (res) => {
            await this.fetchTeamUsers(teamId)
            resolve(res?.data)
          })
          .catch((error) => {
            notificationStore.handleBackendError(error)
            reject(error)
          })
      })
    },
    setSearchQuery(query) {
      this.searchQuery = query
    },
    leaveTeam({ teamId, userId }) {
      const notificationStore = useNotificationStore()
      const userStore = useUserStore()

      return new Promise((resolve, reject) => {
        if (!teamId) {
          teamId = userStore.currentTeamId
        }

        if (!teamId || !userId) {
          reject(new Error('Missing teamId or userId for leaveTeam'))
          return
        }

        api.delete(`/team/${teamId}/self/${userId}`)
          .then((res) => {
            // Clear team data and redirect to home
            this.teamUsers = []
            this.teamInvites = []
            this.loadedForTeamId = null
            this.loadedInvitesForTeamId = null
            userStore.clearCurrentTeam()
            resolve(res?.data)
          })
          .catch((error) => {
            notificationStore.handleBackendError(error)
            reject(error)
          })
      })
    }
  }
})
