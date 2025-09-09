import { defineStore } from 'pinia'
import { removeUserFromLocalStorage, saveUserToLocalStorage } from '@/utils/auth'
import api from '@/utils/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: []
  }),
  getters: {

  },
  actions: {

  }
})
