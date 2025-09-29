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
          @add="onPlanPartTypeAdded"
          @close="createPlanPartModal = false"
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
      async onPlanPartTypeAdded(planPartType) {
        this.saving = true
        try {
          // Create the plan part via backend API
          const response = await api.post('/event/plan-part-type', {
            type: planPartType.type,
            color: planPartType.color,
            scope: 'global'
          })

          if (response.data.success) {
            this.$notificationStore.success(this.$t('admin.planPartCreated'))
            this.createPlanPartModal = false
            await this.fetchPlanPartTypes() // Refresh the list
          } else {
            this.$notificationStore.error(response.data.message || this.$t('admin.planPartError'))
          }
        } catch (error) {
          console.error('Error creating plan part:', error)
          this.$notificationStore.handleBackendError(error)
        } finally {
          this.saving = false
        }
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
