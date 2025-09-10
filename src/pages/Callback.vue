<template>
  <Loading v-if="!hasError" />

  <!-- Error Message -->
  <v-card
    v-else
    class="mx-auto"
    max-width="400"
    variant="outlined"
  >
    <v-card-text class="text-center pa-6">
      <v-icon
        class="mb-4"
        color="error"
        size="48"
      >
        mdi-alert-circle
      </v-icon>

      <div class="text-h6 mb-2">
        {{ $t('callback.errorTitle') }}
      </div>

      <div class="text-body-2 mb-4">
        {{ $t('callback.errorMessage') }}
      </div>

      <v-btn
        color="primary"
        @click="refreshPage"
      >
        <v-icon class="me-2">mdi-refresh</v-icon>
        {{ $t('callback.refreshPage') }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Callback',
    setup() {
      const { user, isAuthenticated, isLoading: auth0IsLoading } = useAuth0()
      const userStore = useUserStore()
      return { user, isAuthenticated, auth0IsLoading, userStore }
    },
    data() {
      return {
        isLoading: true,
        hasError: false
      }
    },
    watch: {
      auth0IsLoading: {
        handler(newValue) {
          // Only call bootstrap when Auth0 is done loading
          if (!newValue) {
            this.callBootstrap()
          }
        },
        immediate: true
      }
    },
    methods: {
      async callBootstrap() {
        try {
          // Call /bootstrap endpoint after Auth0 is done loading
          const response = await api.put('/bootstrap')

          // Set user data from response into Pinia store
          if (response.data && response.data.data) {
            this.userStore.setUser(response.data?.data)
            console.log('User set in store:', response.data.data)
          }

          this.$router.push('/')
          console.log('Bootstrap response:', response.data)
        } catch (error) {
          console.error('Bootstrap call failed:', error)
          this.hasError = true
        } finally {
          this.isLoading = false
        }
      },
      refreshPage() {
        // Refresh the page and redirect to home
        window.location.href = '/#/'
      }
    }
  }
</script>
