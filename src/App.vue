<template>
  <v-app>
    <AppSidebar ref="sidebar" />
    <!-- <AppNavbar /> -->
    <v-main>
      <router-view />
    </v-main>

    <!-- Mobile FAB for sidebar -->
    <v-fab
      v-if="$vuetify.display.mobile"
      icon="mdi-menu"
      size="small"
      style="top: 16px; right: 16px; position: fixed;"
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
