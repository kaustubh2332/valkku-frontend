<template>
  <div class="fill-height d-flex align-center justify-center">
    <v-sheet
      class="pa-6"
      max-width="600"
      width="100%"
    >
      <!-- App Logo -->
      <div class="text-center mb-8">
        <v-img
          alt="Valkku Logo"
          class="mx-auto mb-4"
          max-height="80"
          max-width="200"
          :src="logo"
        />
      </div>

      <v-card-title class="text-h5 text-sm-h4 text-md-h3 text-center mb-4">
        {{ $t('forgotPassword.title') }}
      </v-card-title>

      <v-card-text class="text-center mb-6">
        <p class="text-body-1 mb-2">
          {{ $t('forgotPassword.description') }}
        </p>
      </v-card-text>

      <!-- Success Message -->
      <v-alert
        v-if="success"
        class="mb-6"
        color="success"
        icon="mdi-check-circle"
        type="success"
        variant="tonal"
      >
        <div class="text-body-2">
          {{ $t('forgotPassword.successMessage') }}
        </div>
      </v-alert>

      <!-- Form -->
      <v-form
        v-if="!success"
        ref="form"
        v-model="formValid"
        @submit.prevent="submitForm"
      >
        <v-text-field
          v-model="email"
          autocomplete="email"
          class="mb-6"
          :label="$t('login.email')"
          required
          :rules="emailRules"
          type="email"
          variant="outlined"
        />

        <v-btn
          block
          color="primary"
          :disabled="!formValid"
          :loading="isSubmitting"
          size="large"
          type="submit"
        >
          {{ $t('forgotPassword.submit') }}
        </v-btn>
      </v-form>

      <!-- Back to Login -->
      <div class="text-center mt-4">
        <v-btn
          color="primary"
          variant="text"
          @click="goToLogin"
        >
          {{ $t('forgotPassword.backToLogin') }}
        </v-btn>
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { useNotificationStore } from '@/stores/notification'
import api from '@/utils/axios'

export default {
  name: 'ForgotPassword',
  setup() {
    const notificationStore = useNotificationStore()
    return { notificationStore }
  },
  data() {
    return {
      logo: '/src/assets/logo.svg',
      email: '',
      formValid: false,
      isSubmitting: false,
      success: false,
      emailRules: [
        (v: string) => !!v || this.$t('login.errors.email_required'),
        (v: string) => /.+@.+\..+/.test(v) || this.$t('login.errors.email_invalid')
      ]
    }
  },
  methods: {
    async submitForm() {
      if (!this.formValid) return

      this.isSubmitting = true
      try {
        await api.post('/auth/password-reset/request', { email: this.email })
        this.success = true
      } catch (error) {
        this.notificationStore.handleBackendError(error)
      } finally {
        this.isSubmitting = false
      }
    },
    goToLogin() {
      this.$router.push('/signin')
    }
  }
}
</script>
