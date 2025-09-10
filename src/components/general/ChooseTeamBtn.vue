<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-tooltip:right="isMobile ? null : $t('chooseTeam.selectTeam')"
        v-bind="props"
        :block="block"
        :disabled="!hasTeams"
        variant="outlined"
      >
        <v-icon start>mdi-account-group</v-icon>
        {{ currentTeamName || $t('chooseTeam.selectTeam') }}
        <v-icon end>mdi-chevron-down</v-icon>
      </v-btn>
    </template>

    <v-list>
      <v-list-item
        v-for="team in teams"
        :key="team.id"
        :active="team.id === currentTeamId"
        :value="team.id"
        @click="selectTeam(team)"
      >
        <v-list-item-title>{{ team.name }}</v-list-item-title>
        <v-list-item-subtitle>
          <div class="d-flex" :style="{ color: roleToColor[team.role] }">
            {{ $t('roles.' + team.role) }}
          </div>
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item
        v-if="!hasTeams"
        disabled
      >
        <v-list-item-title>{{ $t('chooseTeam.noTeams') }}</v-list-item-title>
      </v-list-item>

      <v-divider v-if="hasTeams" />

      <v-list-item
        @click="createTeam"
      >
        <template #prepend>
          <v-icon>mdi-plus</v-icon>
        </template>
        <v-list-item-title>{{ $t('chooseTeam.createTeam') }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>

  <Dialog
    v-model="createTeamDialog"
  >
    <CreateTeam @close="createTeamDialog = false" />
  </Dialog>
</template>

<script lang="ts">
  import CreateTeam from '@/pages/CreateTeam.vue'
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
      return { userStore, roleToColor }
    },
    data: () => ({
      createTeamDialog: false
    }),
    computed: {
      isMobile() {
        return this.$vuetify.display.mobile
      },
      user() {
        return this.userStore.getUser
      },
      teams() {
        return this.user?.teams || []
      },
      currentTeamId() {
        return this.user?.currentTeamId
      },
      currentTeamName() {
        if (!this.currentTeamId || this.teams.length === 0) return null
        const currentTeam = this.teams.find(team => team.id === this.currentTeamId)
        return currentTeam?.name || null
      },
      hasTeams() {
        return this.teams.length > 0
      }
    },
    methods: {
      async selectTeam(team) {
        if (team.id === this.currentTeamId) return

        try {

          // Update user store with new current team
          this.userStore.setUser({
            ...this.user,
            currentTeamId: team.id
          })

          this.$nextTick(() => {
            this.$emit('change', team)
            if(this.main) {
              // Reload current page and clear query params
              window.location.href = window.location.pathname
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
