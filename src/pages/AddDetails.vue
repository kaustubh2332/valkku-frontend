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
          src="/src/assets/logo.svg"
        />
      </div>

      <v-card-title class="text-h5 text-sm-h4 text-md-h3 text-center mb-4">
        {{ $t('addDetails.title') }}
      </v-card-title>

      <v-card-text class="text-center mb-6">
        <p class="text-body-1 mb-2">
          {{ $t('addDetails.description') }}
        </p>
      </v-card-text>

      <!-- Info Alert -->
      <v-alert
        class="mb-6"
        type="info"
        variant="tonal"
      >
        {{ $t('addDetails.infoMessage') }}
      </v-alert>

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
        <v-text-field
          v-model="email"
          autocomplete="email"
          class="mb-4"
          disabled
          :label="$t('addDetails.emailLabel')"
          variant="outlined"
        />
        <!-- Name Fields (if name param is present) -->
        <template v-if="needsName">
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="firstName"
                autocomplete="given-name"
                :label="$t('signUp.firstName')"
                required
                :rules="firstNameRules"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="lastName"
                autocomplete="family-name"
                :label="$t('signUp.lastName')"
                required
                :rules="lastNameRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </template>

        <!-- Password Fields (if pw param is present) -->
        <template v-if="needsPassword">
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="password"
                autocomplete="new-password"
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
                autocomplete="new-password"
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
        </template>

        <v-btn
          block
          color="primary"
          :disabled="!formValid"
          :loading="isSubmitting"
          size="large"
          type="submit"
        >
          {{ $t('addDetails.submit') }}
        </v-btn>
      </v-form>

      <div class="text-center mt-4">
        <v-btn
          color="primary"
          variant="text"
          @click="goToSignIn"
        >
          {{ $t('addDetails.haveAccount') }}
        </v-btn>
      </div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'AddDetails',
    setup() {
      const { locale } = useI18n()
      const router = useRouter()
      const userStore = useUserStore()
      const notificationStore = useNotificationStore()

      return { locale, router, userStore, notificationStore }
    },
    data() {
      return {
        formValid: false,
        isSubmitting: false,
        selectedLanguage: this.$i18n.locale,
        showPassword: false,
        email: '',
        token: '',
        needsNameData: false,
        needsPasswordData: false,
        firstName: '',
        lastName: '',
        password: '',
        passwordCheck: ''
      }
    },
    computed: {
      needsName() {
        return this.needsNameData
      },
      needsPassword() {
        return this.needsPasswordData
      },
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
      passwordRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.password_required'),
          (v: string) => (v && v.length >= 8) || this.$t('signUp.errors.password_min_length')
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
        this.locale = newLang
      }
    },
    mounted() {
      // Save query params to data
      this.email = this.$route.query.email || ''
      this.token = this.$route.query.token || ''
      this.needsNameData = this.$route.query.name === 'true'
      this.needsPasswordData = this.$route.query.pw === 'true'
      this.selectedLanguage = this.$route.query.preferredLanguage || 'en'
      this.userStore.changeLocale(this.selectedLanguage)

      console.log(this.needsNameData, this.needsPasswordData)
      console.log(this.email, this.token)

      // Redirect to signup if no email, token, or missing required params
      if (!this.email || !this.token || (!this.needsNameData && !this.needsPasswordData)) {
        this.router.push('/signup')
        return
      }

      // Clean the URL by removing all query params
      this.router.replace('/add-details')
    },
    methods: {
      submitForm() {
        if (!this.formValid) return

        this.isSubmitting = true

        const payload: any = {
          token: this.token,
          preferredLanguage: this.selectedLanguage
        }

        if (this.needsName) {
          payload.firstName = this.firstName
          payload.lastName = this.lastName
        }

        if (this.needsPassword) {
          payload.password = this.password
          payload.repeatPassword = this.passwordCheck
        }

        // Call API to join team
        this.userStore.joinTeam(payload)
          .then(result => {
            if (result.success) {
              this.notificationStore.info(this.$t('addDetails.success'))
              // Redirect to sign in
              this.router.push('/signin')
            } else {
              this.notificationStore.error(result.message)
            }
          })
          .catch(error => {
            console.error('Error joining team:', error)
            this.notificationStore.handleBackendError(error)
          })
          .finally(() => {
            this.isSubmitting = false
          })
      },
      goToSignIn() {
        this.router.push('/signin')
      }
    }
  }
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>
