<template>
  <v-app id="valkku-app">
    <AppSidebar v-if="!$route.meta.hideSidebar" ref="sidebar" />
    <v-main>
      <v-container style="height: 100vh;">
        <router-view />
      </v-container>
    </v-main>

    <v-fab
      v-if="$vuetify.display.mobile && !$route.meta.hideSidebar"
      class="mobile-fab"
      icon="mdi-menu"
      size="small"
      @click="openMobileSidebar"
    />
  </v-app>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'App',
    setup() {
      const userStore = useUserStore()
      const { isAuthenticated, isLoading } = useAuth0()
      return { userStore, isAuthenticated, isLoading }
    },
    watch: {
      isLoading: {
        handler(newVal) {
          // When Auth0 finishes loading, check if user is authenticated
          if (!newVal && this.isAuthenticated) {
            this.userStore.fetchUser()
            this.userStore.startPeriodicFetch()
          }
        },
        immediate: true
      }
    },
    mounted() {
      // Also check immediately in case Auth0 is already loaded
      if (!this.isLoading && this.isAuthenticated) {
        console.log('Auth0 already loaded, fetching user data')
        this.userStore.fetchUser()
        this.userStore.startPeriodicFetch()
      }
    },
    beforeUnmount() {
      // Clean up the interval when the app is destroyed
      this.userStore.stopPeriodicFetch()
    },
    methods: {
      openMobileSidebar() {
        this.$refs.sidebar.drawer = true
      }
    }
  }
</script>

<style>
#valkku-app {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
}

.mobile-fab {
    position: fixed;
    top: calc(16px + env(safe-area-inset-top));
    right: calc(16px + env(safe-area-inset-right));
}
</style>
