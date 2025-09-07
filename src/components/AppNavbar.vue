<template>
  <v-app-bar
    color="white"
    dark
    prominent
  >
    <Loading v-if="isLoading" />
    <v-app-bar-title>
      <v-img
        alt="Valkku"
        contain
        height="40"
        src="@/assets/logo.svg"
        style="cursor: pointer;"
        width="40"
        @click="$router.push('/')"
      />
    </v-app-bar-title>

    <v-spacer />

  </v-app-bar>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'

  export default {
    name: 'AppNavbar',
    setup() {
      const { isLoading } = useAuth0()
      return { isLoading }
    }
  }
</script>
