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
  export default {
    name: 'LoginPage',
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

        try {
          // TODO: Implement actual login logic
          console.log('Login attempt:', { email: this.email, password: this.password })

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          // For now, just redirect to home
          this.$router.push('/')

        } catch (error) {
          console.error('Login error:', error)
          // TODO: Show error message to user
        } finally {
          this.isSubmitting = false
        }
      },
      goToRegister() {
        this.$router.push('/signup')
      }
    }
  }
</script>
