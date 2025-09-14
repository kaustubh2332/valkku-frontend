<template>
  <div>
    <div :class="{ 'pa-0': $vuetify.display.mobile, 'pa-5': !$vuetify.display.mobile }">
      <UserForm
        ref="userForm"
        v-model:form-valid="isFormValid"
        v-model:user="form"
        guardian
        @keydown="handleKeydown"
      />

      <!-- Guardians section -->
      <div v-if="form.role === 'athlete'" class="mt-4">
        <div v-if="guardians.length > 0" class="mb-3">
          <div class="text-subtitle-2 text-medium-emphasis mb-2">
            {{ $t('userManagement.guardians') }} ({{ guardians.length }})
          </div>
          <GuardianCard
            v-for="(guardian, index) in guardians"
            :key="index"
            :guardian="guardian"
            @remove="removeGuardian(index)"
          />
        </div>

        <v-btn class="mt-2" size="small" variant="text" @click="isAddGuardianOpen = true">
          <v-icon class="mr-2">mdi-plus</v-icon>
          {{ $t('userManagement.addGuardian') }}
        </v-btn>
      </div>
    </div>

    <v-card-actions :class="{ 'pa-0 pt-4': $vuetify.display.mobile, 'pa-6 pt-2': !$vuetify.display.mobile, 'd-flex justify-space-between': $vuetify.display.mobile }">
      <v-spacer v-if="!$vuetify.display.mobile" />
      <v-btn
        v-tooltip:bottom="$t('userManagement.createUserAndNewTooltip')"
        :disabled="!formValid"
        :loading="isSubmitting"
        :size="$vuetify.display.mobile ? 'default' : 'default'"
        @click="submitFormAndFocus"
      >
        {{ $t('userManagement.createUserAndNew') }}
      </v-btn>
      <v-btn
        v-tooltip:bottom="'Enter'"
        color="primary"
        :disabled="!formValid"
        :loading="isSubmitting"
        :size="$vuetify.display.mobile ? 'default' : 'default'"
        @click="submitFormAndClose"
      >
        {{ $t('userManagement.inviteUser') }}
      </v-btn>
    </v-card-actions>
  </div>

  <BottomSheetModal
    v-model="isAddGuardianOpen"
    height="95vh"
    nested
    :title="$t('userManagement.addGuardian')"
  >
    <div>
      <UserForm
        ref="guardianForm"
        v-model:form-valid="isGuardianFormValid"
        v-model:user="guardianForm"
        :guardian="true"
      />
      <div class="d-flex justify-space-between mt-4">
        <v-btn variant="text" @click="closeGuardianModal">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!guardianFormValid"
          variant="text"
          @click="addGuardian"
        >
          {{ $t('userManagement.addGuardian') }}
        </v-btn>
      </div>
    </div>
  </BottomSheetModal>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useTeamStore } from '@/stores/team'
  import { useUserStore } from '@/stores/user'
  import GuardianCard from './GuardianCard.vue'
  import UserForm from './UserForm.vue'

  export default {
    name: 'InviteUser',
    components: {
      UserForm,
      GuardianCard
    },
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
        isSubmitting: false,
        isAddGuardianOpen: false,
        guardians: [],
        isFormValid: false,
        isGuardianFormValid: false,
        form: {
          firstName: '',
          lastName: '',
          email: '',
          preferredLanguage: this.$i18n.locale,
          role: 'athlete'
        },
        guardianForm: {
          firstName: '',
          lastName: '',
          email: '',
          preferredLanguage: this.$i18n.locale,
          role: 'guardian'
        }
      }
    },
    computed: {
      formValid() {
        return this.isFormValid
      },
      guardianFormValid() {
        return this.isGuardianFormValid
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
              const firstNameField = this.$refs.userForm?.$refs?.form?.$el?.querySelector('input[autofocus]')
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
      resetForm() {
        this.form = {
          firstName: '',
          lastName: '',
          email: '',
          preferredLanguage: this.$i18n.locale,
          role: 'athlete'
        }
        this.guardians = []
        this.isFormValid = false
        this.$refs.userForm?.resetForm()
      },
      resetGuardianForm() {
        this.guardianForm = {
          firstName: '',
          lastName: '',
          email: '',
          preferredLanguage: this.$i18n.locale,
          role: 'guardian'
        }
        this.isGuardianFormValid = false
        this.$refs.guardianForm?.resetForm()
      },
      addGuardian() {
        if (!this.guardianFormValid) {
          return
        }

        // Add guardian to the array
        this.guardians.push({ ...this.guardianForm })

        // Close modal and reset form
        this.closeGuardianModal()
      },
      removeGuardian(index) {
        this.guardians.splice(index, 1)
      },
      closeGuardianModal() {
        this.isAddGuardianOpen = false
        this.resetGuardianForm()
      }
    }
  }
</script>

<style scoped>
/* Mobile-specific compact styling */
@media (max-width: 960px) {
  .v-card-title {
    font-size: 1.1rem !important;
    line-height: 1.2 !important;
  }

  .v-card-subtitle {
    font-size: 0.85rem !important;
    line-height: 1.3 !important;
  }

  /* Make form fields more compact */
  :deep(.v-field) {
    min-height: 40px !important;
  }

  :deep(.v-field__input) {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }

  :deep(.v-label) {
    font-size: 0.9rem !important;
  }
}
</style>
