<template>
  <v-app id="valkku-app">
    <AppSidebar v-if="!$route.meta.hideSidebar" ref="sidebar" />
    <v-main>
      <v-container
        :class="{ 'mobile-bottom-spacing': $vuetify.display.mobile && !$route.meta.hideSidebar }"
      >
        <router-view />
      </v-container>
    </v-main>

    <v-fab
      v-if="$vuetify.display.mobile && !$route.meta.hideSidebar"
      id="mobile-fab"
      icon="mdi-menu"
      size="small"
      @click="openMobileSidebar"
    />

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav />

    <!-- Notification Display -->
    <NotificationDisplay />
  </v-app>
</template>

<script lang="ts">
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'App',
    data() {
      return {
        userStore: useUserStore()
      }
    },
    mounted() {
      // Auto-detect browser language if no token (user not logged in)
      if (!this.userStore.token) {
        this.detectAndSetLanguage()
      }

      // Initialize user data on app mount
      this.userStore.fetchUser()
      this.userStore.startPeriodicFetch()
    },
    beforeUnmount() {
      // Clean up the interval when the app is destroyed
      this.userStore.stopPeriodicFetch()
    },
    methods: {
      openMobileSidebar() {
        this.$refs.sidebar.drawer = true
      },
      detectAndSetLanguage() {
        // Get browser language
        const browserLang = navigator.language || navigator.languages?.[0] || 'en'
        const localStorageLang = window.localStorage.getItem('valkku:locale')

        // Extract language code (e.g., 'fi' from 'fi-FI')
        const langCode = browserLang.split('-')[0].toLowerCase()

        // Set to English if not Finnish
        const targetLocale = localStorageLang || (langCode === 'fi' ? 'fi' : 'en')

        // Only change if different from current locale
        if (this.$i18n.locale !== targetLocale) {
          this.userStore.changeLocale(targetLocale)
        }
      }
    }
  }
</script>

<style>
#valkku-app {
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-top: env(safe-area-inset-top, 0px);
    height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

#valkku-app .v-main {
    flex: 1;
    min-height: 0; /* Allows flex item to shrink below content size */
}

#mobile-fab {
    position: absolute;
    right: 16px;
    top: calc(16px + env(safe-area-inset-top, 0px));
    z-index: 20000;
}

.mobile-bottom-spacing {
    padding-bottom: 80px !important;
}
</style>
