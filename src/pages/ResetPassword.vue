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
        {{ $t('resetPassword.title') }}
      </v-card-title>

      <!-- Loading State -->
      <div v-if="verifying" class="text-center py-12">
        <v-progress-circular color="primary" indeterminate size="64" />
        <p class="text-body-1 mt-4">
          {{ $t('resetPassword.verifying') }}
        </p>
      </div>

      <template v-else>
        <v-card-text class="text-center mb-6">
          <p class="text-body-1 mb-2">
            {{ $t('resetPassword.description') }}
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
            {{ $t('resetPassword.successMessage') }}
          </div>
        </v-alert>

        <!-- Error Message -->
        <v-alert
          v-if="error"
          class="mb-6"
          color="error"
          icon="mdi-alert-circle"
          type="error"
          variant="tonal"
        >
          <div class="text-body-2">
            {{ error }}
          </div>
        </v-alert>

        <!-- Form -->
        <v-form
          v-if="!success && !error && tokenValid"
          ref="form"
          v-model="formValid"
          @submit.prevent="submitForm"
        >
        <v-text-field
          v-model="password"
          autocomplete="new-password"
          class="mb-4"
          :label="$t('resetPassword.newPassword')"
          required
          :rules="passwordRules"
          type="password"
          variant="outlined"
        />

        <v-text-field
          v-model="confirmPassword"
          autocomplete="new-password"
          class="mb-6"
          :label="$t('resetPassword.confirmPassword')"
          required
          :rules="confirmPasswordRules"
          type="password"
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
          {{ $t('resetPassword.submit') }}
        </v-btn>
      </v-form>

        <!-- Back to Login -->
        <div class="text-center mt-4">
          <v-btn
            color="primary"
            variant="text"
            @click="goToLogin"
          >
            {{ success ? $t('resetPassword.goToLogin') : $t('resetPassword.backToLogin') }}
          </v-btn>
        </div>
      </template>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import { useNotificationStore } from '@/stores/notification'
import api from '@/utils/axios'

export default {
  name: 'ResetPassword',
  setup() {
    const notificationStore = useNotificationStore()
    return { notificationStore }
  },
  data() {
    return {
      logo: '/src/assets/logo.svg',
      password: '',
      confirmPassword: '',
      formValid: false,
      isSubmitting: false,
      verifying: true,
      tokenValid: false,
      success: false,
      error: '',
      passwordRules: [
        (v: string) => !!v || this.$t('login.errors.password_required'),
        (v: string) => (v && v.length >= 6) || this.$t('login.errors.password_min_length')
      ]
    }
  },
  computed: {
    confirmPasswordRules() {
      return [
        (v: string) => !!v || this.$t('resetPassword.errors.confirmPasswordRequired'),
        (v: string) => v === this.password || this.$t('resetPassword.errors.passwordsDoNotMatch')
      ]
    },
    token() {
      return this.$route.params.hashedToken
    }
  },
  mounted() {
    this.verifyToken()
  },
  methods: {
    async verifyToken() {
      this.verifying = true
      this.error = ''

      try {
        await api.post('/auth/password-reset/verify', {
          token: this.token
        })
        this.tokenValid = true
      } catch (error: any) {
        this.tokenValid = false
        if (error.response?.data?.message) {
          this.error = error.response.data.message
        } else {
          this.error = this.$t('resetPassword.errors.invalidToken')
        }
      } finally {
        this.verifying = false
      }
    },
    async submitForm() {
      if (!this.formValid) return

      this.isSubmitting = true
      this.error = ''

      try {
        await api.post('/auth/password-reset/confirm', {
          token: this.token,
          newPassword: this.password
        })
        this.success = true
      } catch (error: any) {
        if (error.response?.data?.message) {
          this.error = error.response.data.message
        } else {
          this.notificationStore.handleBackendError(error)
        }
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
