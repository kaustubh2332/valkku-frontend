<template>
  <div class="create-plan-part pt-4">
    <v-form ref="form" @submit.prevent="save">
      <div class="mb-4">
        <div>
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                ref="select"
                v-model="formData.type"
                density="compact"
                item-title="title"
                item-value="id"
                :items="transformedTypes"
                :label="$t('events.plan_part_type')"
                :menu-props="{ zIndex: dropdownZIndex }"
                required
                :rules="typeRules"
                variant="outlined"
                @update:model-value="blurTypeSelect"
              >
                <template #item="{ props, item }">
                  <v-list-item density="compact" v-bind="props">
                    <template #prepend>
                      <div
                        class="color-preview mr-2"
                        :style="{ backgroundColor: (item.raw as any).color, width: '16px', height: '16px', borderRadius: '50%' }"
                      />
                    </template>
                    <template #append>
                      <v-icon v-if="(item.raw as any).scope === 'global'" v-tooltip:top="$t('events.global_scope')" small>mdi-earth</v-icon>
                      <v-icon v-if="(item.raw as any).scope === 'team'" v-tooltip:top="$t('events.team_scope')" small>mdi-account-group</v-icon>
                      <v-icon v-if="(item.raw as any).scope === 'user'" v-tooltip:top="$t('events.user_scope')" small>mdi-account</v-icon>
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <div
                      class="color-preview mr-2"
                      :style="{ backgroundColor: (item.raw as any).color, width: '12px', height: '12px', borderRadius: '50%' }"
                    />
                    <span>{{ item.title }}</span>
                  </div>
                </template>
                <template #prepend-item>
                  <div class="d-flex pa-4">
                    <v-btn color="primary" size="x-small" variant="tonal" @click="openCreateTypeModal">
                      <v-icon class="mr-2">mdi-plus</v-icon>
                      {{ $t('events.add_new_type') }}
                    </v-btn>
                    <v-spacer />
                    <v-btn size="x-small" variant="tonal" @click="openEditTypesDialog">
                      <v-icon class="mr-2">mdi-pencil</v-icon>
                      {{ $t('events.edit_types') }}
                    </v-btn>
                  </div>
                  <v-divider />
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                ref="duration"
                v-model.number="formData.durationInMinutes"
                density="compact"
                :label="$t('events.duration_minutes')"
                max="480"
                min="1"
                required
                :rules="durationRules"
                type="number"
                variant="outlined"
                @focus="selectAllText"
              />
            </v-col>
          </v-row>
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
          :loading="saving"
          type="submit"
        >
          {{ $t('events.add_plan_part') }}
        </v-btn>
      </div>
    </v-form>

    <!-- Create Plan Part Type Modal -->
    <BottomSheetModal
      v-model="createTypeModal"
      :title="$t('events.add_new_type')"
      @close="createTypeModal = false"
    >
      <CreatePlanPartType
        @close="createTypeModal = false"
        @success="onTypeCreated"
      />
    </BottomSheetModal>

    <!-- Edit Plan Part Types Dialog -->
    <EditPlanPartTypesDialog
      v-model="editTypesDialog"
      @update:model-value="editTypesDialog = $event"
    />
  </div>
</template>

<script lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useEventStore } from '@/stores/event'
  import { generateId } from '@/utils/id'

  export default {
    name: 'CreatePlanPart',
    props: {
      initial: {
        type: Object,
        default: null
      }
    },
    emits: ['close', 'add'],
    setup() {
      const eventStore = useEventStore()
      const { planPartTypes } = eventStore
      const { locale } = useI18n()
      return { eventStore, planPartTypes, locale }
    },
    data() {
      return {
        saving: false,
        createTypeModal: false,
        editTypesDialog: false,
        formData: {
          type: '',
          durationInMinutes: 30
        }
      }
    },
    computed: {
      transformedTypes() {
        // Transform planPartTypes to have a title property for v-select
        return this.planPartTypes.map(item => ({
          ...item,
          title: this.getTitle(item)
        }))
      },
      typeRules() {
        return [
          (v: string) => !!v || this.$t('events.type_required')
        ]
      },
      durationRules() {
        return [
          (v: number) => !!v || this.$t('events.duration_required'),
          (v: number) => (v >= 1 && v <= 480) || this.$t('events.duration_range')
        ]
      },
      dropdownZIndex() {
        const baseZIndex = 30_000
        const modalDepth = this.getModalDepth()
        return baseZIndex + (modalDepth * 100) + 10_000
      }
    },
    watch: {
      initial: {
        handler(newVal) {
          if (newVal) {
            this.formData.type = newVal.type?.id || newVal.type || ''
            this.formData.durationInMinutes = newVal.durationInMinutes || newVal.duration || 30
          }
        },
        immediate: true
      }
    },
    methods: {
      getTitle(item) {
        return item.titleObject?.[this.locale] || item.titleObject?.en || ''
      },
      async save() {
        const { valid } = await this.$refs.form.validate()
        if (!valid) return

        this.saving = true
        try {
          const selectedType = this.planPartTypes.find(t => t.id === this.formData.type)
          const planPart = {
            id: this.initial?.id || generateId(),
            type: selectedType,
            color: selectedType?.color || this.initial?.color || '#4CAF50',
            durationInMinutes: this.formData.durationInMinutes,
            items: this.initial?.items || []
          }

          this.$emit('add', planPart)
        } finally {
          this.saving = false
        }
      },
      selectAllText(event) {
        // Select all text when the input is focused
        event.target.select()
      },
      openCreateTypeModal() {
        this.$refs.select.blur()
        this.createTypeModal = true
      },
      openEditTypesDialog() {
        this.$refs.select.blur()
        this.editTypesDialog = true
      },
      onTypeCreated(newType) {
        // Select the newly created type
        this.formData.type = newType.id
        // Modal is already closed by the CreatePlanPartType component
      },
      getModalDepth() {
        // Count the number of modal containers in the DOM hierarchy
        let depth = 0
        let element = this.$el
        while (element && element.parentElement) {
          element = element.parentElement
          if (element.classList && (
            element.classList.contains('v-overlay') ||
            element.classList.contains('v-dialog') ||
            element.classList.contains('v-bottom-sheet') ||
            element.classList.contains('v-menu') ||
            element.classList.contains('modal-overlay')
          )) {
            depth++
          }
        }
        return depth
      },
      async blurTypeSelect() {
        await this.$nextTick()
        this.$refs.select.blur()
        this.$refs.duration.focus()
      }
    }
  }
</script>

<style scoped>
.color-preview {
  flex-shrink: 0;
}
</style>
