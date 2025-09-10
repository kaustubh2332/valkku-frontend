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
        {{ $t('signUp.title') }}
      </v-card-title>

      <v-card-text class="text-center mb-6">
        <p class="text-body-1 mb-2">
          {{ $t('signUp.description') }}
        </p>
      </v-card-text>

      <!-- Language Selection -->
      <div class="text-center mb-6">
        <v-btn-toggle
          v-model="selectedLanguage"
          color="primary"
          mandatory
          variant="outlined"
        >
          <v-btn
            size="small"
            value="en"
          >
            {{ $t('language.english') }}
          </v-btn>
          <v-btn
            size="small"
            value="fi"
          >
            {{ $t('language.finnish') }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <v-form
        ref="form"
        v-model="formValid"
        @submit.prevent="submitForm"
      >
        <!-- First Row: First Name and Last Name -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="firstName"
              :label="$t('signUp.firstName')"
              required
              :rules="firstNameRules"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="lastName"
              :label="$t('signUp.lastName')"
              required
              :rules="lastNameRules"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <!-- Second Row: Email -->
        <v-row class="mb-4">
          <v-col cols="12">
            <v-text-field
              v-model="email"
              :label="$t('signUp.email')"
              required
              :rules="emailRules"
              type="email"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <!-- Third Row: Password and Password Check -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="password"
              :label="$t('signUp.password')"
              required
              :rules="passwordRules"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="passwordCheck"
              :label="$t('signUp.passwordCheck')"
              required
              :rules="passwordCheckRules"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
            >
              <template #append-inner>
                <v-btn
                  :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  size="small"
                  variant="text"
                  @click="showPassword = !showPassword"
                />
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <v-btn
          block
          color="primary"
          :disabled="!formValid"
          :loading="isSubmitting"
          size="large"
          type="submit"
        >
          {{ $t('signUp.submit') }}
        </v-btn>
      </v-form>

      <div class="text-center mt-4">
        <v-btn
          color="primary"
          variant="text"
          @click="goToSignIn"
        >
          {{ $t('signUp.haveAccount') }}
        </v-btn>
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'SignUpPage',
    data() {
      return {
        logo: '/src/assets/logo.svg',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        passwordCheck: '',
        showPassword: false,
        selectedLanguage: 'en',
        formValid: false,
        isSubmitting: false,
      }
    },
    computed: {
      firstNameRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.firstName_required'),
          (v: string) => (v && v.length >= 2) || this.$t('signUp.errors.firstName_min_length')
        ]
      },
      lastNameRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.lastName_required'),
          (v: string) => (v && v.length >= 2) || this.$t('signUp.errors.lastName_min_length')
        ]
      },
      emailRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.email_required'),
          (v: string) => /.+@.+\..+/.test(v) || this.$t('signUp.errors.email_invalid')
        ]
      },
      passwordRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.password_required'),
          (v: string) => (v && v.length >= 6) || this.$t('signUp.errors.password_min_length')
        ]
      },
      passwordCheckRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.passwordCheck_required'),
          (v: string) => v === this.password || this.$t('signUp.errors.passwordCheck_match')
        ]
      }
    },
    watch: {
      selectedLanguage(newLang) {
        this.$i18n.locale = newLang
      }
    },
    methods: {
      async submitForm() {
        if (!this.formValid) return

        this.isSubmitting = true

        try {
          // TODO: Implement actual sign up logic
          console.log('Sign up attempt:', {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            password: this.password,
            language: this.selectedLanguage
          })

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000))

          // For now, just redirect to home
          this.$router.push('/')

        } catch (error) {
          console.error('Sign up error:', error)
          // TODO: Show error message to user
        } finally {
          this.isSubmitting = false
        }
      },
      goToSignIn() {
        this.$router.push('/signin')
      }
    }
  }
</script>
