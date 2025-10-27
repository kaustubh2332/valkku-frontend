<template>
  <div :class="$attrs.class">
    <v-menu
      :style="{ maxWidth: 'min(800px, 95vw)' }"
      :z-index="2100"
    >
      <template #activator="{ props }">
        <v-btn
          v-tooltip:right="isMobile ? null : $t('chooseTeam.selectTeam')"
          v-bind="props"
          :block="block"
          :color="color"
          :disabled="!hasTeams"
          rowed
          :variant="variant as any"
        >
          <TeamRoleDisplay
            v-if="currentTeamName && currentRole"
            :guardian-of="currentRole.guardianOf"
            :guardian-of-email="currentRole.guardianOfEmail"
            :guardian-of-full-name="currentRole.guardianOfFullName"
            :role-name="currentRole.role"
            rowed
            :team-name="truncatedCurrentTeamName || $t('chooseTeam.selectTeam')"
          />
          <v-icon end>mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list
        class="team-menu-list"
        :style="{ maxWidth: 'min(800px, 95vw)' }"
      >
        <template v-for="team in teams" :key="team.teamId">
          <v-list-item
            v-for="role in team.roles"
            :key="`${team.teamId}-${role.role}-${role.guardianOf}`"
            :active="team.teamId === currentTeamId && role.role === currentRoleRole && role.guardianOf === currentRoleGuardianOf"
            class="px-1"
            :value="`${team.teamId}-${role.role}-${role.guardianOf}`"
            @click="selectTeamAndRole(team, role)"
          >
            <div class="d-flex align-center justify-space-between w-100">
              <TeamRoleDisplay
                class="flex-shrink-0 ml-2 mt-0"
                :guardian-of="role.guardianOf"
                :guardian-of-email="role.guardianOfEmail"
                :guardian-of-full-name="role.guardianOfFullName"
                :role-name="role.role"
                :team-name="team.teamName"
              />
            </div>
          </v-list-item>
        </template>

        <v-list-item
          v-if="!hasTeams"
          disabled
        >
          <v-list-item-title>{{ $t('chooseTeam.noTeams') }}</v-list-item-title>
        </v-list-item>

        <v-divider v-if="hasTeams && main" />

        <v-list-item
          v-if="main"
          @click="createTeam"
        >
          <template #prepend>
            <v-icon>mdi-plus</v-icon>
          </template>
          <v-list-item-title>{{ $t('chooseTeam.createTeam') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <BottomSheetModal
      v-model="createTeamDialog"
      height="90vh"
    >
      <CreateTeam
        @close="createTeamDialog = false"
      />
    </BottomSheetModal>
  </div>
</template>

<script lang="ts">
  import CreateTeam from '@/pages/CreateTeam.vue'
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import { roleToColor } from '@/utils/mappings'

  export default {
    name: 'ChooseTeamBtn',
    components: { CreateTeam },
    props: {
      main: {
        type: Boolean,
        default: false
      },
      block: {
        type: Boolean,
        default: false
      },
      variant: {
        type: String,
        default: 'elevated'
      },
      color: {
        type: String,
        default: ''
      }
    },
    emits: ['change'],
    setup() {
      const userStore = useUserStore()
      const notificationStore = useNotificationStore()
      const info = notificationStore.info
      return { userStore, roleToColor, info }
    },
    data: () => ({
      createTeamDialog: false
    }),
    computed: {
      isMobile() {
        return this.$vuetify.display.mobile
      },
      user() {
        return this.userStore.user
      },
      teams() {
        return this.user?.teams || []
      },
      currentTeam() {
        return this.userStore.currentTeam
      },
      currentTeamId() {
        return this.userStore.currentTeamId
      },
      currentRoleRole() {
        return this.userStore.currentRole?.role
      },
      currentRoleGuardianOf() {
        return this.userStore.currentRole?.guardianOf
      },
      currentTeamName() {
        return this.currentTeam?.teamName || null
      },
      currentRole() {
        return this.userStore.currentRole
      },
      hasTeams() {
        return this.teams.length > 0
      },
      truncatedCurrentTeamName() {
        return this.currentTeamName ? this.truncateTeamNameForTitle(this.currentTeamName) : null
      }
    },
    methods: {
      truncateTeamName(name) {
        if (!name) return ''
        return name.length > 20 ? name.slice(0, 20) + '...' : name
      },
      truncateTeamNameForTitle(name) {
        if (!name) return ''
        return name.length > 17 ? name.slice(0, 17) + '...' : name
      },
      async selectTeamAndRole(team, role) {
        if (team.teamId === this.currentTeamId && role.role === this.currentRoleId) return

        try {
          // Update user store with new current team and role
          this.userStore.setCurrentTeam(team.teamId)
          this.userStore.setCurrentRole(role)
          if(this.main) {
            this.info(`${this.$t('chooseTeam.success')}: ${team.teamName} (${this.$t(`roles.${role.role}`)})`)
          }

          this.$nextTick(() => {
            this.$emit('change', { team, role })
            if(this.main) {
              this.$router.push({
                path: '/',
                query: {}
              })
            }
          })
        } catch (error) {
          console.error('Error switching team and role:', error)
          // TODO: Show error message to user
        }
      },
      createTeam() {
        this.createTeamDialog = true
      }
    }
  }
</script>

<style scoped>
.team-menu-list {
  width: 100% !important;
  max-width: min(800px, 95vw) !important;
}
</style>
