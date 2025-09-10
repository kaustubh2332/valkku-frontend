<template>
  <div class="notification-container">
    <transition-group
      name="notification"
      tag="div"
    >
      <v-snackbar
        v-for="notification in notifications"
        :key="notification.id"
        :color="getNotificationColor(notification.type)"
        location="top"
        :model-value="true"
        :timeout="notification.duration"
        variant="elevated"
        @update:model-value="removeNotification(notification.id)"
      >
        <div class="d-flex align-center">
          <v-icon
            class="mr-3"
            :icon="getNotificationIcon(notification.type)"
          />
          <div class="flex-grow-1">
            <div
              v-if="notification.title"
              class="text-subtitle-2 font-weight-bold mb-1"
            >
              {{ notification.title }}
            </div>
            <div class="text-body-2">
              {{ notification.message }}
            </div>
          </div>
          <v-btn
            :icon="'mdi-close'"
            size="small"
            variant="text"
            @click="removeNotification(notification.id)"
          />
        </div>

        <!-- Action button if provided -->
        <template
          v-if="notification.action"
          #actions
        >
          <v-btn
            :color="notification.action.color || 'white'"
            :text="notification.action.text"
            variant="text"
            @click="handleAction(notification)"
          />
        </template>
      </v-snackbar>
    </transition-group>
  </div>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'

  export default {
    name: 'NotificationDisplay',
    data() {
      return {
        notificationStore: useNotificationStore()
      }
    },
    computed: {
      notifications() {
        return this.notificationStore.notifications
      }
    },
    methods: {
      removeNotification(id) {
        this.notificationStore.removeNotification(id)
      },
      handleAction(notification) {
        if (notification.action?.handler) {
          notification.action.handler()
        }
        this.removeNotification(notification.id)
      },
      getNotificationColor(type) {
        const colors = {
          success: 'success',
          error: 'error',
          warning: 'warning',
          info: 'info'
        }
        return colors[type] || 'info'
      },
      getNotificationIcon(type) {
        const icons = {
          success: 'mdi-check-circle',
          error: 'mdi-alert-circle',
          warning: 'mdi-alert',
          info: 'mdi-information'
        }
        return icons[type] || 'mdi-information'
      }
    }
  }
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification-container :deep(.v-snackbar) {
  pointer-events: auto;
  margin-bottom: 10px;
}

/* Transition animations */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .notification-container :deep(.v-snackbar) {
    margin-bottom: 8px;
  }
}
</style>
