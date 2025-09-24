import { defineStore } from 'pinia'
import i18n from '@/i18n'
import { backendMessages } from '@/i18n/locales/backendMessages'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    nextId: 1
  }),

  getters: {},

  actions: {
    addNotification(notification) {
      const id = this.nextId++
      const newNotification = {
        id,
        type: 'info',
        duration: 4000,
        timestamp: Date.now(),
        ...notification
      }

      this.notifications.push(newNotification)

      // Auto-dismiss if duration is set
      if (newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id)
        }, newNotification.duration)
      }

      return id
    },

    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notifications.splice(index, 1)
      }
    },

    clearAll() {
      this.notifications = []
    },

    success(message, options = {}) {
      return this.addNotification({
        type: 'success',
        message,
        ...options
      })
    },

    error(message, options = {}) {
      return this.addNotification({
        type: 'error',
        message,
        duration: 4000,
        ...options
      })
    },

    warning(message, options = {}) {
      return this.addNotification({
        type: 'warning',
        message,
        ...options
      })
    },

    info(message, options = {}) {
      return this.addNotification({
        type: 'info',
        message,
        ...options
      })
    },

    handleBackendError(err, options = {}) {
      const currentLanguage = i18n.global.locale.value || 'en'

      // Extract messageCode from error
      const messageCode = err?.response?.data?.code || err?.code || 'something_went_wrong'

      // Get localized message
      const localizedMessage = this.getLocalizedMessage(messageCode, currentLanguage)

      // Use localized message or fallback to error message or generic message
      const message = localizedMessage || err?.message || 'An unexpected error occurred'

      // Show error notification
      return this.error(message, {
        ...options
      })
    },

    getLocalizedMessage(messageCode, language) {
      const locObject = backendMessages[messageCode]
      if (!locObject) {
        return null
      }

      const message = locObject[language]
      if (!message) {
        // Fallback to English if language not found
        const englishMessage = backendMessages[messageCode]['en']
        return englishMessage || null
      }

      return message || null
    }
  }
})
