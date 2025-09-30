import { defineStore } from 'pinia'
import i18n from '@/i18n'
import router from '@/router'
import { useNotificationStore } from '@/stores/notification'
import { removeCurrentTeamFromLocalStorage, removeTokenFromLocalStorage, removeUserFromLocalStorage, saveTokenToLocalStorage, saveUserToLocalStorage } from '@/utils/auth'
import api from '@/utils/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    currentTeamId: null,
    currentRoleId: null,
    pendingClickCount: 0,
    batchTimer: null,
    fetchInterval: null,
    token: null,
  }),
  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    firstName: (state) => state.user?.firstName,
    lastName: (state) => state.user?.lastName,
    isStaff: (state) => ['owner', 'admin', 'coach'].includes(state.currentRoleId),
    currentTeam: (state) => state.user?.teams?.find(team => team.teamId === state.currentTeamId),
    currentRole: (state) => {
      if (!state.currentTeamId || !state.currentRoleId) {
        return null
      }
      const currentTeam = state.user?.teams?.find(team => team.teamId === state.currentTeamId)
      return currentTeam?.roles?.find(role => role.role === state.currentRoleId) || null
    },
    fullName: (state) => {
      return state.user?.firstName && state.user?.lastName
        ? state.user.firstName + ' ' + state.user.lastName
        : null
    }
  },
  actions: {
    setToken(token) {
      this.token = token
      saveTokenToLocalStorage(token)
    },
    setUser(user) {
      this.user = user
      saveUserToLocalStorage(user)
    },
    fetchUser(periodic = null) {
      return new Promise((resolve, reject) => {
        if(!this.token) {
          return
        }

        api.get(`/user/me${periodic ? '?periodic=true' : ''}`)
          .then((response) => {
            if(!response ||!response.data || !response.data.success || !response.data.data) {
              reject(new Error('Invalid response format from user endpoint'))
              return
            }

            const user = response.data.data.user
            const token = response.data.data.token

            this.setUser(user)
            this.setToken(token)

            const currentTeamId = window.localStorage.getItem('valkku:currentTeamId')
            const currentRole = window.localStorage.getItem('valkku:currentRole')

            if (currentTeamId) {
              this.setCurrentTeam(currentTeamId)

              if (currentRole) {
                this.setCurrentRole(currentRole)
              } else {
                const team = this.user.teams.find(team => team.teamId === currentTeamId)
                this.setCurrentRole(team?.roles[0]?.role)
              }
            } else if(this.user.teams && this.user.teams.length > 0) {
              const firstTeam = this.user.teams[0]
              if (firstTeam.roles && firstTeam.roles.length > 0) {
                this.setCurrentTeamAndRole(firstTeam.teamId, firstTeam.roles[0].role)
              } else {
                this.setCurrentTeam(firstTeam.teamId)
              }
            }

            if(this.user && this.user?.preferredLanguage && this.user?.preferredLanguage !== i18n.global.locale.value) {
              this.changeLocale(this.user?.preferredLanguage)
              window.localStorage.setItem('valkku:locale', this.user?.preferredLanguage)
            }


            resolve(user)
          })
          .catch((error) => {
            console.error('Failed to fetch user:', error)
            // Notification
            if(periodic) {
              return
            }
            if(this.token) {
              const notiStore = useNotificationStore()
              notiStore.handleBackendError(error)
              reject(error)
            }
          })
      })
    },
    signin({ email, password }) {
      return new Promise((resolve, reject) => {
        api.post('/auth/signin', { email, password })
          .then((response) => {
            this.setToken(response.data.data.token)
            resolve(response.data.data.token)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    logout() {
      // Clear any pending batch timer
      return new Promise((resolve, reject) => {
        api.post('/auth/logout')
          .then(() => {
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
          .finally(() => {
            this.finishLogout()
          })
      })
    },
    finishLogout(expired = false) {
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
        this.batchTimer = null
      }

      // Clear fetch interval
      this.stopPeriodicFetch()
      removeCurrentTeamFromLocalStorage()

      // Reset pending click count
      this.pendingClickCount = 0

      // Clear user data from store
      this.user = null
      this.currentTeamId = null
      this.currentRoleId = null
      this.token = null

      // Clear data from localStorage
      removeTokenFromLocalStorage()
      removeUserFromLocalStorage()

      // Redirect to home page using Vue Router
      if(expired) {
        router.push('/signin?exp=true')
      } else {
        router.push('/signin')
      }
    },
    startPeriodicFetch() {
      // Clear any existing interval
      this.stopPeriodicFetch()

      // Set up new interval to fetch user data every minute
      this.fetchInterval = setInterval(() => {
        this.fetchUser(true).catch(error => {
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
      }, 3000) // 3 seconds
    },

    setCurrentTeam(teamId) {
      this.currentTeamId = teamId
      window.localStorage.setItem('valkku:currentTeamId', teamId)
    },

    setCurrentRole(roleId) {
      this.currentRoleId = roleId
      window.localStorage.setItem('valkku:currentRole', roleId)
    },

    setCurrentTeamAndRole(teamId, roleId) {
      this.currentTeamId = teamId
      this.currentRoleId = roleId
      window.localStorage.setItem('valkku:currentTeamId', teamId)
      window.localStorage.setItem('valkku:currentRole', roleId)
    },

    async updateUser(updates) {
      try {
        const response = await api.patch('/user/me', updates)

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

    async updateUserDetails(payload) {
      try {
        const response = await api.patch('/user/details', payload)

        if (response.data && response.data.success) {
          // Update the user in the store with the complete response data
          this.setUser(response.data.data)
          return { success: true, data: response.data.data }
        } else {
          return { success: false, message: response.data?.message || 'Update failed' }
        }
      } catch (error) {
        console.error('Failed to update user details:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update user details'
        }
      }
    },

    joinTeam(payload) {
      return api.post('/team/join', payload)
        .then(response => {
          return response.data && response.data.success
            ? { success: true, data: response.data }
            : { success: false, message: response.data?.message || 'Join failed' }
        })
        .catch(error => {
          console.error('Failed to join team:', error)
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to join team'
          }
        })
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
        }
      } catch (error) {
        console.error('Failed to update emoji click count:', error)
        // Revert the pending clicks on error
        this.user.emojiClickedCount -= clicksToSend
        this.pendingClickCount += clicksToSend
      }
    },

    async changeLocale(locale) {
      try {
        // Update i18n locale immediately for responsive UI
        i18n.global.locale.value = locale

        // Save to localStorage
        localStorage.setItem('valkku:locale', locale)

        // Update user preference in backend if user is logged in
        if (this.user && this.token) {
          await this.updateUser({ preferredLanguage: locale })
        }

        return { success: true }
      } catch (error) {
        console.error('Failed to change locale:', error)
        return { success: false, error }
      }
    },

    clearCurrentTeam() {
      this.currentTeamId = null
      this.currentTeamName = null
    }

  }
})
