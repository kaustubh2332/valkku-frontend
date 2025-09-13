<template>
  <div>
    <v-card-title>
      {{ $t('userManagement.inviteUser') }}
    </v-card-title>
    <v-card-subtitle>
      {{ $t('userManagement.inviteUserDescription') }} {{ userStore.currentTeam.teamName }}
    </v-card-subtitle>

    <v-card-text>
      <v-form
        ref="form"
        v-model="formValid"
        @keydown="handleKeydown"
      >
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.firstName"
              autofocus
              :label="$t('signUp.firstName')"
              required
              :rules="firstNameRules"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.lastName"
              :label="$t('signUp.lastName')"
              required
              :rules="lastNameRules"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="form.email"
              :label="$t('signUp.email')"
              required
              :rules="emailRules"
              type="email"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.preferredLanguage"
              :items="languageOptions"
              :label="$t('signUp.preferredLanguage')"
              required
              :rules="languageRules"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.role"
              :items="roleOptions"
              :label="$t('userManagement.role')"
              required
              :rules="roleRules"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!formValid"
        :loading="isSubmitting"
        @click="submitFormAndClose"
      >
        {{ $t('userManagement.inviteUser') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useTeamStore } from '@/stores/team'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'InviteUser',
    emits: ['user-invited'],
    setup() {
      const userStore = useUserStore()
      const teamStore = useTeamStore()
      const notificationStore = useNotificationStore()
      const error = notificationStore.error
      const success = notificationStore.success
      return { userStore, teamStore, error, success, notificationStore }
    },
    data() {
      return {
        formValid: false,
        isSubmitting: false,
        form: {
          firstName: '',
          lastName: '',
          email: '',
          preferredLanguage: this.$i18n.locale,
          role: 'athlete'
        }
      }
    },
    computed: {
      languageOptions() {
        return [
          { title: 'English', value: 'en' },
          { title: 'Suomi', value: 'fi' }
        ]
      },
      roleOptions() {
        return [
          { title: this.$t('roles.admin'), value: 'admin' },
          { title: this.$t('roles.coach'), value: 'coach' },
          { title: this.$t('roles.athlete'), value: 'athlete' },
          { title: this.$t('roles.guardian'), value: 'guardian' },
        ]
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
      emailRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.email_required'),
          (v: string) => /.+@.+\..+/.test(v) || this.$t('signUp.errors.email_invalid')
        ]
      },
      languageRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.firstName_required')
        ]
      },
      roleRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.role_required')
        ]
      }
    },
    methods: {
      handleKeydown(event) {
        if (event.key === 'Enter') {
          if (event.shiftKey) {
            // Shift + Enter: Submit and focus back to firstName
            event.preventDefault()
            this.submitFormAndFocus()
          } else {
            // Enter: Submit and close dialog
            event.preventDefault()
            this.submitFormAndClose()
          }
        }
      },
      async submitFormAndClose() {
        if (!this.formValid) {
          return
        }

        this.isSubmitting = true

        this.teamStore.inviteUser({
          ...this.form,
          teamId: this.userStore.currentTeamId
        })
          .then(() => {
            this.success(this.$t('userManagement.inviteUserSuccess'))
            this.resetForm()
            this.$emit('user-invited', this.form)
          })
          .catch((error) => {
            this.notificationStore.handleBackendError(error)
          })
          .finally(() => {
            this.isSubmitting = false
          })
      },
      async submitFormAndFocus() {
        if (!this.formValid) {
          return
        }

        this.isSubmitting = true

        this.teamStore.inviteUser({
          ...this.form,
          teamId: this.userStore.currentTeamId
        })
          .then(() => {
            this.success(this.$t('userManagement.inviteUserSuccess'))
            this.resetForm()
            // Focus back to firstName field
            this.$nextTick(() => {
              const firstNameField = this.$refs.form?.$el?.querySelector('input[autofocus]')
              if (firstNameField) {
                firstNameField.focus()
              }
            })
          })
          .catch((error) => {
            this.notificationStore.handleBackendError(error)
          })
          .finally(() => {
            this.isSubmitting = false
          })
      },
      async submitForm() {
        if (!this.formValid) {
          return
        }

        this.isSubmitting = true

        this.teamStore.inviteUser({
          ...this.form,
          teamId: this.userStore.currentTeamId
        })
          .then(() => {
            this.success(this.$t('userManagement.inviteUserSuccess'))
            this.resetForm()
          })
          .catch((error) => {
            this.notificationStore.handleBackendError(error)
          })
          .finally(() => {
            this.isSubmitting = false
          })

        // Reset form after successful submission

        // Emit success event or show notification
        this.$emit('user-invited', this.form)
      },
      resetForm() {
        this.form = {
          firstName: '',
          lastName: '',
          email: '',
          preferredLanguage: this.$i18n.locale,
          role: 'athlete'
        }
        this.$refs.form?.resetValidation()
      }
    }
  }
</script>
