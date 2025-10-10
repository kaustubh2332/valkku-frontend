import { defineStore } from 'pinia'
// import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

export const useEventStore = defineStore('event', {
  state: () => ({
    planPartTypes: [],
    loadingPlanPartTypes: false,
    events: [],
    loadingEvents: false
  }),
  actions: {
    initCreatePlanData() {
      return new Promise((resolve, reject) => {
        this.loadingPlanPartTypes = true
        const userStore = useUserStore()
        api.get(`/plan/plan-part-type/all/${userStore.currentTeamId}`)
          .then((response) => {
            this.planPartTypes = response.data.data
            resolve(response.data.data)
          })
          .catch((error) => {
            reject(error)
          })
          .finally(() => {
            this.loadingPlanPartTypes = false
          })
      })
    },
    getEvent(eventId, teamId) {
      return new Promise((resolve, reject) => {
        api.get(`/event/${eventId}/team/${teamId}`)
          .then((response) => {
            resolve(response.data.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
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
    updateEvent(eventId, eventData) {
      return new Promise((resolve, reject) => {
        const userStore = useUserStore()
        api.put(`/event/${eventId}/team/${userStore.currentTeamId}`, eventData)
          .then((response) => {
            resolve(response.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
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
