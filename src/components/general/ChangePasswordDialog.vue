<template>
  <Dialog v-model="dialogOpen">
    <v-card-title class="text-h5 pa-6 pb-2">
      {{ $t('settings.changePasswordDialog.title') }}
    </v-card-title>
    <v-card-text class="pa-6">
      <v-form
        ref="passwordForm"
        v-model="formValid"
        @submit.prevent="handleSubmit"
      >
        <v-text-field
          v-model="currentEmail"
          autocomplete="current-email"
          :label="$t('settings.changePasswordDialog.currentEmail')"
          readonly
        />
        <v-text-field
          v-model="currentPassword"
          :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
          autocomplete="current-password"
          class="mb-2"
          :label="$t('settings.changePasswordDialog.currentPassword')"
          :rules="[v => !!v || $t('login.errors.password_required')]"
          :type="showCurrentPassword ? 'text' : 'password'"
          variant="outlined"
          @click:append-inner="showCurrentPassword = !showCurrentPassword"
        />
        <v-text-field
          v-model="newPassword"
          :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
          autocomplete="new-password"
          class="mb-2"
          :label="$t('settings.changePasswordDialog.newPassword')"
          :rules="newPasswordRules"
          :type="showNewPassword ? 'text' : 'password'"
          variant="outlined"
          @click:append-inner="showNewPassword = !showNewPassword"
        />
        <v-text-field
          v-model="confirmNewPassword"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
          autocomplete="new-password"
          :label="$t('settings.changePasswordDialog.confirmNewPassword')"
          :rules="confirmPasswordRules"
          :type="showConfirmPassword ? 'text' : 'password'"
          variant="outlined"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
        />
      </v-form>
    </v-card-text>
    <v-card-actions class="pa-6 pt-0">
      <v-btn
        variant="text"
        @click="handleClose"
      >
        {{ $t('cancel') }}
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!formValid"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ $t('settings.changePasswordDialog.submit') }}
      </v-btn>
    </v-card-actions>
  </Dialog>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'ChangePasswordDialog',
    props: {
      modelValue: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue', 'success'],
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    data() {
      return {
        notificationStore: useNotificationStore(),
        formValid: false,
        currentEmail: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
        loading: false
      }
    },

    computed: {
      dialogOpen: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
      newPasswordRules() {
        return [
          v => !!v || this.$t('login.errors.password_required'),
          v => v.length >= 8 || this.$t('settings.changePasswordDialog.passwordTooShort')
        ]
      },
      confirmPasswordRules() {
        return [
          v => !!v || this.$t('signUp.errors.passwordCheck_required'),
          v => v === this.newPassword || this.$t('settings.changePasswordDialog.passwordsDontMatch')
        ]
      }
    },
    created() {
      this.currentEmail = this.userStore.user?.email || ''
    },
    methods: {
      handleClose() {
        this.dialogOpen = false
        this.resetForm()
      },
      resetForm() {
        this.currentPassword = ''
        this.newPassword = ''
        this.confirmNewPassword = ''
        this.showCurrentPassword = false
        this.showNewPassword = false
        this.showConfirmPassword = false
        if (this.$refs.passwordForm) {
          this.$refs.passwordForm.resetValidation()
        }
      },
      async handleSubmit() {
        // Validate form
        const form = this.$refs.passwordForm
        if (!form) return

        const { valid } = await form.validate()
        if (!valid) return

        try {
          this.loading = true
          const response = await api.post('/auth/change-password', {
            currentPassword: this.currentPassword,
            newPassword: this.newPassword
          })

          // Get the localized success message from backend response
          const messageCode = response.data?.code || 'password_changed_successfully'
          const successMessage = this.notificationStore.getLocalizedMessage(messageCode, this.$i18n.locale) || 'Password changed successfully'

          this.notificationStore.success(successMessage)
          this.$emit('success')
          this.handleClose()
        } catch (error) {
          console.error('Failed to change password:', error)
          this.notificationStore.handleBackendError(error)
        } finally {
          this.loading = false
        }
      }
    }
  }
</script>
