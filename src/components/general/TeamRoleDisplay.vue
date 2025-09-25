<template>
  <!-- Unrowed layout (inline) -->
  <div v-if="!rowed" class="d-flex align-center flex-grow-1">
    <v-icon
      class="text-medium-emphasis mr-2"
      size="16"
    >mdi-account-group</v-icon>
    <div class="d-flex align-center flex-row ga-2 flex-grow-1 justify-space-between">
      <div
        class="d-flex align-center text-caption text-medium-emphasis font-weight-medium"
      >
        <span class="text-truncate" style="max-width: 140px;">{{ displayTeamName }}</span>
      </div>
      <div class="d-flex align-center">
        <RoleChip
          :always-show-text="true"
          class="pl-0"
          :icon="true"
          :replace-text="replaceText"
          :role="displayRole"
          style="transform: scale(0.9);"
          text
        />
      </div>
    </div>
  </div>

  <!-- Rowed layout (stacked) -->
  <div v-else class="d-flex align-center w-100" style="margin: 0; padding: 0;">
    <v-icon
      class="text-medium-emphasis"
      size="16"
      style="margin: 0 8px 0 0;"
    >mdi-account-group</v-icon>
    <div class="d-flex flex-column align-start flex-grow-1" style="margin: 0; padding: 0;">
      <div
        class="d-flex align-center text-caption text-medium-emphasis font-weight-medium"
        style="margin: 0; padding: 0; height: 20px; width: 150px;"
      >
        <span class="ml-1 text-truncate d-flex align-center justify-start" style="font-size: 1rem; max-width: 170px;">{{ displayTeamName }}</span>
      </div>
      <div class="d-flex align-center justify-start" style="margin: 0; padding: 0; height: 12px;">
        <RoleChip
          :always-show-text="true"
          class="pl-0"
          :icon="true"
          :replace-text="replaceText"
          :role="displayRole"
          style="transform: scale(0.9);"
          text
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { useTeamStore } from '@/stores/team'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'TeamRoleDisplay',
    props: {
      teamName: {
        type: String,
        default: null
      },
      roleName: {
        type: String,
        default: null
      },
      guardianOf: {
        type: String,
        default: null
      },
      guardianOfEmail: {
        type: String,
        default: null
      },
      guardianOfFullName: {
        type: String,
        default: null
      },
      text: {
        type: Boolean,
        default: false
      },
      rowed: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        userStore: useUserStore(),
        teamStore: useTeamStore()
      }
    },
    computed: {
      replaceText() {
        const name = this.guardianOfFullName ? this.guardianOfFullName.split(' ')[0] : null;
        return this.roleName === 'guardian' ? (name || this.guardianOfEmail || this.$t('roles.guardian')) : null
      },
      displayTeamName() {
        return this.teamName || this.userStore.currentTeam?.teamName || ''
      },
      displayRole() {
        return this.roleName || this.userStore.currentRole?.role || ''
      }
    }
  }
</script>
