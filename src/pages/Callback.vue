<template>
  <div class="fill-height d-flex align-center justify-center">
    <v-sheet
      class="pa-6 text-center"
      max-width="400"
      width="100%"
    >
      <!-- App Logo -->


      <!-- Loading State -->
      <LoadingWrapper
        v-if="isLoading && !hasError"
        :delay="300"
      >
        <v-progress-circular
          class="mb-4"
          color="primary"
          indeterminate
          size="64"
        />
        <div class="text-h6 mb-2">
          {{ $t('callback.loading') }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ $t('callback.loadingDescription') }}
        </div>
      </LoadingWrapper>

      <!-- Error State -->
      <div v-else-if="hasError">
        <div class="mb-8">
          <v-img
            alt="Valkku Logo"
            class="mx-auto mb-4"
            max-height="80"
            max-width="200"
            :src="logo"
          />
        </div>
        <v-icon
          class="mb-4"
          color="error"
          size="64"
        >
          mdi-alert-circle
        </v-icon>

        <div class="text-h6 mb-2">
          {{ $t('callback.errorTitle') }}
        </div>

        <div class="text-body-2 mb-4 text-medium-emphasis">
          {{ $t('callback.errorMessage') }}
        </div>

        <!-- Debug info (remove in production) -->
        <div class="text-caption text-medium-emphasis mb-4">
          Debug: isLoading={{ isLoading }}, hasError={{ hasError }}
        </div>

        <v-btn
          color="primary"
          @click="retryAuthentication"
        >
          <v-icon class="me-2">mdi-refresh</v-icon>
          {{ $t('callback.retry') }}
        </v-btn>

        <v-btn
          class="mt-2"
          color="primary"
          variant="text"
          @click="startLogout"
        >
          {{ $t('app.logout') }}
        </v-btn>
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
  import LoadingWrapper from '@/components/LoadingWrapper.vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'CallbackPage',
    components: {
      LoadingWrapper
    },
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    data() {
      return {
        logo: '/src/assets/logo.svg',
        isLoading: true,
        hasError: false
      }
    },
    async mounted() {
      await this.authenticateUser()
    },
    methods: {
      async authenticateUser() {
        this.isLoading = true
        this.hasError = false

        this.userStore.fetchUser()
          .then(() => {
            // Redirect to original destination or home
            const redirectPath = this.$route.query.redirect as string || '/'
            this.$router.replace(redirectPath)
          })
          .catch((error) => {
            this.hasError = true
          })
          .finally(() => {
            this.isLoading = false
          })
      },
      async retryAuthentication() {
        await this.authenticateUser()
      },
      startLogout() {
        this.userStore.logout()
      }
    }
  }
</script>
