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

    <v-data-table
      class="mb-4"
      density="comfortable"
      :headers="headers"
      item-key="id"
      :items="filteredItems"
      :items-per-page="50"
      :loading="loading"
    >
      <template #loading>
        <div class="pa-4 text-center">
          <v-progress-circular indeterminate />
        </div>
      </template>

      <template #no-data>
        <div class="pa-8 text-center">
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
      </template>

      <template #item.position="{ index }">
        <div class="d-flex align-center">
          <v-btn
            :disabled="index === 0"
            icon="mdi-arrow-up"
            size="small"
            variant="text"
            @click="moveUpByIndex(index)"
          />
          <v-btn
            :disabled="index === filteredItems.length - 1"
            icon="mdi-arrow-down"
            size="small"
            variant="text"
            @click="moveDownByIndex(index)"
          />
        </div>
      </template>

      <template #item.title="{ item }">
        <div v-if="admin" class="d-flex flex-column">
          <div class="d-flex align-center">
            <span class="mr-2 text-caption">EN:</span>
            <span>{{ (item as any).titleObject?.en || 'N/A' }}</span>
          </div>
          <div class="d-flex align-center">
            <span class="mr-2 text-caption">FI:</span>
            <span>{{ (item as any).titleObject?.fi || 'N/A' }}</span>
          </div>
        </div>
        <div v-else>
          {{ getLocalizedTitle((item as any).titleObject || {}) }}
        </div>
      </template>

      <template #item.color="{ item }">
        <v-avatar :color="(item as any).color" size="24" />
      </template>

      <template #item.actions="{ item }">
        <v-btn
          v-tooltip:top="{ text: $t('common.edit'), zIndex: dropdownZIndex }"
          icon="mdi-pencil"
          size="small"
          variant="text"
          @click="editType(item as any)"
        />
        <v-btn
          v-tooltip:top="{ text: $t('common.archive'), zIndex: dropdownZIndex }"
          :color="(item as any).archived ? 'success' : 'warning'"
          :icon="(item as any).archived ? 'mdi-archive-arrow-up' : 'mdi-archive'"
          size="small"
          variant="text"
          @click="toggleArchive(item as any)"
        />
      </template>
    </v-data-table>

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
  import { useZIndex } from '@/composables/useZIndex'
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'PlanPartsTable',
    components: {},
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
      headers() {
        return [
          { title: '', key: 'position', sortable: false, width: 96 },
          { title: this.$t('admin.typeName') as any, key: 'title' },
          { title: this.$t('admin.color') as any, key: 'color', sortable: false, width: 100 },
          { title: this.$t('common.actions') as any, key: 'actions', sortable: false, width: 140 }
        ]
      },
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
      moveUpByIndex(filteredIndex) {
        if (filteredIndex <= 0) return
        const filtered = this.filteredItems
        const currentItem = filtered[filteredIndex]
        const previousItem = filtered[filteredIndex - 1]
        const list = [...this.items]
        const i = list.findIndex(it => it.id === currentItem.id)
        const j = list.findIndex(it => it.id === previousItem.id)
        if (i === -1 || j === -1) return
        const tmp = list[i]
        list[i] = list[j]
        list[j] = tmp
        this.$emit('update:items', list)
        this.updatePositions()
      },
      moveDownByIndex(filteredIndex) {
        const filtered = this.filteredItems
        if (filteredIndex >= filtered.length - 1) return
        const currentItem = filtered[filteredIndex]
        const nextItem = filtered[filteredIndex + 1]
        const list = [...this.items]
        const i = list.findIndex(it => it.id === currentItem.id)
        const j = list.findIndex(it => it.id === nextItem.id)
        if (i === -1 || j === -1) return
        const tmp = list[i]
        list[i] = list[j]
        list[j] = tmp
        this.$emit('update:items', list)
        this.updatePositions()
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
      onItemsUpdate() {},
      onDragEnd() {}
    }
  }
</script>
