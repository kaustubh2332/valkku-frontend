<template>
  <div>
    <v-form ref="form" @submit.prevent="save">
      <!-- Admin mode: Dual language input -->
      <v-row v-if="admin" class="mb-4">
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="formData.titleEn"
            autofocus
            density="compact"
            :label="$t('events.type_name') + ' (English)'"
            required
            :rules="titleEnRules"
            variant="outlined"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="formData.titleFi"
            density="compact"
            :label="$t('events.type_name') + ' (Finnish)'"
            required
            :rules="titleFiRules"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12">
          <div class="d-flex align-center">
            <span class="text-body-2 text-medium-emphasis mr-3">{{ $t('events.color') }}</span>
            <ChooseColor
              v-model="formData.color"
              :colors="availableColors"
            />
          </div>
        </v-col>
      </v-row>

      <!-- Regular mode: Single language input (but saves to both) -->
      <div v-else class="mb-4">
        <v-text-field
          v-model="currentLocaleTitle"
          autofocus
          class="mb-4"
          density="compact"
          :label="$t('events.type_name')"
          required
          :rules="titleRules"
          variant="outlined"
        />

        <div class="d-flex align-center">
          <span class="text-body-2 text-medium-emphasis mr-3">{{ $t('events.color') }}</span>
          <ChooseColor
            v-model="formData.color"
            :colors="availableColors"
          />
        </div>
      </div>

      <!-- Scope selection -->
      <div v-if="userStore.isStaff && !initial" class="mb-6">
        <div class="text-body-2 text-medium-emphasis mb-2">
          {{ $t('events.who_sees') }}
        </div>
        <v-radio-group v-model="formData.scope" density="compact">
          <v-radio
            :label="$t('events.add_to_own')"
            value="user"
          />
          <v-radio
            :label="$t('events.add_to_team')"
            value="team"
          />
        </v-radio-group>
      </div>

      <!-- Actions -->
      <div class="d-flex justify-end ga-2">
        <v-btn
          variant="text"
          @click="$emit('close')"
        >
          {{ $t('cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!isFormValid"
          :loading="saving"
          type="submit"
          variant="elevated"
        >
          {{ initial ? $t('events.save') : $t('events.add') }}
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useEventStore } from '@/stores/event'
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'CreatePlanPartType',
    props: {
      admin: {
        type: Boolean,
        default: false
      },
      initial: {
        type: Object,
        default: null
      }
    },
    emits: ['close', 'success'],
    setup() {
      const userStore = useUserStore()
      const notificationStore = useNotificationStore()
      const eventStore = useEventStore()
      const { locale } = useI18n()
      return { userStore, notificationStore, eventStore, locale }
    },
    data() {
      return {
        saving: false,
        formData: {
          titleEn: '',
          titleFi: '',
          color: '#2196F3',
          scope: 'user'
        },
        availableColors: [
          '#FFEB3B', // Light Yellow
          '#FFC107', // Amber
          '#8BC34A', // Light Green
          '#4CAF50', // Green
          '#00BCD4', // Light Cyan
          '#009688', // Teal
          '#2196F3', // Blue
          '#03A9F4', // Light Blue
          '#3F51B5', // Indigo
          '#673AB7', // Deep Purple
          '#9C27B0', // Purple
          '#E91E63', // Pink
          '#FF9800', // Orange
          '#FF5722', // Deep Orange
          '#F44336', // Red
          '#607D8B', // Blue Grey
          '#795548', // Brown
          '#424242'  // Dark Grey
        ]
      }
    },
    computed: {
      currentLocaleTitle: {
        get() {
          return this.locale === 'en' ? this.formData.titleEn : this.formData.titleFi
        },
        set(value) {
          // When user types, update both languages with the same value
          this.formData.titleEn = value
          this.formData.titleFi = value
        }
      },
      titleRules() {
        return [
          (v: string) => !!v || this.$t('events.type_name_required'),
          (v: string) => (v && v.length >= 2) || this.$t('events.type_name_min_length')
        ]
      },
      titleEnRules() {
        return [
          (v: string) => !!v || this.$t('events.type_name_required'),
          (v: string) => (v && v.length >= 2) || this.$t('events.type_name_min_length')
        ]
      },
      titleFiRules() {
        return [
          (v: string) => !!v || this.$t('events.type_name_required'),
          (v: string) => (v && v.length >= 2) || this.$t('events.type_name_min_length')
        ]
      },
      isFormValid() {
        return this.formData.titleEn && this.formData.titleEn.length >= 2 &&
          this.formData.titleFi && this.formData.titleFi.length >= 2 &&
          this.formData.color
      }
    },
    watch: {
      initial: {
        handler(newVal) {
          if (newVal) {
            this.populateForm(newVal)
          }
        },
        immediate: true
      }
    },
    methods: {
      populateForm(data) {
        if (data.titleObject) {
          // Populate from titleObject (both admin and regular mode)
          this.formData.titleEn = data.titleObject.en || ''
          this.formData.titleFi = data.titleObject.fi || ''
        } else if (data.title) {
          // Fallback for old data format (if any)
          this.formData.titleEn = data.title
          this.formData.titleFi = data.title
        }
        this.formData.color = data.color || '#2196F3'
        this.formData.scope = data.scope || 'user'
      },
      async save() {
        if (!this.$refs.form.validate()) return

        // Always prepare titleObject with both languages
        const formData = {
          titleObject: {
            en: this.formData.titleEn.trim(),
            fi: this.formData.titleFi.trim()
          },
          color: this.formData.color,
          scope: this.admin ? 'global' : this.formData.scope
        }

        // If initial prop exists, we're in edit mode within a parent component (like PlanPartsTable)
        // Just emit the data and let the parent handle the API call
        if (this.initial) {
          this.$emit('success', formData)
          return
        }

        // Otherwise, we're creating a new type (from CreatePlanPart.vue)
        // Handle the API call ourselves
        this.saving = true
        try {
          const payload: any = { ...formData }

          // Add teamId or userId based on scope
          if (!this.admin) {
            if (this.formData.scope === 'team') {
              payload.teamId = this.userStore.currentTeamId
            } else {
              payload.userId = this.userStore.user.id
            }
          }

          // Call the API to create the plan part type
          const response = await api.post(`/plan/plan-part-type/${this.userStore.currentTeamId}`, payload)

          if (response.data.success) {
            // Show success notification
            this.notificationStore.success(
              this.$t('admin.typeCreated')
            )

            // Add the new type to the store if not admin
            if (!this.admin) {
              this.eventStore.planPartTypes.push(response.data.data)
            }

            // Emit success event with the created type
            this.$emit('success', response.data.data)

            // Close the modal
            this.$emit('close')
          } else {
            this.notificationStore.error(
              response.data.message || this.$t('admin.planPartError')
            )
          }
        } catch (error) {
          console.error('Failed to create plan part type:', error)
          this.notificationStore.handleBackendError(error)
        } finally {
          this.saving = false
        }
      }
    }
  }
</script>
