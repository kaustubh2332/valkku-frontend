<template>
  <v-container class="fill-height d-flex align-center justify-center" fluid>
    <v-sheet
      class="pa-0"
      max-width="800"
    >
      <v-card-title class="text-h5 text-sm-h4 text-md-h3 text-center mb-4">
        {{ $t('details.welcome') }}!
      </v-card-title>

      <v-card-text class="text-center mb-6">
        <p class="text-body-1 mb-2">
          {{ $t('details.description') }}
        </p>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('details.why_we_need_your_name') }}
        </p>
      </v-card-text>

      <v-form
        ref="form"
        v-model="formValid"
        @submit.prevent="submitForm"
      >
        <v-text-field
          v-model="firstName"
          class="mb-4"
          :label="$t('details.first_name')"
          required
          :rules="firstNameRules"
          variant="outlined"
        />

        <v-text-field
          v-model="lastName"
          class="mb-6"
          :label="$t('details.last_name')"
          required
          :rules="lastNameRules"
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
          {{ $t('details.submit') }}
        </v-btn>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script lang="ts">
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'DetailsPage',
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    data() {
      return {
        firstName: '',
        lastName: '',
        formValid: false,
        isSubmitting: false,
        firstNameRules: [
          (v: string) => !!v || this.$t('details.errors.first_name_required'),
          (v: string) => (v && v.length >= 2) || this.$t('details.errors.first_name_min_length')
        ],
        lastNameRules: [
          (v: string) => !!v || this.$t('details.errors.last_name_required'),
          (v: string) => (v && v.length >= 2) || this.$t('details.errors.last_name_min_length')
        ]
      }
    },
    methods: {
      async submitForm() {
        if (!this.formValid) return

        this.isSubmitting = true

        try {
          const result = await this.userStore.updateUser({
            firstName: this.firstName,
            lastName: this.lastName
          })

          if (result.success) {
            // Success - redirect to home
            this.$router.push({
              path: '/',
              query: {
                first: 'true' // First time for user so let's show some confetti
              }
            })
          } else {
            // Show error message to user
            console.error('Failed to update user:', result.message)
            // TODO: Show error message in UI (snackbar, alert, etc.)
          }

        } catch (error) {
          console.error('Error submitting form:', error)
          // TODO: Show error message to user
        } finally {
          this.isSubmitting = false
        }
      }
    }
  }
</script>
