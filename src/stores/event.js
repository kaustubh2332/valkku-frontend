import { defineStore } from 'pinia'
// import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import api from '@/utils/axios'

export const useEventStore = defineStore('event', {
  state: () => ({
    planPartTypes: [],
    loadingPlanPartTypes: false
  }),
  actions: {
    initCreateEventData() {
      return new Promise((resolve, reject) => {
        this.loadingPlanPartTypes = true
        const userStore = useUserStore()
        api.get(`/event/plan-part-type/team/${userStore.currentTeamId}`)
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
    }
  }
})
