<template>
  <v-card flat>
    <v-card-title class="d-flex align-center">
      <div class="text-h6">{{ $t('library.eventPlanPartTypes') }}</div>
      <v-spacer />
      <v-btn
        color="primary"
        variant="tonal"
        @click="openCreateDialog"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        {{ $t('admin.addType') }}
      </v-btn>
      <v-btn
        class="ml-2"
        :color="showArchived ? 'primary' : 'default'"
        variant="text"
        @click="toggleArchived"
      >
        <v-icon class="mr-2">{{ showArchived ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
        {{ showArchived ? $t('admin.hideArchived') : $t('admin.showArchived') }}
      </v-btn>
    </v-card-title>

    <div v-if="loading" class="pa-4 text-center">
      <v-progress-circular indeterminate />
    </div>

    <div v-else class="custom-table">
      <!-- Table Header -->
      <div class="table-header">
        <div class="header-cell drag-column" />
        <div class="header-cell title-column">{{ $t('admin.typeName') }}</div>
        <div class="header-cell color-column">{{ $t('admin.color') }}</div>
        <div class="header-cell actions-column">{{ $t('common.actions') }}</div>
      </div>

      <!-- Draggable Table Body -->
      <draggable
        :animation="150"
        chosen-class="drag-chosen"
        class="table-body"
        drag-class="drag-dragging"
        ghost-class="drag-ghost"
        item-key="id"
        :model-value="items"
        @end="onDragEnd"
        @update:model-value="onItemsUpdate"
      >
        <template #item="{ element }">
          <div
            v-if="showArchived ? true : !element.archived"
            class="table-row"
            :class="{ 'archived': element.archived }"
          >
            <div class="table-cell drag-column justify-center">
              <v-icon class="drag-handle">mdi-drag</v-icon>
            </div>
            <div class="table-cell title-column">
              <div class="d-flex flex-column">
                <div class="d-flex align-center">
                  <span class="mr-2 text-caption">EN:</span>
                  <span>{{ element.titleObject?.en || 'N/A' }}</span>
                </div>
                <div class="d-flex align-center">
                  <span class="mr-2 text-caption">FI:</span>
                  <span>{{ element.titleObject?.fi || 'N/A' }}</span>
                </div>
              </div>
            </div>
            <div class="table-cell color-column justify-center">
              <div
                class="color-preview"
                :style="{ backgroundColor: element.color, width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)' }"
              />
            </div>
            <div class="table-cell actions-column">
              <v-btn
                v-tooltip:top="{ text: $t('common.edit'), zIndex: dropdownZIndex }"
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="editType(element)"
              />
              <v-btn
                v-tooltip:top="{ text: $t('common.archive'), zIndex: dropdownZIndex }"
                :color="element.archived ? 'success' : 'warning'"
                :icon="element.archived ? 'mdi-archive-arrow-up' : 'mdi-archive'"
                size="small"
                variant="text"
                @click="toggleArchive(element)"
              />
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <BottomSheetModal
      v-model="dialog"
      max-width="500"
      :title="isEditing ? $t('admin.editType') : $t('admin.addType')"
    >
      <CreatePlanPartType
        :admin="true"
        :initial="editingItem"
        @close="closeDialog"
        @save="onTypeSaved"
      />
    </BottomSheetModal>
  </v-card>
</template>

<script lang="ts">
  import { useI18n } from 'vue-i18n'
  import draggable from 'vuedraggable'
  import { useZIndex } from '@/composables/useZIndex'
  import { useNotificationStore } from '@/stores/notification'
  import api from '@/utils/axios'

  export default {
    name: 'PlanPartsTable',
    components: {
      draggable
    },
    props: {
      loading: {
        type: Boolean,
        default: false
      },
      items: {
        type: Array,
        default: () => []
      }
    },
    emits: ['refresh', 'update:items', 'update-item'],
    setup() {
      const { locale } = useI18n()
      const notificationStore = useNotificationStore()
      return { locale, notificationStore }
    },
    data() {
      return {
        saving: false,
        dialog: false,
        isEditing: false,
        editingId: null,
        editingItem: null,
        showArchived: false
      }
    },
    computed: {
      dropdownZIndex() {
        const { dropdownZIndex } = useZIndex()
        return dropdownZIndex.value
      },
      filteredItems() {
        if (this.showArchived) {
          return this.items
        }
        return this.items.filter(item => !item.archived)
      }
    },
    methods: {
      openCreateDialog() {
        this.isEditing = false
        this.editingId = null
        this.editingItem = null
        this.dialog = true
      },
      editType(item) {
        this.isEditing = true
        this.editingId = item.id
        this.editingItem = item
        this.dialog = true
      },
      async onTypeSaved(typeData) {
        this.saving = true
        try {
          const payload = {
            titleObject: typeData.titleObject,
            color: typeData.color,
            scope: 'global',
            position: this.items.length // Add position for new items
          }

          if (this.isEditing) {
            // Optimistically update the item by emitting an event
            this.$emit('update-item', { id: this.editingId, ...payload })
            this.closeDialog()

            // Make API call in background
            try {
              await api.put(`/event/plan-part-type/${this.editingId}`, payload)
              this.notificationStore.success(this.$t('admin.typeUpdated'))
            } catch (error) {
              console.error('Error updating type:', error)
              this.notificationStore.handleBackendError(error)
              // Revert optimistic update on error
              this.$emit('refresh')
            }
          } else {
            // For new items, show loading since we need the ID from server
            try {
              const response = await api.post('/event/plan-part-type', payload)
              this.notificationStore.success(this.$t('admin.typeCreated'))
              this.closeDialog()
              this.$emit('refresh')
            } catch (error) {
              console.error('Error creating type:', error)
              this.notificationStore.handleBackendError(error)
            }
          }
        } finally {
          this.saving = false
        }
      },
      async toggleArchive(item) {
        // Optimistically update the item by emitting an event
        this.$emit('update-item', { id: item.id, archived: !item.archived })

        this.notificationStore.success(
          item.archived
            ? this.$t('admin.typeUnarchived')
            : this.$t('admin.typeArchived')
        )

        // Make API call in background
        try {
          await api.put(`/event/plan-part-type/${item.id}`, {
            titleObject: item.titleObject,
            color: item.color,
            scope: 'global',
            archived: !item.archived
          })
        } catch (error) {
          console.error('Error toggling archive:', error)
          this.notificationStore.handleBackendError(error)
          // Revert optimistic update on error
          this.$emit('refresh')
        }
      },
      toggleArchived() {
        this.showArchived = !this.showArchived
      },
      closeDialog() {
        this.dialog = false
      },
      getLocalizedTitle(titleObject) {
        // Try current locale first, then English, then Finnish, then any available value
        return titleObject[this.locale] || titleObject.en || titleObject.fi || Object.values(titleObject)[0] || ''
      },
      moveUp(item) {
        const currentIndex = this.eventPlanPartTypes.indexOf(item)
        if (currentIndex > 0) {
          // Swap with the item above
          const newItems = [...this.eventPlanPartTypes]
          const temp = newItems[currentIndex]
          newItems[currentIndex] = newItems[currentIndex - 1]
          newItems[currentIndex - 1] = temp
          this.eventPlanPartTypes = newItems

          // Update positions in backend
          this.updatePositions()
        }
      },
      moveDown(item) {
        const currentIndex = this.eventPlanPartTypes.indexOf(item)
        if (currentIndex < this.eventPlanPartTypes.length - 1) {
          // Swap with the item below
          const newItems = [...this.eventPlanPartTypes]
          const temp = newItems[currentIndex]
          newItems[currentIndex] = newItems[currentIndex + 1]
          newItems[currentIndex + 1] = temp
          this.eventPlanPartTypes = newItems

          // Update positions in backend
          this.updatePositions()
        }
      },
      async updatePositions() {
        try {
          const positions = this.items.map((item, index) => ({
            id: item.id,
            pos: index
          }))

          await api.patch('/event/plan-part-type/positions', {
            positions,
            scope: 'global'
          })

          // No success notification for position updates - they happen silently
        } catch (error) {
          console.error('Error updating positions:', error)
          this.notificationStore.handleBackendError(error)
        }
      },
      onItemsUpdate(newItems) {
        // Update the items array when dragging
        this.$emit('update:items', [...newItems])
      },
      onDragEnd() {
        // Optimistically update positions without showing loading
        this.updatePositions()
      }
    }
  }
</script>

<style scoped>
.custom-table {
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}

.table-header {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid rgba(0,0,0,0.12);
  font-weight: 500;
}

.header-cell {
  padding: 12px 16px;
  border-right: 1px solid rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
}

.header-cell:last-child {
  border-right: none;
}

.drag-column {
  width: 60px;
  text-align: center;
  justify-content: center;
}

.title-column {
  flex: 1;
  min-width: 200px;
}

.color-column {
  width: 100px;
  text-align: center;
  justify-content: center;
}

.actions-column {
  width: 140px;
  text-align: center;
  justify-content: center;
}

.table-body {
  background-color: white;
}

.table-row {
  display: flex;
  border-bottom: 1px solid rgba(0,0,0,0.12);
  transition: background-color 0.2s;
  cursor: move;
}

.table-row:hover {
  background-color: #fafafa;
}

.table-row.archived {
  opacity: 0.6;
  background-color: #f9f9f9;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 12px 16px;
  border-right: 1px solid rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
}

.table-cell:last-child {
  border-right: none;
}

.drag-handle {
  cursor: grab;
  color: #666;
}

.drag-handle:active {
  cursor: grabbing;
}

.color-preview {
  flex-shrink: 0;
}

.drag-chosen {
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.drag-dragging {
  cursor: grabbing;
  opacity: 0.8;
}

.drag-ghost {
  opacity: 0.3;
}
</style>
