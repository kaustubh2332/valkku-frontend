<template>
  <div v-bind="$attrs">
    <!-- TYPE BAR -->
    <div class="d-flex align-center">
      <!-- {{ part }} -->
      <div
        class="d-flex align-center px-2"
        :style="`cursor: ${editing ? 'grab' : 'default'}; width: 100%; display: flex; align-items: center; border-radius: 4px; border: 1px solid lightgrey; border-left: 8px solid ${color}; height: 32px;`"
      >
        <div class="d-flex align-center" style="width: 100%;">
          <v-chip
            color="primary"
            label
            size="small"
          >
            <div>
              {{ part.durationInMinutes }} min
            </div>
          </v-chip>
          <div class="text-truncate text-overline ml-2">
            {{ title }}
          </div>
          <v-spacer />
          <v-btn
            v-if="editing"
            v-tooltip:top="{ text: $t('events.edit_part'), zIndex: dropdownZIndex }"
            class="ml-1"
            fab
            rounded
            size="x-small"
            variant="text"
            @click.stop="editPart"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            v-if="editing"
            v-tooltip:top="{ text: $t('events.delete_part'), zIndex: dropdownZIndex }"
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
    </div>

    <div class="d-flex">
      <!-- SIDE LINE -->
      <!-- <div :style="`width: 4px; background-color: ${color}; margin-left: 4px; border-radius: ${roundedTip ? '0 0 2px 2px' : '0'}; transition-duration: 0.2s;`" /> -->
      <!-- CONTENT -->
      <div class="flex-grow-1" style="width: 100%;" :style="`border-left: 2px dashed lightgrey; margin-left: 6px;`">
        <draggable
          v-model="itemsProxy"
          :animation="150"
          chosen-class="drag-chosen"
          class="items-draggable"
          :disabled="!editing"
          drag-class="drag-dragging"
          ghost-class="drag-ghost"
          :group="editing ? group : false"
          item-key="id"
          :move="allowChildMove"
          tag="div"
          @end="onDragEnd"
          @start="isDragging = true"
        >
          <template #item="{ element }">
            <div
              :class="{ 'flash-border': element.__flash }"
              :data-node="element.nodeType === 'part' ? 'part' : 'item'"
              style="width: 100%;"
            >
              <PlanPartItem
                :key="element.id + '-' + (element.__flash ? 'flash' : 'noflash')"
                :editing="editing"
                :flash="!!element.__flash"
                :item="element"
                @edit="onChildItemEdited"
                @remove="onItemRemove(element)"
              />
            </div>
          </template>
          <!-- <template #footer>
            <transition name="dropzone">
              <div
                v-if="dropzoneVisible"
                class="dropzone-placeholder ma-2"
              />
            </transition>
          </template> -->
        </draggable>
        <div v-if="editing" class="pa-2 pt-0">
          <v-btn color="primary" size="small" variant="tonal" @click="creatingText = true">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <!-- <v-btn size="x-small" @click="creatingText = true">
            <v-icon>mdi-plus</v-icon>
            {{ $t('events.add_text') }}
          </v-btn> -->
        </div>
      </div>
    </div>

    <!-- Edit Plan Part Types Modal -->
    <BottomSheetModal
      v-model="editTypesModal"
      max-width="600"
      :title="$t('events.edit_plan_part_types')"
    >
      <EditPlanPartTypes
        :model-value="part"
        @close="editTypesModal = false"
      />
    </BottomSheetModal>
    <BottomSheetModal
      v-model="creatingText"
      :title="$t('events.create_text')"
    >
      <CreateText
        :initial="creatingTextText"
        @add="onTextAdded"
        @close="creatingText = false"
      />
    </BottomSheetModal>
    <BottomSheetModal
      v-model="editingPart"
      :title="$t('events.edit_plan_part')"
    >
      <CreatePlanPart
        :initial="editPartInitial || part"
        @add="onPartEdited"
        @close="editingPart = false"
      />
    </BottomSheetModal>
  </div>
</template>

