<template>
  <div>
    <v-form ref="form" @submit.prevent="save">
      <div class="mb-4">
        <!-- Admin mode: Dual language input -->
        <template v-if="admin">
          <v-row>
            <v-col cols="12" sm="6">
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
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.titleFi"
                density="compact"
                :label="$t('events.type_name') + ' (Finnish)'"
                required
                :rules="titleFiRules"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </template>

        <!-- Regular mode: Single language input -->
        <template v-else>
          <v-text-field
            v-model="formData.title"
            autofocus
            density="compact"
            :label="$t('events.type_name')"
            required
            :rules="titleRules"
            variant="outlined"
          />
        </template>

        <!-- Color picker -->
        <div class="d-flex align-center mt-4">
          <span class="mr-4">{{ $t('events.color') }}:</span>
          <ChooseColor
            v-model="formData.color"
            :colors="availableColors"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="d-flex justify-end">
        <v-btn
          variant="text"
          @click="$emit('close')"
        >
          {{ $t('cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          :disabled="!isFormValid"
          :loading="saving"
          type="submit"
        >
          {{ initial ? $t('events.save') : $t('events.add') }}
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script lang="ts">
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
    emits: ['close', 'save'],
    data() {
      return {
        saving: false,
        formData: {
          title: '',
          titleEn: '',
          titleFi: '',
          color: '#2196F3'
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
        if (this.admin) {
          return this.formData.titleEn && this.formData.titleEn.length >= 2 &&
            this.formData.titleFi && this.formData.titleFi.length >= 2 &&
            this.formData.color
        }
        return this.formData.title && this.formData.title.length >= 2 && this.formData.color
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
        if (this.admin && data.titleObject) {
          // Admin mode: populate both languages
          this.formData.titleEn = data.titleObject.en || ''
          this.formData.titleFi = data.titleObject.fi || ''
        } else {
          // Regular mode: populate single title
          this.formData.title = data.title || ''
        }
        this.formData.color = data.color || '#2196F3'
      },
      async save() {
        if (!this.$refs.form.validate()) return

        this.saving = true
        try {
          let planPartType

          planPartType = this.admin
            ? {
              // Admin mode: Create titleObject with both languages
              titleObject: {
                en: this.formData.titleEn.trim(),
                fi: this.formData.titleFi.trim()
              },
              color: this.formData.color
            }
            : {
              // Regular mode: Single title
              title: this.formData.title.trim(),
              color: this.formData.color
            }

          this.$emit('save', planPartType)
        } finally {
          this.saving = false
        }
      }
    }
  }
</script>
