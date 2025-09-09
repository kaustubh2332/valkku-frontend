<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-tooltip:right="$t('chooseTeam.selectTeam')"
        v-bind="props"
        block
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
      </v-list-item>

      <v-list-item
        v-if="!hasTeams"
        disabled
      >
        <v-list-item-title>{{ $t('chooseTeam.noTeams') }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'ChooseTeamBtn',
    props: {
      main: {
        type: Boolean,
        default: false
      }
    },
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    computed: {
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
          // TODO: Implement API call to switch team
          console.log('Switching to team:', team.name)

          // Update user store with new current team
          this.userStore.setUser({
            ...this.user,
            currentTeamId: team.id
          })

          if(this.main) {
            // Reload current page
            window.location.reload()
          }

        } catch (error) {
          console.error('Error switching team:', error)
          // TODO: Show error message to user
        }
      }
    }
  }
</script>
