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
