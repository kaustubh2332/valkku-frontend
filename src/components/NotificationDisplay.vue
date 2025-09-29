<template>
  <div class="notification-container">
    <transition-group
      name="notification"
      tag="div"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-wrapper"
      >
        <v-snackbar
          :class="{ 'mobile-notification': $vuetify.display.mobile }"
          :color="getNotificationColor(notification.type)"
          :location="$vuetify.display.mobile ? 'top center' : 'bottom left'"
          :model-value="true"
          :timeout="notification.duration"
          :variant="$vuetify.display.mobile ? 'elevated' : 'elevated'"
          @update:model-value="removeNotification(notification.id)"
        >
        <div v-if="$vuetify.display.mobile" class="mobile-notification-content">
          <v-icon
            class="mr-2"
            :icon="getNotificationIcon(notification.type)"
            size="16"
          />
          <span class="mobile-message">{{ notification.message }}</span>
          <v-btn
            class="ml-2"
            icon="mdi-close"
            size="x-small"
            variant="text"
            @click="removeNotification(notification.id)"
          />
        </div>

        <div v-else class="desktop-notification-content">
          <v-icon
            class="mr-3"
            :icon="getNotificationIcon(notification.type)"
            size="20"
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
            icon="mdi-close"
            size="small"
            variant="text"
            @click="removeNotification(notification.id)"
          />
        </div>

        <!-- Action button if provided -->
        <template
          v-if="notification.action && !$vuetify.display.mobile"
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
      </div>
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
  z-index: 60000;
  pointer-events: none;
  isolation: isolate;
}

.notification-wrapper {
  pointer-events: auto;
  margin-bottom: 10px;
}

.notification-container :deep(.v-snackbar) {
  pointer-events: auto;
  margin-bottom: 10px;
  z-index: 60000 !important;
}

.notification-container :deep(.v-snackbar__wrapper) {
  z-index: 60000 !important;
}

.notification-container :deep(.v-overlay) {
  z-index: 60000 !important;
}

.notification-container :deep(.v-overlay__content) {
  z-index: 60000 !important;
}

/* Ensure all notification elements are above everything */
.notification-container :deep(*) {
  z-index: 60000 !important;
}

/* Global override for any Vuetify snackbar z-index */
:global(.v-snackbar) {
  z-index: 60000 !important;
}

:global(.v-snackbar__wrapper) {
  z-index: 60000 !important;
}

/* Mobile notification styles */
.mobile-notification :deep(.v-snackbar__wrapper) {
  min-height: 36px !important;
  max-height: 36px !important;
  padding: 0 !important;
  border-radius: 18px !important;
  max-width: calc(100vw - 16px) !important;
  margin: 0 auto !important;
}

.mobile-notification :deep(.v-snackbar__content) {
  padding: 0 !important;
  min-height: 36px !important;
  display: flex !important;
  align-items: center !important;
}

.mobile-notification-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  min-height: 36px;
}

.mobile-message {
  flex: 1;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 8px;
}

/* Desktop notification styles */
.desktop-notification-content {
  display: flex;
  align-items: center;
  width: 100%;
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

/* Mobile enter/leave animations */
@media (max-width: 600px) {
  .notification-enter-from {
    opacity: 0;
    transform: translateY(-100%);
  }

  .notification-leave-to {
    opacity: 0;
    transform: translateY(-100%);
  }
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .notification-container {
    top: 58px; /* Inside v-app padding (50px + 8px margin) */
    right: 8px;
    left: 8px;
  }

  .notification-container :deep(.v-snackbar) {
    margin-bottom: 6px;
  }

  /* Ensure notifications don't interfere with mobile bottom nav */
  .notification-container :deep(.v-snackbar) {
    position: relative !important;
    top: 0 !important;
    bottom: auto !important;
  }

  /* Additional mobile spacing */
  .mobile-notification-content {
    padding: 6px 10px;
  }

  .mobile-message {
    font-size: 11px;
    margin: 0 6px;
  }
}
</style>
