<template>
  <div class="fill-height d-flex align-center justify-center">
    <v-sheet
      class="pa-6"
      max-width="600"
      width="100%"
    >
      <v-card-title class="text-h5 text-sm-h4 text-md-h3 text-center mb-4">
        {{ $t('createTeam.title') }}
      </v-card-title>

      <v-card-text class="text-center mb-6">
        <p class="text-body-1 mb-2">
          {{ $t('createTeam.description') }}
        </p>
      </v-card-text>

      <v-form
        ref="form"
        v-model="formValid"
        @submit.prevent="submitForm"
      >
        <v-text-field
          v-model="teamName"
          class="mb-6"
          :label="$t('createTeam.team_name')"
          required
          :rules="teamNameRules"
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
          {{ $t('createTeam.submit') }}
        </v-btn>
      </v-form>
    </v-sheet>
  </div>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'CreateTeamPage',
    emits: ['close'],
    setup() {
      const userStore = useUserStore()
      const notificationStore = useNotificationStore()
      const success = notificationStore.success
      const handleBackendError = notificationStore.handleBackendError

      return { userStore, notificationStore, success, handleBackendError }
    },
    data() {
      return {
        teamName: '',
        formValid: false,
        isSubmitting: false,
        teamNameRules: [
          (v: string) => !!v || this.$t('createTeam.errors.team_name_required'),
          (v: string) => (v && v.length >= 2) || this.$t('createTeam.errors.team_name_min_length'),
          (v: string) => (v && v.length <= 50) || this.$t('createTeam.errors.team_name_max_length')
        ]
      }
    },
    methods: {
      async submitForm() {
        if (!this.formValid) return

        this.isSubmitting = true

        api.post('/team', {
          name: this.teamName
        })
          .then((response) => {
            this.userStore.setUser(response.data.data.user)
            this.userStore.setCurrentTeam(response.data.data.team.id)
            this.userStore.setUser(response.data.data.user)
            this.$router.push({
              path: '/',
              query: {
                first: 'true' // First time for user so let's show some confetti
              }
            })
            this.success(this.$t('createTeam.success'))
            this.$emit('close')
          })
          .catch((error) => {
            this.handleBackendError(error)
          })
          .finally(() => {
            this.isSubmitting = false
          })
      }
    }
  }
</script>
