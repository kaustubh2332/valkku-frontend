<template>
  <v-app>
    <AppNavbar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'App',
    setup() {
      const userStore = useUserStore()
      const { isAuthenticated } = useAuth0()
      return { userStore, isAuthenticated }
    },
    created() {
      // Let's init the user even if it had been loaded from localStorage
      if(this.isAuthenticated) {
        this.userStore.fetchUser()
      }
    }
  }
</script>
