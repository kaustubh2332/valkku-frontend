<template>
  <div>
    <draggable
      v-model="parts"
      :animation="150"
      chosen-class="drag-chosen"
      class="parts-draggable"
      :disabled="!editing"
      drag-class="drag-dragging"
      ghost-class="drag-ghost"
      :group="editing ? topLevelGroup : false"
      item-key="id"
      style="width: 100%;"
      tag="div"
    >
      <template #item="{ element, index }">
        <PlanPart
          v-if="element.nodeType === 'part'"
          :key="'part-' + element.id + '-' + (element.__flash ? 'flash' : 'noflash')"
          v-model="element.items"
          :colors="colors"
          data-node="part"
          :editing="editing"
          :group="editing ? childrenGroup : false"
          :part="element"
          :rounded-tip="nextItem(index) && nextItem(index)?.nodeType !== 'part'"
          @remove="handlePartRemove(index)"
          @update="handlePartUpdate(index, $event)"
        />
        <PlanPartItem
          v-else
          :key="'item-' + element.id + '-' + (element.__flash ? 'flash' : 'noflash')"
          data-node="item"
          :flash="!!element.__flash"
          :item="element"
          @edit="onItemEdit"
        />
      </template>
    </draggable>
    <div v-if="editing" class="d-flex ga-2">
      <v-btn :loading="loadingPlanPartTypes" size="small" @click="createTextOpen = true">
        <v-icon class="mr-2">mdi-plus</v-icon>
        {{ $t('events.add_text') }}
      </v-btn>
      <v-btn :loading="loadingPlanPartTypes" size="small" @click="createPlanPartOpen = true">
        <v-icon class="mr-2">mdi-plus</v-icon>
        {{ $t('events.add_plan_part') }}
      </v-btn>
    </div>
  </div>

  <div>
    <BottomSheetModal
      v-model="createPlanPartOpen"
      :title="$t('events.add_plan_part')"
    >
      <CreatePlanPart
        :colors="colors"
        @add="addPart"
        @close="createPlanPartOpen = false"
      />
    </BottomSheetModal>
    <BottomSheetModal
      v-model="createTextOpen"
      :title="$t('events.add_text')"
    >
      <CreateText
        @add="addText"
        @close="createTextOpen = false"
      />
    </BottomSheetModal>
  </div>
</template>

<script lang="ts">
  import draggable from 'vuedraggable'
  import { useEventStore } from '@/stores/event'

  export default {
    name: 'CreatePlan',
    components: {
      draggable
    },
    props: {
      editing: {
        type: Boolean,
        default: true
      }
    },
    setup() {
      const eventStore = useEventStore()
      const { loadingPlanPartTypes } = eventStore
      return { eventStore, loadingPlanPartTypes }
    },
    data() {
      return {
        parts: [],
        createPlanPartOpen: false,
        createTextOpen: false,
        colors: [
          '#6366F1',
          '#EC4899',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EF4444',
          '#06B6D4',
          '#84CC16',
          '#F97316'
        ],
        topLevelGroup: {
          pull: true,
          name: "top",
          put: ["items", "top"]
        },
        childrenGroup: {
          name: "items",
          pull: true,
          // Accept only non-part draggables from anywhere
          put: (_to: any, _from: any, dragEl: HTMLElement) => dragEl?.dataset?.node !== 'part'
        }
      }
    },
    methods: {
      nextItem(index: number) {
        return this.parts[index + 1] || null
      },
      handlePartUpdate(index: number, updated: any) {
        this.parts[index] = { ...this.parts[index], ...updated }
      },
      onItemEdit(updated: any) {
        // try top level first
        const topIdx = this.parts.findIndex((p: any) => p.id === updated.id)
        if (topIdx !== -1) {
          const next = this.parts.slice()
          next[topIdx] = { ...next[topIdx], ...updated, __flash: true }
          this.parts = next
          setTimeout(() => {
            const clear = this.parts.slice()
            if (clear[topIdx]) clear[topIdx].__flash = false
            this.parts = clear
          }, 600)
          return
        }
        // then scan inside parts
        const nextParts = this.parts.map((p: any) => {
          if (p?.nodeType === 'part' && Array.isArray(p.items)) {
            const idx = p.items.findIndex((i: any) => i.id === updated.id)
            if (idx !== -1) {
              const newItems = p.items.slice()
              newItems[idx] = { ...newItems[idx], ...updated, __flash: true }
              // Clear flash after a tick handled by PlanPart
              setTimeout(() => {
                const A = this.parts.slice()
                const pi = A.findIndex((pp: any) => pp.id === p.id)
                if (pi !== -1) {
                  const items = (A[pi].items || []).slice()
                  const ii = items.findIndex((ii2: any) => ii2.id === updated.id)
                  if (ii !== -1) { items[ii].__flash = false }
                  A[pi] = { ...A[pi], items }
                  this.parts = A
                }
              }, 600)
              return { ...p, items: newItems }
            }
          }
          return p
        })
        this.parts = nextParts
      },
      addPart(part: any) {
        const id = Date.now().toString()
        this.parts.push({ ...part, id, nodeType: 'part', __flash: true })
        this.createPlanPartOpen = false
        setTimeout(() => {
          const next = this.parts.slice()
          const i = next.findIndex((x: any) => x.id === id)
          if (i !== -1) next[i].__flash = false
          this.parts = next
        }, 600)
      },
      addEmptyPart() {
        const id = Date.now().toString()
        this.parts.push({ id, title: this.$t('events.new_part'), color: this.colors[0], nodeType: 'part', __flash: true })
        setTimeout(() => {
          const next = this.parts.slice()
          const i = next.findIndex((x: any) => x.id === id)
          if (i !== -1) next[i].__flash = false
          this.parts = next
        }, 600)
      },
      handlePartRemove(index: number) {
        this.parts.splice(index, 1)
      },
      addText(text: string) {
        const id = Date.now().toString()
        this.parts.push({ id, text, type: 'text', nodeType: 'item', __flash: true })
        this.createTextOpen = false
        setTimeout(() => {
          const next = this.parts.slice()
          const i = next.findIndex((x: any) => x.id === id)
          if (i !== -1) next[i].__flash = false
          this.parts = next
        }, 600)
      }
    }
  }
</script>

<style scoped>
.parts-draggable {
  width: 100%;
}
.drag-ghost { opacity: 0.6; }
.drag-chosen { box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
.drag-dragging { cursor: grabbing; }
</style>
