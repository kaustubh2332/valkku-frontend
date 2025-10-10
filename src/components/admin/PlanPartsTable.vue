<template>
  <v-card flat>
    <v-card-title class="d-flex align-center">
      <v-spacer />
      <v-btn
        color="primary"
        variant="tonal"
        @click="openCreateDialog"
      >
        <v-icon>mdi-plus</v-icon>
        <span v-if="!dense" class="mr-2">
          {{ $t('admin.addType') }}
        </span>
      </v-btn>
      <v-btn
        class="ml-2"
        :color="showArchived ? 'primary' : 'default'"
        variant="text"
        @click="toggleArchived"
      >
        <v-icon>{{ showArchived ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
        <span v-if="!dense" class="ml-2">
          {{ showArchived ? $t('admin.hideArchived') : $t('admin.showArchived') }}
        </span>
      </v-btn>
    </v-card-title>

    <div v-if="loading" class="pa-4 text-center">
      <v-progress-circular indeterminate />
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="empty-state">
      <v-icon color="grey-lighten-1" size="64">mdi-shape-outline</v-icon>
      <div class="text-h6 mt-4 text-grey-darken-1">
        {{ $t('admin.noTypesYet') }}
      </div>
      <div class="text-body-2 text-grey mt-2">
        {{ $t('admin.noTypesDescription') }}
      </div>
      <v-btn
        class="mt-4"
        color="primary"
        variant="tonal"
        @click="openCreateDialog"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        {{ $t('admin.createFirstType') }}
      </v-btn>
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
        handle=".drag-handle"
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
              <div v-if="admin" class="d-flex flex-column">
                <div class="d-flex align-center">
                  <span class="mr-2 text-caption">EN:</span>
                  <span>{{ element.titleObject?.en || 'N/A' }}</span>
                </div>
                <div class="d-flex align-center">
                  <span class="mr-2 text-caption">FI:</span>
                  <span>{{ element.titleObject?.fi || 'N/A' }}</span>
                </div>
              </div>
              <div v-else>
                {{ getLocalizedTitle(element.titleObject || {}) }}
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
        :admin="admin"
        :initial="editingItem"
        @close="closeDialog"
        @success="onTypeSaved"
      />
    </BottomSheetModal>
  </v-card>
</template>

<script lang="ts">
  import { useI18n } from 'vue-i18n'
  import draggable from 'vuedraggable'
  import { useZIndex } from '@/composables/useZIndex'
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
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
      },
      scope: {
        type: String,
        default: 'global',
        validator: (value: string) => ['global', 'team', 'user'].includes(value)
      },
      admin: {
        type: Boolean,
        default: false
      },
      dense: {
        type: Boolean,
        default: false
      }
    },
    emits: ['refresh', 'update:items', 'update-item'],
    setup() {
      const { locale } = useI18n()
      const notificationStore = useNotificationStore()
      const userStore = useUserStore()
      return { locale, notificationStore, userStore }
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
          const payload: any = {
            titleObject: typeData.titleObject,
            color: typeData.color,
            position: this.items.length // Add position for new items
          }

          if (this.isEditing) {
            // For editing, keep the original scope (cannot be changed)
            payload.scope = this.editingItem.scope

            // Add teamId or userId based on scope for authentication
            if (this.editingItem.scope === 'team') {
              payload.teamId = this.userStore.currentTeamId
            } else if (this.editingItem.scope === 'user') {
              payload.userId = this.userStore.user.id
            }

            // Optimistically update the item by emitting an event
            this.$emit('update-item', { id: this.editingId, ...payload })
            this.closeDialog()

            // Make API call in background and quietly refresh
            try {
              await api.put(`/plan/plan-part-type/${this.editingId}`, {
                ...payload,
                teamId: this.userStore.currentTeamId
              })
              this.notificationStore.success(this.$t('admin.typeUpdated'))
              // Quietly refresh to get the updated data from the server
              this.$emit('refresh')
            } catch (error) {
              console.error('Error updating type:', error)
              this.notificationStore.handleBackendError(error)
              // Revert optimistic update on error
              this.$emit('refresh')
            }
          } else {
            // For creating, use the selected scope
            const scope = typeData.scope || this.scope
            payload.scope = scope

            // Add teamId or userId based on scope
            if (scope === 'team') {
              payload.teamId = this.userStore.currentTeamId
            } else if (scope === 'user') {
              payload.userId = this.userStore.user.id
            }

            try {
              const response = await api.post(`/plan/plan-part-type/${this.userStore.currentTeamId}`, payload)
              const newItem = response.data.data

              // Add the newly created item to the list optimistically
              this.$emit('update:items', [...this.items, newItem])

              this.notificationStore.success(this.$t('admin.typeCreated'))
              this.closeDialog()

              // Quietly refresh to ensure sync with server
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
          const payload: any = {
            titleObject: item.titleObject,
            color: item.color,
            scope: item.scope,
            archived: !item.archived
          }

          // Add teamId or userId based on scope
          if (item.scope === 'team') {
            payload.teamId = this.userStore.currentTeamId
          } else if (item.scope === 'user') {
            payload.userId = this.userStore.user.id
          }

          await api.put(`/plan/plan-part-type/${item.id}`, {
            ...payload,
            teamId: this.userStore.currentTeamId
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

          await api.patch(`/plan/plan-part-type/positions/${this.userStore.currentTeamId}`, {
            positions,
            scope: this.scope
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
  min-height: 300px;
}
</style>
