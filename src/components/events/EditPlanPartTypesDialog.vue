<template>
  <BottomSheetModal
    :model-value="modelValue"
    :title="$t('events.edit_types')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="pa-6">
      <v-tabs
        v-if="userStore.isStaff"
        v-model="activeTab"
        class="mb-4"
      >
        <v-tab value="personal">
          <v-icon class="mr-2">mdi-account</v-icon>
          <span>
            {{ $t('events.personal_types_short') }}
          </span>
        </v-tab>
        <v-tab value="team">
          <v-icon class="mr-2">mdi-account-group</v-icon>
          <span>
            {{ $t('events.team_types_short') }}
          </span>
        </v-tab>
      </v-tabs>

      <!-- Personal Types -->
      <div v-if="activeTab === 'personal' || !userStore.isStaff">
        <PlanPartsTable
          :admin="false"
          :dense="true"
          :items="personalTypes"
          :loading="loadingPersonalTypes"
          scope="user"
          @refresh="fetchPersonalTypes(true)"
          @update-item="updatePersonalType"
          @update:items="personalTypes = $event"
        />
      </div>

      <!-- Team Types (only for staff) -->
      <div v-if="activeTab === 'team' && userStore.isStaff">
        <PlanPartsTable
          :admin="false"
          :dense="true"
          :items="teamTypes"
          :loading="loadingTeamTypes"
          scope="team"
          @refresh="fetchTeamTypes(true)"
          @update-item="updateTeamType"
          @update:items="teamTypes = $event"
        />
      </div>
    </div>
  </BottomSheetModal>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'EditPlanPartTypesDialog',
    props: {
      modelValue: {
        type: Boolean,
        required: true
      },
      dense: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue'],
    setup() {
      const userStore = useUserStore()
      const notificationStore = useNotificationStore()
      return { userStore, notificationStore }
    },
    data() {
      return {
        activeTab: 'personal',
        personalTypes: [],
        teamTypes: [],
        loadingPersonalTypes: false,
        loadingTeamTypes: false
      }
    },
    watch: {
      modelValue: {
        immediate: true,
        handler(newVal) {
          if (newVal) {
            this.fetchPersonalTypes()
            if (this.userStore.isStaff) {
              this.fetchTeamTypes()
            }
          }
        }
      },
      activeTab(newTab) {
        if (newTab === 'team' && this.userStore.isStaff && this.teamTypes.length === 0) {
          this.fetchTeamTypes()
        }
      }
    },
    methods: {
      async fetchPersonalTypes(silent = false) {
        if (!silent) {
          this.loadingPersonalTypes = true
        }
        try {
          const response = await api.get('/plan/plan-part-type/me')
          this.personalTypes = response.data.data
        } catch (error) {
          console.error('Error fetching personal plan part types:', error)
          this.notificationStore.handleBackendError(error)
        } finally {
          if (!silent) {
            this.loadingPersonalTypes = false
          }
        }
      },
      async fetchTeamTypes(silent = false) {
        if (!silent) {
          this.loadingTeamTypes = true
        }
        try {
          const response = await api.get(`/plan/plan-part-type/team/${this.userStore.currentTeamId}`)
          this.teamTypes = response.data.data
        } catch (error) {
          console.error('Error fetching team plan part types:', error)
          this.notificationStore.handleBackendError(error)
        } finally {
          if (!silent) {
            this.loadingTeamTypes = false
          }
        }
      },
      updatePersonalType(updatedItem) {
        const itemIndex = this.personalTypes.findIndex(item => item.id === updatedItem.id)
        if (itemIndex !== -1) {
          this.personalTypes[itemIndex] = { ...this.personalTypes[itemIndex], ...updatedItem }
        }
      },
      updateTeamType(updatedItem) {
        const itemIndex = this.teamTypes.findIndex(item => item.id === updatedItem.id)
        if (itemIndex !== -1) {
          this.teamTypes[itemIndex] = { ...this.teamTypes[itemIndex], ...updatedItem }
        }
      }
    }
  }
</script>
