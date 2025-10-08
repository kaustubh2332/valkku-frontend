<template>
  <div class="text-h4 my-4">
    {{ $t('admin.title') }}
  </div>
  <div class="admin-page">
    <v-container>
      <v-row>
        <v-col cols="12">
          <PlanPartsTable
            :items="planPartTypes"
            :loading="loading"
            @refresh="fetchPlanPartTypes"
            @update-item="updatePlanPartType"
            @update:items="planPartTypes = $event"
          />
        </v-col>
      </v-row>

      <!-- Create Plan Part Modal -->
      <BottomSheetModal
        v-model="createPlanPartModal"
        max-width="1000"
        :title="$t('events.create_event')"
      >
        <CreatePlanPartType
          :admin="true"
          @close="createPlanPartModal = false"
          @success="onPlanPartTypeAdded"
        />
      </BottomSheetModal>
    </v-container>
  </div>
</template>

<script lang="ts">
  import api from '@/utils/axios'

  export default {
    name: 'Admin',
    data() {
      return {
        createPlanPartModal: false,
        saving: false,
        loading: false,
        planPartTypes: []
      }
    },
    async mounted() {
      await this.fetchPlanPartTypes()
    },
    methods: {
      async fetchPlanPartTypes() {
        this.loading = true
        try {
          const response = await api.get('/event/plan-part-type/global')
          this.planPartTypes = response.data.data
        } catch (error) {
          console.error('Error fetching plan part types:', error)
          this.$notificationStore.error(this.$t('admin.fetchError'))
        } finally {
          this.loading = false
        }
      },
      updatePlanPartType(updatedItem) {
        // Optimistically update the item in the local array
        const itemIndex = this.planPartTypes.findIndex(item => item.id === updatedItem.id)
        if (itemIndex !== -1) {
          this.planPartTypes[itemIndex] = { ...this.planPartTypes[itemIndex], ...updatedItem }
        }
      },
      async onPlanPartTypeAdded() {
        // Refresh the list after successful creation
        await this.fetchPlanPartTypes()
      }
    }
  }
</script>

<style scoped>
.admin-page {
  padding: 16px;
  padding-top: 0;
}
</style>
