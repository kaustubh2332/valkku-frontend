<template>
  <div
    v-if="$vuetify.display.mobile && !$route.meta.hideSidebar"
    class="mobile-bottom-nav-container"
  >
    <div class="mobile-bottom-nav">
      <v-btn
        v-for="item in navigationItems"
        :key="item.name"
        :active="$route.name === item.name"
        class="nav-item"
        :to="{ name: item.name }"
        variant="text"
      >
        <div class="nav-item-content">
          <div
            class="icon-container"
            :class="{ 'active': $route.name === item.name }"
          >
            <v-icon
              :color="$route.name === item.name ? 'white' : 'grey-darken-1'"
              size="22"
            >
              {{ item.icon }}
            </v-icon>
          </div>
          <span
            class="nav-label"
            :class="{ 'active': $route.name === item.name }"
          >
            {{ item.title }}
          </span>
        </div>
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'MobileBottomNav',
    data() {
      return {
        userStore: useUserStore(),
        activeTab: null
      }
    },
    computed: {
      isAuthenticated() {
        return !!this.userStore.getUser
      },
      navigationItems() {
        const items = [
          {
            name: 'Home',
            icon: 'mdi-home-outline',
            title: this.$t('sidebar.home')
          }
        ]

        // Only show these items if user is authenticated
        if (this.isAuthenticated) {
          items.push(
            {
              name: 'Users',
              icon: 'mdi-account-group-outline',
              title: this.$t('sidebar.userManagement')
            },
            {
              name: 'Settings',
              icon: 'mdi-cog-outline',
              title: this.$t('sidebar.settings')
            }
          )
        }

        return items
      }
    },
    watch: {
      '$route.name': {
        handler(newRouteName) {
          this.activeTab = newRouteName
        },
        immediate: true
      }
    }
  }
</script>

<style scoped>
.mobile-bottom-nav-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20050;
  padding-bottom: 0px; /* Fallback for devices without safe-area-inset support */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.mobile-bottom-nav {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  height: 64px;
  padding: 6px 12px;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.08);
}

.nav-item {
  flex: 1;
  height: 100%;
  min-width: 0;
  padding: 0;
  margin: 0 2px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.nav-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 2px;
}

.icon-container {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
}

.icon-container.active {
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  transform: scale(1.1);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  line-height: 1.1;
}

.nav-label.active {
  color: #1976d2;
  font-weight: 600;
}

/* Dark mode support */
.v-theme--dark .mobile-bottom-nav {
  background: rgba(18, 18, 18, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.3);
}

.v-theme--dark .nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.v-theme--dark .nav-label {
  color: #aaa;
}

.v-theme--dark .nav-label.active {
  color: #42a5f5;
}

/* Ripple effect customization */
.nav-item :deep(.v-ripple__container) {
  border-radius: 12px;
}

/* Active state background */
.nav-item.v-btn--active {
  background: rgba(25, 118, 210, 0.08);
}

.v-theme--dark .nav-item.v-btn--active {
  background: rgba(66, 165, 245, 0.12);
}

/* Smooth entrance animation */
.mobile-bottom-nav-container {
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Icon bounce animation on active */
.icon-container.active {
  animation: bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounceIn {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1.1);
  }
}

/* Responsive adjustments */
@media (max-width: 360px) {
  .mobile-bottom-nav {
    padding: 4px 8px;
    height: 56px;
  }

  .nav-label {
    font-size: 9px;
  }

  .icon-container {
    width: 24px;
    height: 24px;
  }
}
</style>
