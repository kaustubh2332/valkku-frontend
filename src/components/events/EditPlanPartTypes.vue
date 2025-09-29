<template>
  <div class="edit-plan-part-types">
    <v-form ref="form">
      <v-list>
        <v-list-item
          v-for="(type, index) in planPartTypes"
          :key="index"
          class="mb-2"
        >
          <template #prepend>
            <div
              class="color-preview mr-3"
              :style="{ backgroundColor: type.color, width: '20px', height: '20px', borderRadius: '50%' }"
            />
          </template>

          <v-list-item-title>{{ type.title }}</v-list-item-title>

          <template #append>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="removeType(index)"
            />
          </template>
        </v-list-item>
      </v-list>

      <!-- Add new type -->
      <v-card class="mt-4" variant="outlined">
        <v-card-title class="text-subtitle-1">
          {{ $t('events.add_new_type') }}
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="8">
              <v-text-field
                v-model="newType.title"
                density="compact"
                :label="$t('events.type_name')"
                variant="outlined"
              />
            </v-col>
            <v-col cols="4">
              <ChooseColor
                v-model="newType.color"
                :size="32"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="!newType.title.trim()"
            variant="text"
            @click="addType"
          >
            {{ $t('events.add') }}
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Actions -->
      <div class="d-flex justify-end mt-6">
        <v-btn
          variant="text"
          @click="$emit('close')"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          @click="save"
        >
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script lang="ts">
  import ChooseColor from '../general/ChooseColor.vue'

  export default {
    name: 'EditPlanPartTypes',
    components: {
      ChooseColor
    },
    props: {
      modelValue: {
        type: Object,
        default: () => ({})
      }
    },
    emits: ['update:modelValue', 'close'],
    data() {
      return {
        planPartTypes: [
          { title: 'Warm up', color: '#6366F1' },
          { title: 'Mobility', color: '#EC4899' },
          { title: 'Skills', color: '#10B981' }
        ],
        newType: {
          title: '',
          color: '#4CAF50'
        }
      }
    },
    methods: {
      addType() {
        if (this.newType.title.trim()) {
          this.planPartTypes.push({ ...this.newType })
          this.newType = { title: '', color: '#4CAF50' }
        }
      },
      removeType(index) {
        this.planPartTypes.splice(index, 1)
      },
      save() {
        const updated = { ...this.modelValue, availableTypes: this.planPartTypes }
        this.$emit('update:modelValue', updated)
        this.$emit('close')
      }
    }
  }
</script>

<style scoped>
.color-preview {
  border: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
