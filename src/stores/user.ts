import { defineStore } from 'pinia'
import i18n from '@/i18n'
import router from '@/router'
import { useNotificationStore } from '@/stores/notification'
import { removeCurrentRoleFromLocalStorage, removeCurrentTeamFromLocalStorage, removeTokenFromLocalStorage, removeUserFromLocalStorage, saveTokenToLocalStorage, saveUserToLocalStorage } from '@/utils/auth'
import api from '@/utils/axios'

import type { PublicUser } from '@/types/user'
import type { PublicUserSelf } from '@/types/user'
import type { ROLES } from '@/types/team'

interface UserState {
  user: PublicUserSelf | null
  currentTeamId: string | null
  currentRole: {
    role: ROLES
    guardianOf?: string
    guardianOfEmail?: string
    guardianOfFullName?: string
  } | null
  pendingClickCount: number
  batchTimer: ReturnType<typeof setTimeout> | null
  fetchInterval: ReturnType<typeof setInterval> | null
  token: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    currentTeamId: null,
    currentRole: null,
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
    isStaff: (state) => ['owner', 'admin', 'coach'].includes(state.currentRole?.role as string),
    currentTeam: (state) => state.user?.teams?.find(team => team.teamId === state.currentTeamId),
    fullName: (state) => {
      return state.user?.firstName && state.user?.lastName
        ? state.user.firstName + ' ' + state.user.lastName
        : null
    },
    guardianOfId: state => {
      return state.currentRole?.guardianOf
    }
  },
  actions: {
    setToken(token: string) {
      this.token = token
      saveTokenToLocalStorage(token)
    },
    setUser(user: PublicUser) {
      this.user = user
      saveUserToLocalStorage(user)
    },
    fetchUser(periodic: boolean = false) {
      console.log('[UserStore] fetchUser called, periodic:', periodic)
      return new Promise((resolve, reject) => {
        if(!this.token) {
          console.log('[UserStore] No token available, returning early')
          return
        }

        const endpoint = `/user/me${periodic ? '?periodic=true' : ''}`

        api.get(endpoint)
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
            const currentRoleString = window.localStorage.getItem('valkku:currentRole') as string;
            const currentRoleFull = currentRoleString ? JSON.parse(currentRoleString) as any : null;
            const currentRole = currentRoleFull ? {
              role: currentRoleFull.role,
              guardianOf: currentRoleFull.guardianOf,
              guardianOfEmail: currentRoleFull.guardianOfEmail,
              guardianOfFullName: currentRoleFull.guardianOfFullName
            } : null;

            if (currentTeamId) {
              console.log('[UserStore] Found stored team ID:', currentTeamId)
              let team = this.user!.teams.find(team => team.teamId === currentTeamId)
              if(team) {
                console.log('[UserStore] Team found in user teams:', team.teamName)
                this.setCurrentTeam(currentTeamId)

                // Check if the stored currentRole exists in this team's roles
                if (currentRole) {
                  console.log('[UserStore] Checking stored role:', currentRole)
                  const hasRole = team.roles?.some(role => role.role === currentRole.role && role.guardianOf === currentRole.guardianOf)
                  if (hasRole) {
                    this.setCurrentRole(currentRole)
                  } else {
                    // Role doesn't exist in this team, use first available role
                    this.setCurrentRole(team.roles?.[0] || null)
                  }
                } else {
                  // No stored role, use first available role
                  this.setCurrentRole(team.roles?.[0] || null)
                }
              } else {
                // Stored team doesn't exist, use first team
                team = this.user!.teams[0]
                this.setCurrentTeam(team.teamId)
                this.setCurrentRole(team.roles?.[0] || null)
              }
            } else if(this.user!.teams && this.user!.teams.length > 0) {
              const firstTeam = this.user!.teams[0]
              if (firstTeam.roles && firstTeam.roles.length > 0) {
                this.setCurrentTeam(firstTeam.teamId)
                this.setCurrentRole(firstTeam.roles[0] || null)
              } else {
                console.log('[UserStore] First team has no roles')
                this.setCurrentTeam(firstTeam.teamId)
              }
            } else {
              console.log('[UserStore] User has no teams')
            }

            if(this.user && this.user?.preferredLanguage && this.user?.preferredLanguage !== i18n.global.locale.value) {
              console.log('[UserStore] Changing locale from', i18n.global.locale.value, 'to', this.user?.preferredLanguage)
              this.changeLocale(this.user?.preferredLanguage)
              window.localStorage.setItem('valkku:locale', this.user?.preferredLanguage)
            } else {
              console.log('[UserStore] Locale unchanged:', i18n.global.locale.value)
            }

            console.log('[UserStore] Final state:', {
              currentTeamId: this.currentTeamId,
              currentRole: this.currentRole,
              locale: i18n.global.locale.value
            })

            console.log('[UserStore] fetchUser completed successfully')
            resolve(user)
          })
          .catch((error) => {
            console.error('[UserStore] Failed to fetch user:', error)
            console.error('[UserStore] Error details:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status,
              stack: error.stack
            })
            console.log('[UserStore] Error message JSON:', JSON.stringify(error.message))

            if(error.message.includes('Unexpected token')) {
              console.log('[UserStore] Unexpected token error, finishing logout')
              this.finishLogout()
              return
            }

            // Notification
            if(periodic) {
              console.log('[UserStore] Periodic fetch, not showing notification')
              return
            }
            if(this.token) {
              console.log('[UserStore] Showing error notification')
              const notiStore = useNotificationStore()
              notiStore.handleBackendError(error)
              reject(error)
            } else {
              console.log('[UserStore] No token, not showing notification')
            }
          })
      })
    },
    signin({ email, password }: { email: string, password: string }) {
      return new Promise((resolve, reject) => {
        api.post('/auth/signin', { email, password })
          .then((response) => {
            this.setToken(response.data.data.token)
            // Refresh token is now handled via HTTP-only cookie
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
            resolve(undefined)
          })
          .catch((error) => {
            reject(error)
          })
          .finally(() => {
            this.finishLogout()
          })
      })
    },
    finishLogout(expired: boolean = false) {
      if (this.batchTimer) {
        clearTimeout(this.batchTimer)
        this.batchTimer = null
      }

      // Clear fetch interval
      this.stopPeriodicFetch()
      removeCurrentTeamFromLocalStorage()
      removeCurrentRoleFromLocalStorage()

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
      // Refresh token is cleared via HTTP-only cookie by the backend

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

    setCurrentTeam(teamId: string) {
      this.currentTeamId = teamId
      window.localStorage.setItem('valkku:currentTeamId', teamId)
    },

    setCurrentRole(role: any | null) {
      let setRole = {
        role: role?.role,
        guardianOf: role?.guardianOf,
        guardianOfEmail: role?.guardianOfEmail,
        guardianOfFullName: role?.guardianOfFullName
      }
      if(setRole?.role !== 'guardian' && role?.guardianOf) {
        throw new Error('GuardianOf is not allowed for non-guardian roles')
      }

      this.currentRole = setRole
      if (setRole && setRole.role) {
        window.localStorage.setItem('valkku:currentRole', JSON.stringify(setRole))
      }
    },
    async updateUser(updates: Partial<PublicUser>) {
      try {
        const response = await api.patch('/user/me', updates)

        if (response.data && response.data.success) {
          // Update the user in the store with the complete response data
          this.setUser(response.data.data)
          return { success: true, data: response.data.data }
        } else {
          return { success: false, message: response.data?.message || 'Update failed' }
        }
      } catch (error: any) {
        console.error('Failed to update user:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update user'
        }
      }
    },

    async updateUserDetails(payload: any) {
      try {
        const response = await api.patch('/user/details', payload)

        if (response.data && response.data.success) {
          // Update the user in the store with the complete response data
          this.setUser(response.data.data)
          return { success: true, data: response.data.data }
        } else {
          return { success: false, message: response.data?.message || 'Update failed' }
        }
      } catch (error: any) {
        console.error('Failed to update user details:', error)
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update user details'
        }
      }
    },

    joinTeam(payload: any) {
      return api.post('/team/join', payload)
        .then(response => {
          return response.data && response.data.success
            ? { success: true, data: response.data }
            : { success: false, message: response.data?.message || 'Join failed' }
        })
        .catch((error: any) => {
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
          emojiClickedCount: this.user!.emojiClickedCount
        })

        if (!result.success) {
          // Revert the pending clicks on error
          this.user!.emojiClickedCount -= clicksToSend
          this.pendingClickCount += clicksToSend
        }
      } catch (error) {
        console.error('Failed to update emoji click count:', error)
        // Revert the pending clicks on error
        this.user!.emojiClickedCount -= clicksToSend
        this.pendingClickCount += clicksToSend
      }
    },

    async changeLocale(locale: string) {
      try {
        // Update i18n locale immediately for responsive UI
        i18n.global.locale.value = locale as any

        // Update Vuetify locale
        const { currentLocale } = await import('@/plugins/vuetify')
        currentLocale.value = locale

        // Save to localStorage
        localStorage.setItem('valkku:locale', locale)

        // Update user preference in backend if user is logged in
        if (this.user && this.token) {
          await this.updateUser({ preferredLanguage: locale as any })
        }

        return { success: true }
      } catch (error) {
        console.error('Failed to change locale:', error)
        return { success: false, error }
      }
    },

    clearCurrentTeam() {
      this.currentTeamId = null
    }

  }
})
