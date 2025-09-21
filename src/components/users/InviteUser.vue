<template>
  <div>
    <div :class="{ 'pa-0': $vuetify.display.mobile, 'pa-5': !$vuetify.display.mobile }">
      <UserForm
        ref="userForm"
        v-model:form-valid="isFormValid"
        v-model:user="form"
        :dropdown-z-index="dropdownZIndex"
        :is-guardian="isGuardian"
        :is-modal="true"
        @keydown="handleKeydown"
      />

      <!-- Guardians section -->
      <transition name="slide-down">
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
          <div class="d-flex align-center">
            <v-tooltip
              v-if="!$vuetify.display.mobile"
              location="bottom"
              :z-index="dropdownZIndex"
            >
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  class="mt-2"
                  size="small"
                  variant="text"
                  @click="isAddGuardianOpen = true"
                >
                  <v-icon class="mr-2">mdi-plus</v-icon>
                  {{ $t('userManagement.addGuardian') }}
                </v-btn>
              </template>
              <div class="d-flex align-center">
                <v-hotkey :keys="`${modifierKey}+g`" />
              </div>
            </v-tooltip>
            <v-btn
              v-else
              class="mt-2"
              size="small"
              variant="text"
              @click="isAddGuardianOpen = true"
            >
              <v-icon class="mr-2">mdi-plus</v-icon>
              {{ $t('userManagement.addGuardian') }}
            </v-btn>
          </div>
        </div>
      </transition>
    </div>

    <v-card-actions :class="{ 'pa-0 pt-4': $vuetify.display.mobile, 'pa-6 pt-2': !$vuetify.display.mobile, 'd-flex justify-space-between': $vuetify.display.mobile }">
      <v-spacer v-if="!$vuetify.display.mobile" />

      <!-- Create & New tooltip on desktop -->
      <v-tooltip
        v-if="!$vuetify.display.mobile"
        location="bottom"
        :z-index="dropdownZIndex"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :disabled="!formValid"
            :loading="isSubmitting"
            :size="$vuetify.display.mobile ? 'default' : 'default'"
            @click="submitForm(true)"
          >
            {{ $t('userManagement.createUserAndNew') }}
          </v-btn>
        </template>
        <div class="d-flex align-center">
          <v-hotkey :keys="'shift+enter'" />
        </div>
      </v-tooltip>
      <v-btn
        v-else
        :disabled="!formValid"
        :loading="isSubmitting"
        :size="$vuetify.display.mobile ? 'default' : 'default'"
        @click="submitForm(true)"
      >
        {{ $t('userManagement.createUserAndNew') }}
      </v-btn>

      <!-- Invite User tooltip on desktop -->
      <v-tooltip
        v-if="!$vuetify.display.mobile"
        location="bottom"
        :z-index="dropdownZIndex"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            color="primary"
            :disabled="!formValid"
            :loading="isSubmitting"
            :size="$vuetify.display.mobile ? 'default' : 'default'"
            @click="submitForm(false)"
          >
            {{ $t('userManagement.inviteUser') }}
          </v-btn>
        </template>
        <div class="d-flex align-center">
          <v-hotkey :keys="'enter'" />
        </div>
      </v-tooltip>
      <v-btn
        v-else
        color="primary"
        :disabled="!formValid"
        :loading="isSubmitting"
        :size="$vuetify.display.mobile ? 'default' : 'default'"
        @click="submitForm(false)"
      >
        {{ $t('userManagement.inviteUser') }}
      </v-btn>
    </v-card-actions>
  </div>

  <BottomSheetModal
    v-model="isAddGuardianOpen"
    height="95vh"
    nested
    :nesting-level="1"
    :title="$t('userManagement.addGuardian') + ' - ' + (athleteUser?.fullName || athleteUser?.email || '')"
  >
    <div>
      <UserForm
        ref="guardianForm"
        v-model:form-valid="isGuardianFormValid"
        v-model:user="guardianForm"
        :dropdown-z-index="guardianDropdownZIndex"
        :is-guardian="true"
        :is-modal="true"
        @keydown="handleGuardianKeydown"
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

  export default {
    name: 'InviteUser',
    props: {
      athleteUser: {
        type: Object,
        default: null
      },
      isGuardian: {
        type: Boolean,
        default: false
      },
      isOpen: {
        type: Boolean,
        default: false
      }
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
        guardians: [],
        isFormValid: false,
        isAddGuardianOpen: false,
        isGuardianFormValid: false,
        form: {
          email: '',
          firstName: '',
          lastName: '',
          preferredLanguage: 'en',
          role: 'athlete'
        },
        guardianForm: {
          email: '',
          firstName: '',
          lastName: '',
          preferredLanguage: 'en',
          role: 'guardian'
        }
      }
    },
    computed: {
      formValid() {
        return this.isFormValid
      },
      defaultPreferredLanguage() {
        return this.userStore.user?.preferredLanguage || 'en'
      },
      dropdownZIndex() {
        // Calculate z-index for modal dropdown
        const baseZIndex = 25_000
        return baseZIndex + 1000 // dropdown should be above modal content
      },
      guardianDropdownZIndex() {
        // Calculate z-index for nested modal (nesting level 1)
        const baseZIndex = 25_000
        const nestingIncrement = 10_000
        const modalZIndex = baseZIndex + (1 * nestingIncrement)
        return modalZIndex + 1000
      },
      guardianFormValid() {
        return this.isGuardianFormValid
      },
      isMac() {
        return navigator.platform.toUpperCase().includes('MAC')
      },
      modifierKey() {
        return this.isMac ? 'cmd' : 'ctrl'
      },
      addGuardianTooltip() {
        return `${this.$t('userManagement.addGuardian')} (${this.modifierKey.toUpperCase()}+G)`
      }
    },
    watch: {
      isOpen(newVal) {
        if (newVal) {
          document.addEventListener('keydown', this.handleKeydown)
        } else {
          document.removeEventListener('keydown', this.handleKeydown)
        }
      }
    },
    mounted() {
      // Attach key handler only when modal is open
      if (this.isOpen) {
        document.addEventListener('keydown', this.handleKeydown)
      }

      // Set role to guardian if athlete user is provided
      if (this.athleteUser) {
        this.form.role = 'guardian'
        // Default guardian language to athlete's preferredLanguage
        if (this.athleteUser.preferredLanguage) {
          this.form.preferredLanguage = this.athleteUser.preferredLanguage
        }
      }
    },
    beforeUnmount() {
      // Remove document-level keydown listener
      document.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
      handleKeydown(event) {
        // Open guardian modal with Cmd/Ctrl + G
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'g') {
          event.preventDefault()
          event.stopPropagation()
          if (this.form.role === 'athlete') {
            this.isAddGuardianOpen = true
          }
          return
        }

        if (event.key === 'Enter') {
          if (this.isSubmitting) {
            event.preventDefault()
            return
          }
          // Don't handle Enter if guardian modal is open
          if (this.isAddGuardianOpen) {
            return
          }

          // Treat Shift+Enter OR Cmd/Ctrl+Enter as Create & New
          const createAndNew = event.shiftKey || event.metaKey || event.ctrlKey
          event.preventDefault()
          this.submitForm(createAndNew)
        }
      },
      async submitForm(shouldFocus = false) {
        if (this.isSubmitting) return
        // Force-validate form on submit to catch incomplete email
        const isValid = await this.$refs.userForm?.validate()
        if (!isValid) {
          return
        }

        this.isSubmitting = true
        const lastRole = this.form.role

        this.teamStore.inviteUser({
          ...this.form,
          guardians: this.form.role === 'athlete' ? this.guardians : undefined,
          guardianOf: this.athleteUser ? this.athleteUser.userId || this.athleteUser.id : undefined,
          teamId: this.userStore.currentTeamId
        })
          .then(() => {
            this.success(this.$t('userManagement.inviteUserSuccess'))
            this.resetForm()
            // For create & new, keep previously chosen role
            if (shouldFocus) {
              this.form.role = lastRole
            }

            if (shouldFocus) {
              // Focus back to firstName field
              this.$nextTick(() => {
                const firstNameField = this.$refs.userForm?.$refs?.form?.$el?.querySelector('input[autofocus]')
                if (firstNameField) {
                  firstNameField.focus()
                }
              })
            } else {
              this.$emit('user-invited', this.form)
            }
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
          email: '',
          firstName: '',
          lastName: '',
          preferredLanguage: this.athleteUser?.preferredLanguage || this.defaultPreferredLanguage,
          role: this.athleteUser ? 'guardian' : 'athlete'
        }
        this.guardians = []
        this.isAddGuardianOpen = false
        this.isGuardianFormValid = false
        this.isFormValid = false
        this.$refs.userForm?.resetForm()
      },
      async addGuardian() {
        // Validate the guardian form first
        const isValid = await this.$refs.guardianForm?.validate()
        if (!isValid) {
          return
        }

        this.guardians.push({ ...this.guardianForm })
        this.closeGuardianModal()
      },
      closeGuardianModal() {
        this.isAddGuardianOpen = false
        this.resetGuardianForm()
      },
      resetGuardianForm() {
        this.guardianForm = {
          email: '',
          firstName: '',
          lastName: '',
          preferredLanguage: this.defaultPreferredLanguage,
          role: 'guardian'
        }
        this.isGuardianFormValid = false
        this.$refs.guardianForm?.resetForm()
      },
      removeGuardian(index) {
        this.guardians.splice(index, 1)
      },
      handleGuardianKeydown(event) {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()

          // Use the same validation as the button
          this.addGuardian()
        }
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

/* Slide transition for guardian section */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
  max-height: 0;
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  max-height: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
}
</style>