<script lang="ts">
  import { useI18n } from 'vue-i18n'
  import draggable from 'vuedraggable'
  import { generateId } from '@/utils/id'
  import PlanPartItem from './items/PlanPartItem.vue'

  export default {
    name: 'PlanPart',
    components: {
      PlanPartItem,
      draggable
    },
    inheritAttrs: false,
    props: {
      modelValue: { // plan part items
        type: Array,
        default: () => ([])
      },
      part: {
        type: Object,
        default: () => ({})
      },
      colors: {
        type: Array,
        default: () => []
      },
      group: {
        type: Object,
        default: () => ({})
      },
      roundedTip: {
        type: Boolean,
        default: false
      },
      editing: {
        type: Boolean,
        default: true
      }
    },
    emits: ['update:modelValue', 'remove', 'update-part'],
    setup() {
      const { locale } = useI18n()
      return { locale }
    },
    data() {
      return {
        editTypesModal: false,
        creatingText: false,
        editingPart: false,
        editPartInitial: null,
        isDragging: false,
        creatingTextText: '',
        partTypes: [
          { title: 'Warm up', color: '#6366F1' },
          { title: 'Mobility', color: '#EC4899' },
          { title: 'Skills', color: '#10B981' }
        ]
      }
    },
    computed: {
      title() {
        return this.part.type.titleObject?.[this.locale] || this.part.type.titleObject?.en || this.part.type.titleObject?.fi || ''
      },
      color() {
        return this.part.type.color || '#6366F1'
      },
      itemsProxy: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
      dropzoneVisible() {
        return (!this.itemsProxy || this.itemsProxy.length === 0) && !this.isDragging
      },
      dropdownZIndex() {
        const baseZIndex = 30_000
        const modalDepth = this.getModalDepth()
        return baseZIndex + (modalDepth * 100)
      },
      partTypesWithEdit() {
        return [
          { title: '', value: '', color: null },
          ...this.partTypes,
          { title: '---', value: 'separator', disabled: true },
          { title: this.$t('events.edit_plan_part_types'), value: 'edit', prependIcon: 'mdi-cog' }
        ]
      }
    },
    methods: {
      allowChildMove(evt: any) {
        // Block parts from entering this child list
        const dragEl = evt?.dragged
        const draggedType = dragEl?.dataset?.node
        return draggedType !== 'part'
      },
      onItemRemove(item) {
        this.itemsProxy = this.itemsProxy.filter(i => i.id !== item.id)
      },
      onChildItemEdited(updated: any) {
        const idx = (this.itemsProxy || []).findIndex(i => i.id === updated.id)
        if (idx !== -1) {
          const next = this.itemsProxy.slice()
          next[idx] = { ...next[idx], ...updated, __flash: true }
          this.itemsProxy = next
          setTimeout(() => {
            const clear = this.itemsProxy.slice()
            if (clear[idx]) clear[idx].__flash = false
            this.itemsProxy = clear
          }, 600)
        }
      },
      onTextAdded(text) {
        const id = generateId()
        const position = this.itemsProxy.length
        this.itemsProxy.push({
          id,
          type: 'text',
          nodeType: 'item',
          position,
          item: { text },
          __flash: true
        })
        this.creatingText = false
        setTimeout(() => {
          const next = this.itemsProxy.slice()
          const i = next.findIndex(x => x.id === id)
          if (i !== -1) next[i].__flash = false
          this.itemsProxy = next
        }, 600)
      },
      openEditTypes() {
        this.editTypesModal = true
      },
      onTypeChange(value) {
        if (value === 'edit') {
          this.openEditTypes()
          this.$nextTick(() => {
            this.$emit('update-part', this.part)
          })
        } else if (value === '') {
          this.$emit('update-part', { ...this.part, type: '' })
        }
      },
      onColorChange(newColor) {
        const updated = { ...this.part, color: newColor, __flash: true }
        this.$emit('update-part', updated)
        setTimeout(() => {
          this.$emit('update-part', { ...updated, __flash: false })
        }, 600)
      },
      editPart() {
        // Snapshot the part to decouple from live reactivity while editing
        try {
          this.editPartInitial = structuredClone(this.part)
        } catch {
          this.editPartInitial = { ...this.part }
        }
        this.editingPart = true
      },
      onPartEdited(updatedPart) {
        const safeId = updatedPart?.id || this.part?.id
        const merged = { ...updatedPart, id: safeId }
        const before = this.part?.type?.id || this.part?.type
        const after = merged?.type?.id || merged?.type
        console.log('[PlanPart] onPartEdited', { id: safeId, before, after })
        this.$emit('update-part', merged)
        this.editingPart = false
      },
      getModalDepth() {
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
      },
      onDragEnd() {
        this.isDragging = false
        // Update positions for all items after drag
        this.itemsProxy = this.itemsProxy.map((item: any, index: number) => ({
          ...item,
          position: index
        }))
      }
    }
  }
</script>

<style scoped>
.items-draggable {
  width: 100%;
  min-height: 5px; /* thinner dropzone when empty */
}
.dropzone-placeholder {
  border: 1px dashed rgba(25,118,210,0.35);
  border-radius: 4px;
  height: 28px;
  width: 100%;
  background: transparent;
  position: relative;
  z-index: 0;
  overflow: hidden;
  pointer-events: none; /* never capture drag */
}
/* Transition hooks */
.dropzone-enter-from,
.dropzone-leave-to { height: 0; opacity: 0; margin-top: 0; margin-bottom: 0; }
.dropzone-enter-active,
.dropzone-leave-active { transition: height 180ms ease-in-out, opacity 150ms ease-in-out, margin 180ms ease-in-out; }
.dropzone-enter-to,
.dropzone-leave-from { height: 28px; opacity: 1; }

.flash-border {
  animation: flash-border 0.6s ease-in-out 1;
}
@keyframes flash-border {
  0% { box-shadow: 0 0 0 0 rgba(25,118,210,0.4); border: 1px solid rgba(25,118,210,0.6); }
  50% { box-shadow: 0 0 0 6px rgba(25,118,210,0.0); border: 1px solid rgba(25,118,210,1); }
  100% { box-shadow: 0 0 0 0 rgba(25,118,210,0.0); border: 1px solid transparent; }
}
.drag-ghost {
  opacity: 0.95;
  position: relative;
  z-index: 3; /* always above placeholder */
}
.drag-chosen { box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
.drag-dragging { cursor: grabbing; }
</style>
