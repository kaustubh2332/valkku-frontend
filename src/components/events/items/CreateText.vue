<template>
  <div @keydown="onKeydown">
    <TextEditor
      v-model="text"
      :autofocus="initial ? 'all' : 'start'"
    />
  </div>
  <div class="d-flex mt-4">
    <v-btn variant="text" @click="$emit('close')">
      {{ $t('cancel') }}
    </v-btn>
    <v-spacer />
    <v-tooltip location="bottom" :z-index="dropdownZIndex">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          color="primary"
          @click="save"
        >
          {{ $t('add') }}
        </v-btn>
      </template>
      <div class="d-flex align-center">
        <v-hotkey :keys="'shift+enter'" />
      </div>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
  import { useZIndex } from '@/composables/useZIndex'

  export default {
    name: 'CreateText',
    props: {
      initial: {
        type: String,
        default: ''
      }
    },
    emits: ['close', 'add'],
    data() {
      return {
        text: this.initial || ''
      }
    },
    computed: {
      dropdownZIndex() {
        const { calculateZIndex } = useZIndex()
        return calculateZIndex(10_000)
      }
    },
    watch: {
      initial(newVal) {
        this.text = newVal || ''
      }
    },
    methods: {
      onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault()
          this.save()
        }
      },
      save() {
        this.$emit('add', this.text)
      }
    }
  }
</script>
