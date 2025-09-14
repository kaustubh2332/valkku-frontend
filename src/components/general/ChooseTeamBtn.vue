<template>
  <v-menu
    :style="{ maxWidth: 'min(600px, 90vw)' }"
  >
    <template #activator="{ props }">
      <v-btn
        v-tooltip:right="isMobile ? null : $t('chooseTeam.selectTeam')"
        v-bind="props"
        :block="block"
        :disabled="!hasTeams"
      >
        <v-icon start>mdi-account-group</v-icon>
        {{ truncatedCurrentTeamName || $t('chooseTeam.selectTeam') }}
        <v-icon end>mdi-chevron-down</v-icon>
      </v-btn>
    </template>

    <v-list
      class="team-menu-list"
      :style="{ maxWidth: 'min(600px, 90vw)' }"
    >
      <v-list-item
        v-for="team in teams"
        :key="team.id"
        :active="team.id === currentTeamId"
        :value="team.id"
        @click="selectTeam(team)"
      >
        <div class="d-flex align-center justify-space-between">
          {{ truncateTeamName(team.teamName) }}
          <RoleChip
            icon
            :role="team.role"
          />
        </div>
      </v-list-item>

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
</template>

<script lang="ts">
  import CreateTeam from '@/pages/CreateTeam.vue'
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import { roleToColor } from '@/utils/mappings'

  export default {
    name: 'ChooseTeamBtn',
    components: {
      CreateTeam
    },
    props: {
      main: {
        type: Boolean,
        default: false
      },
      block: {
        type: Boolean,
        default: false
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
      currentTeamId() {
        return this.userStore.currentTeamId
      },
      currentTeamName() {
        if (!this.currentTeamId || this.teams.length === 0) return null
        const currentTeam = this.teams.find(team => team.teamId === this.currentTeamId)
        return currentTeam?.teamName || null
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
      async selectTeam(team) {
        if (team.id === this.currentTeamId) return

        try {
          // Update user store with new current team
          this.userStore.setCurrentTeam(team.teamId)
          if(this.main) {
            this.info(`${this.$t('chooseTeam.success')}: ${team.teamName}`)
          }

          this.$nextTick(() => {
            this.$emit('change', team)
            if(this.main) {
              this.$router.push({
                path: '/',
                query: {}
              })
            }
          })
        } catch (error) {
          console.error('Error switching team:', error)
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
  max-width: min(600px, 90vw) !important;
}
</style>
