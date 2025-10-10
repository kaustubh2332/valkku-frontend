<template>
  <div>
    <div v-if="!hasContent" class="mb-4">
      <v-card class="pa-6 d-flex align-center justify-center" variant="tonal">
        <div class="text-center">
          <v-icon class="mb-2" color="primary" size="36">mdi-clipboard-text-outline</v-icon>
          <div class="text-body-1 mb-2">{{ $t('plan.no_plan_content') }}</div>
        </div>
      </v-card>
    </div>

    <draggable
      v-model="parts"
      :animation="150"
      chosen-class="drag-chosen"
      class="parts-draggable"
      :disabled="!editing"
      drag-class="drag-dragging"
      ghost-class="drag-ghost"
      :group="topLevelGroup"
      item-key="id"
      style="width: 100%;"
      tag="div"
      @end="updatePositions"
    >
      <template #item="{ element, index }">
        <PlanPart
          v-if="element.nodeType === 'part'"
          :key="'part-' + element.id"
          v-model="element.items"
          :colors="colors"
          data-node="part"
          :editing="editing"
          :group="childrenGroup"
          :part="element"
          :rounded-tip="nextItem(index) && nextItem(index)?.nodeType !== 'part'"
          @remove="handlePartRemove(index)"
          @update-part="handlePartUpdateById($event)"
        />
        <PlanPartItem
          v-else
          :key="'item-' + element.id + '-' + (element.__flash ? 'flash' : 'noflash')"
          data-node="item"
          :editing="editing"
          :flash="!!element.__flash"
          :item="element"
          @edit="onItemEdit"
          @remove="handleTopLevelItemRemove(index)"
        />
      </template>
    </draggable>
    <div v-if="editing" class="d-flex ga-2">
      <v-btn size="small" @click="createTextOpen = true">
        <v-icon class="mr-2">mdi-plus</v-icon>
        {{ $t('events.add_text') }}
      </v-btn>
      <v-btn size="small" @click="createPlanPartOpen = true">
        <v-icon class="mr-2">mdi-plus</v-icon>
        {{ $t('events.add_plan_part') }}
      </v-btn>
    </div>
    <div v-if="editing" class="mt-4 d-flex">
      <v-btn
        size="small"
        variant="text"
        @click="cancelEdit"
      >
        <v-icon class="mr-2">mdi-close</v-icon>
        {{ $t('cancel') }}
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!hasContent || saving"
        :loading="saving"
        size="small"
        @click="savePlan(eventId)"
      >
        <v-icon class="mr-2">mdi-content-save</v-icon>
        {{ $t('events.save_plan') }}
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
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'
  import { generateId } from '@/utils/id'

  export default {
    name: 'CreatePlan',
    components: {
      draggable
    },
    props: {
      plan: {
        type: Object,
        default: null
      }
    },
    emits: ['save', 'cancel'],
    setup() {
      const eventStore = useEventStore()
      const { loadingPlanPartTypes } = eventStore
      const userStore = useUserStore()
      const notificationStore = useNotificationStore()
      return { eventStore, loadingPlanPartTypes, userStore, notificationStore }
    },
    data() {
      return {
        parts: [],
        editing: false,
        createPlanPartOpen: false,
        createTextOpen: false,
        saving: false,
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
    computed: {
      eventId() {
        return this.$route.params.eventId ? Number(this.$route.params.eventId) : null
      },
      hasContent() {
        return this.parts && this.parts.length > 0
      },
      partsWithPositions() {
        return this.parts.map((part: any, index: number) => {
          const updatedPart = { ...part, position: index }

          // If it's a part with items, update positions of items too
          if (part.nodeType === 'part' && Array.isArray(part.items)) {
            updatedPart.items = part.items.map((item: any, itemIndex: number) => ({
              ...item,
              position: itemIndex
            }))
          }

          return updatedPart
        })
      }
    },
    watch: {
      parts: {
        handler() {
          // Update all positions whenever parts array changes (items moved between levels)
          this.updateAllPositions()
        },
        deep: true
      },
      // Removed plan watcher to prevent interference with user edits
    },
    async mounted() {
      await this.eventStore.initCreatePlanData()
      // Initialize parts from plan if provided
      if (this.plan && this.plan.parts) {
        this.parts = this.transformPlanParts(this.plan.parts)
      }
    },
    methods: {
      transformPlanParts(apiParts) {
        // Transform API parts to component format
        return apiParts.map(part => {
          // Determine nodeType based on structure
          const hasItems = part.items && Array.isArray(part.items) && part.items.length > 0
          const hasType = part.type && part.type.id

          if (hasType && hasItems) {
            // This is a plan part with type and items
            return {
              ...part,
              nodeType: 'part',
              items: part.items.map(item => ({
                ...item,
                nodeType: 'item'
              }))
            }
          } else if (part.type === 'text' && part.item) {
            // This is a standalone text item
            return {
              ...part,
              nodeType: 'item'
            }
          } else {
            // Fallback - assume it's a part
            return {
              ...part,
              nodeType: 'part',
              items: part.items ? part.items.map(item => ({
                ...item,
                nodeType: 'item'
              })) : []
            }
          }
        })
      },
      savePlan(eventId: number) {
        this.saving = true

        let parts = this.partsWithPositions.filter(part => part.nodeType === 'part').map(part => ({ ...part, typeId: part.type?.id }));
        delete parts.items;

        const topLevelItems = this.parts.filter((part: any) => part.nodeType === 'item');
        const nestedItems = this.parts.filter((part: any) => part.nodeType === 'part').flatMap((part: any) => part.items.map((i: any) => ({ ...i, partId: part.id })) || []);

        const payload = {
          title: null,
          description: null,
          teamId: this.userStore.currentTeamId,
          eventId: eventId,
          parts,
          scope: 'team',
          items: [...topLevelItems, ...nestedItems]
        }

        if ((!payload.parts && payload.parts.length === 0) || (!payload.items && payload.items.length === 0)) {
          this.notificationStore.info(this.$t('plan.no_plan_content'))
          this.saving = false
          return Promise.resolve({ success: true, message: this.$t('plan.no_plan_content') })
        }

        // Save plan to POST /plan
        return api.post('/plan', payload)
          .then((response) => {
            const updatedPlan = (response && response.data && (response.data.data || response.data)) || null
            if (updatedPlan && updatedPlan.parts) {
              // Immediately reflect latest server state
              this.parts = this.transformPlanParts(updatedPlan.parts)
            }
            this.notificationStore.success(this.$t('plan.plan_saved'))
            this.editing = false
            this.$emit('save', updatedPlan)
          })
          .catch((error) => {
            this.notificationStore.handleBackendError(error)
            throw error
          })
          .finally(() => {
            this.saving = false
          })
      },
      cancelEdit() {
        this.editing = false
        this.$emit('cancel')
      },
      refreshFromPlan() {
        // Manually refresh parts from plan data
        if (this.plan && this.plan.parts) {
          this.parts = this.transformPlanParts(this.plan.parts)
        }
      },
      startEditing() {
        this.editing = true
      },
      stopEditing() {
        this.editing = false
      },
      nextItem(index: number) {
        return this.parts[index + 1] || null
      },
      handlePartUpdateById(updated: any) {
        const targetId = updated?.id
        if (!targetId) return
        const next = this.parts.slice()
        const idx = next.findIndex((p: any) => p.id === targetId)
        if (idx !== -1) {
          const beforeTypeId = next[idx]?.type?.id || next[idx]?.type
          const afterTypeId = updated?.type?.id || updated?.type
          console.log('[CreatePlan] apply type change', { id: targetId, beforeTypeId, afterTypeId })
          next[idx] = { ...next[idx], ...updated }
          this.parts = next
          this.$nextTick(() => {
            const now = (this.parts[idx] || this.parts.find((p: any) => p.id === targetId))
            const nowTypeId = now?.type?.id || now?.type
            console.log('[CreatePlan] after tick', { id: targetId, nowTypeId })
            setTimeout(() => {
              const later = (this.parts[idx] || this.parts.find((p: any) => p.id === targetId))
              const laterTypeId = later?.type?.id || later?.type
              console.log('[CreatePlan] after 150ms', { id: targetId, laterTypeId })
            }, 150)
          })
        }
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
        const id = generateId()
        const position = this.parts.length
        this.parts.push({ ...part, id, nodeType: 'part', position, __flash: true })
        this.createPlanPartOpen = false
        setTimeout(() => {
          const next = this.parts.slice()
          const i = next.findIndex((x: any) => x.id === id)
          if (i !== -1) next[i].__flash = false
          this.parts = next
        }, 600)
      },
      addEmptyPart() {
        const id = generateId()
        const position = this.parts.length
        this.parts.push({ id, title: this.$t('events.new_part'), color: this.colors[0], nodeType: 'part', position, __flash: true })
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
      handleTopLevelItemRemove(index: number) {
        this.parts.splice(index, 1)
      },
      addText(text: string) {
        const id = generateId()
        const position = this.parts.length
        this.parts.push({
          id,
          type: 'text',
          nodeType: 'item',
          position,
          item: { text },
          __flash: true
        })
        this.createTextOpen = false
        setTimeout(() => {
          const next = this.parts.slice()
          const i = next.findIndex((x: any) => x.id === id)
          if (i !== -1) next[i].__flash = false
          this.parts = next
        }, 600)
      },
      updatePositions() {
        // Update positions for all top-level items after drag
        this.updateAllPositions()
      },
      updateAllPositions() {
        // Debounce to avoid multiple rapid updates
        if (this._updateTimeout) {
          clearTimeout(this._updateTimeout)
        }

        this._updateTimeout = setTimeout(() => {
          // Update positions for all top-level items and their children
          this.parts = this.parts.map((part: any, index: number) => {
            const updatedPart = { ...part, position: index }

            // If it's a part with items, update positions of items too
            if (part.nodeType === 'part' && Array.isArray(part.items)) {
              updatedPart.items = part.items.map((item: any, itemIndex: number) => ({
                ...item,
                position: itemIndex
              }))
            }

            return updatedPart
          })
        }, 50) // Small delay to batch updates
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
