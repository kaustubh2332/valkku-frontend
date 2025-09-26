<template>
  <div>
    <!-- TITLE BAR -->
    <div class="d-flex align-center">
      <div
        class="d-flex align-center px-2"
        :style="`height: 35px; width: 100%; border: 1px solid grey; border-left: 9px solid ${part.color}; border-radius: 5px;`"
        @dblclick="startEditTitle"
      >
        <div v-if="editingTitle" class="d-flex align-center" style="width: 100%;">
          <v-text-field
            ref="titleInput"
            v-model="localTitle"
            autofocus
            class="mr-2"
            density="compact"
            hide-details
            style="width: auto; min-width: 100px; max-width: 200px;"
            variant="outlined"
            @blur="saveTitle"
            @keydown.enter.prevent="saveTitle"
            @keydown.esc.prevent="cancelEditTitle"
          />
          <v-btn size="x-small" variant="text" @click="saveTitle">
            <v-icon size="16">mdi-check</v-icon>
          </v-btn>
          <v-spacer />
          <v-btn size="x-small" variant="text" @click="cancelEditTitle">
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </div>
        <div v-else class="d-flex align-center" style="width: 100%;">
          <div class="text-subtitle-2 text-truncate">{{ part.title }}</div>
          <v-btn
            v-tooltip:top="{ text: $t('events.edit_part_name'), zIndex: tooltipZIndex }"
            class="ml-1"
            size="x-small"
            variant="text"
            @click.stop="startEditTitle"
          >
            <v-icon size="16">mdi-pencil</v-icon>
          </v-btn>
          <v-spacer />
          <v-btn
            v-tooltip:top="{ text: $t('events.delete_part'), zIndex: tooltipZIndex }"
            class="ml-1"
            fab
            rounded
            size="x-small"
            variant="text"
            @click.stop="$emit('remove', part)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
      <div style="margin-left: 2px; cursor: grab;">
        <v-icon size="16">mdi-drag-vertical</v-icon>
      </div>
    </div>

    <div class="d-flex">
      <!-- SIDE LINE -->
      <div :style="`width: 4px; background-color: ${part.color}; margin-left: 5px;`" />
      <!-- CONTENT -->
      <div class="pa-2">
        <div
          v-for="item in part?.items"
          :key="item.id"
        >
          {{ item }}
        </div>
        <v-btn size="x-small" variant="text">
          <v-icon>mdi-plus</v-icon>
          {{ $t('events.add_text') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'CreatePlanPart',
    props: {
      part: {
        type: Object,
        default: () => ({})
      },
      colors: {
        type: Array,
        default: () => []
      }
    },
    emits: ['update', 'remove'],
    data() {
      return {
        editingTitle: false,
        localTitle: this.part?.title || ''
      }
    },
    computed: {
      tooltipZIndex() {
        // Base z-index for modals is typically 30000
        // Add extra layers for nested modals
        const baseZIndex = 30_000
        const modalDepth = this.getModalDepth()
        return baseZIndex + (modalDepth * 100) + 50
      }
    },
    watch: {
      part: {
        deep: true,
        handler(newVal) {
          if (!this.editingTitle) {
            this.localTitle = newVal?.title || ''
          }
        }
      }
    },
    methods: {
      startEditTitle() {
        this.localTitle = this.part?.title || ''
        this.editingTitle = true
        this.$nextTick(() => {
          const inputRef = this.$refs.titleInput as any
          const el = inputRef && (inputRef.$el && inputRef.$el.querySelector ? inputRef.$el.querySelector('input') : null)
          if (el) {
            el.focus()
            el.select()
          }
        })
      },
      saveTitle() {
        const title = (this.localTitle || '').trim()
        const updated = { ...this.part, title }
        console.log('updated', updated)
        this.$emit('update', updated)
        this.editingTitle = false
      },
      cancelEditTitle() {
        this.localTitle = this.part?.title || ''
        this.editingTitle = false
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
            element.classList.contains('v-menu')
          )) {
            depth++
          }
        }
        return depth
      }
    }
  }
</script>
