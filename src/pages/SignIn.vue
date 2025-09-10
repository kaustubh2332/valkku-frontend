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
        {{ $t('login.title') }}
      </v-card-title>

      <v-card-text class="text-center mb-6">
        <p class="text-body-1 mb-2">
          {{ $t('login.description') }}
        </p>
      </v-card-text>

      <v-form
        ref="form"
        v-model="formValid"
        @submit.prevent="submitForm"
      >
        <v-text-field
          v-model="email"
          class="mb-4"
          :label="$t('login.email')"
          required
          :rules="emailRules"
          type="email"
          variant="outlined"
        />

        <v-text-field
          v-model="password"
          class="mb-6"
          :label="$t('login.password')"
          required
          :rules="passwordRules"
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
          {{ $t('login.submit') }}
        </v-btn>
      </v-form>

      <div class="text-center mt-4">
        <v-btn
          color="primary"
          variant="text"
          @click="goToRegister"
        >
          {{ $t('login.noAccount') }}
        </v-btn>
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'LoginPage',
    setup() {
      const userStore = useUserStore()
      const notificationStore = useNotificationStore()
      return { userStore, notificationStore }
    },
    data() {
      return {
        logo: '/src/assets/logo.svg',
        email: '',
        password: '',
        formValid: false,
        isSubmitting: false,
        emailRules: [
          (v: string) => !!v || this.$t('login.errors.email_required'),
          (v: string) => /.+@.+\..+/.test(v) || this.$t('login.errors.email_invalid')
        ],
        passwordRules: [
          (v: string) => !!v || this.$t('login.errors.password_required'),
          (v: string) => (v && v.length >= 6) || this.$t('login.errors.password_min_length')
        ]
      }
    },
    methods: {
      async submitForm() {
        if (!this.formValid) return
        this.isSubmitting = true
        this.userStore.signin({ email: this.email, password: this.password })
          .then(() => {
            this.$router.push('/')
          })
          .catch((error) => {
            this.notificationStore.handleBackendError(error)
          })
          .finally(() => {
            this.isSubmitting = false
          })
      },
      goToRegister() {
        this.$router.push('/signup')
      }
    }
  }
</script>
