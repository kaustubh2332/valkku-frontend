<template>
  <div class="pa-2">
    <v-form ref="form" v-model="formValid" @submit.prevent="save">
      <v-text-field
        v-model="title"
        class="mb-4"
        hide-details="auto"
        :label="$t('events.title')"
        :rules="titleRules"
        variant="outlined"
      />

      <div class="d-flex align-center mb-4">
        <div class="text-h6">
          {{ $t('events.event_plan') }}
        </div>
        <v-spacer />
        <v-tooltip v-if="!editing" location="bottom" :z-index="dropdownZIndex">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="toggleEdit"
            />
          </template>
          {{ $t('events.edit_event_plan') }}
        </v-tooltip>
        <v-tooltip v-else location="bottom" :z-index="dropdownZIndex">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-check"
              size="small"
              variant="text"
              @click="toggleEdit"
            />
          </template>
          {{ $t('events.stop_editing_event_plan') }}
        </v-tooltip>
      </div>

      <CreatePlan :editing="editing" />

      <div class="d-flex justify-end ga-2 mt-4">
        <v-btn variant="text" @click="cancel">{{ $t('cancel') }}</v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="!formValid" @click="save">{{ $t('events.create_event') }}</v-btn>
      </div>
    </v-form>
  </div>
</template>

<script lang="ts">
  import { useZIndex } from '@/composables/useZIndex'
  import { useEventStore } from '@/stores/event'

  export default {
    name: 'CreateEvent',
    emits: ['close', 'saved'],
    setup() {
      const eventStore = useEventStore()
      return { eventStore }
    },
    data() {
      return {
        formValid: false,
        title: '',
        editing: true
      }
    },
    computed: {
      dropdownZIndex() {
        const { calculateZIndex } = useZIndex()
        return calculateZIndex(10_000)
      },
      titleRules() {
        return [
          (v: string) => !!(v && v.trim().length > 0) || this.$t('events.titleRequired')
        ]
      }
    },
    async mounted() {
      await this.eventStore.initCreateEventData()
    },
    methods: {
      cancel() {
        this.$emit('close')
      },
      save() {
        if (!this.formValid) return
        const payload = { title: this.title.trim() }
        this.$emit('saved', payload)
        this.$emit('close')
      },
      toggleEdit() {
        this.editing = !this.editing
      }
    }
  }
</script>

<style scoped>
</style>
