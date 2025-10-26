import { defineStore } from 'pinia'
// import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

export const useEventStore = defineStore('event', {
  state: () => ({
    planPartTypes: [],
    loadingPlanPartTypes: false,
    events: [],
    loadingEvents: false,
    athletes: [],
    loadingAthletes: false
  }),
  actions: {
    initCreatePlanData() {
      return new Promise((resolve, reject) => {
        this.loadingPlanPartTypes = true
        this.loadingAthletes = true
        const userStore = useUserStore()
        const getPlanPartTypesPromise = api.get(`/plan/plan-part-type/all/${userStore.currentTeamId}`)
          .then((response) => {
            this.planPartTypes = response.data.data
          })
          .finally(() => {
            this.loadingPlanPartTypes = false
          })

        const url = userStore.isStaff
          ? `/user/team/${userStore.currentTeamId}/athlete`
          : `/user/${ userStore.currentRole?.role === 'guardian' ? userStore.currentRole?.guardianOf : userStore.user?.id }`

        console.log(url)

        const getAthletesPromise = api.get(url)
          .then((response) => {
            this.athletes = response.data.data
          })
          .finally(() => {
            this.loadingAthletes = false
          })

        Promise.all([getPlanPartTypesPromise, getAthletesPromise])
          .then(([planPartTypes, athletes]) => {
            resolve([planPartTypes, athletes])
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    getEvent(eventId, teamId, options = {}) {
      return new Promise((resolve, reject) => {
        // Build query parameters for recurrence
        const params = {}
        if (options.recurrenceDate) {
          params.recurrenceDate = options.recurrenceDate
        }

        const url = `/event/${eventId}/team/${teamId}`

        api.get(url, { params })
          .then((response) => {
            resolve(response.data.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async reloadEvent(eventId, teamId, options = {}) {
      // This action ensures we always go through the store for event loading
      return await this.getEvent(eventId, teamId, options)
    },
    saveEvent(eventData) {
      return new Promise((resolve, reject) => {
        const userStore = useUserStore()
        api.post(`/event/team/${userStore.currentTeamId}`, eventData)
          .then((response) => {
            resolve(response.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    updateEvent(eventId, eventData, options = {}) {
      return new Promise((resolve, reject) => {
        const userStore = useUserStore()
        // Build query parameters for recurrence and edit mode
        const params = {}
        if (options.recurrenceDate) {
          params.recurrenceDate = options.recurrenceDate
        }
        if (options.editScope) {
          params.editMode = options.editScope
        }
        const queryString = new URLSearchParams(params).toString()
        const url = `/event/${eventId}/team/${userStore.currentTeamId}${queryString ? `?${queryString}` : ''}`
        api.put(url, eventData)
          .then((response) => {
            resolve(response.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    deleteEvent(eventId, options = {}) {
      return new Promise((resolve, reject) => {
        const userStore = useUserStore()
        const { recurrenceDate } = options

        // Build query parameters for recurring event occurrences
        const params = {}
        if (recurrenceDate) {
          params.recurrenceDate = recurrenceDate
        }

        api.delete(`/event/${eventId}/team/${userStore.currentTeamId}`, { params })
          .then((response) => {
            resolve(response.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    buildEventRoute(event) {
      // Build route object for event page with proper query parameters for recurring events
      const route = {
        name: 'EventInfo',
        params: {
          eventId: event.id.toString()
        }
      }

      // Add query parameters for recurring events
      if (event.repeatId) {
        const query = {}

        // Add recurrenceDate if available (format: YYYY-MM-DD)
        if (event.eventDate) {
          // Extract YYYY-MM-DD from eventDate (handle various date formats)
          let dateStr = event.eventDate
          if (dateStr instanceof Date) {
            const year = dateStr.getFullYear()
            const month = String(dateStr.getMonth() + 1).padStart(2, '0')
            const day = String(dateStr.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
            // If it's an ISO string, extract the date part
            dateStr = dateStr.split('T')[0]
          }
          query.recurrenceDate = dateStr
        }


        if (Object.keys(query).length > 0) {
          route.query = query
        }
      }

      return route
    },
    initEvents() {
      return new Promise((resolve, reject) => {
        const userStore = useUserStore()
        this.loadingEvents = true

        api.get(`/event/team/${userStore.currentTeamId}`)
          .then((response) => {
            this.events = response.data.data
            resolve(response.data.data)
          })
          .catch((error) => {
            reject(error)
          })
          .finally(() => {
            this.loadingEvents = false
          })
      })
    }
  }
})
