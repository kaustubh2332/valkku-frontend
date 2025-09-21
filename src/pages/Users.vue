<template>
  <div>
    <div class="text-h4 mt-4 mb-8">
      {{ $t('userManagement.title') }}
    </div>
    <AppToolbar inline>
      <!-- <ChooseTeamBtn
        variant="text"
        @change="onTeamChange"
      /> -->
      <v-tabs
        v-model="activeTab"
        align-tabs="start"
        color="primary"
      >
        <v-tab :value="0">
          {{ $t('userManagement.managers') }}
          <v-chip
            v-if="!$vuetify.display.mobile"
            class="ml-2"
            color="primary"
            size="x-small"
          >
            {{ managerUsers.length }}
          </v-chip>
        </v-tab>
        <v-tab :value="1">
          {{ $t('userManagement.athletes') }}
          <v-chip
            v-if="!$vuetify.display.mobile"
            class="ml-2"
            color="primary"
            size="x-small"
          >
            {{ athleteUsers.length }}
          </v-chip>
        </v-tab>
      </v-tabs>
      <template #append>
        <v-btn
          v-tooltip:bottom="!$vuetify.display.mobile ? $t('userManagement.addUser') : null"
          color="primary"
          fab
          small
          variant="tonal"
          @click="inviteUserDialog = true"
        >
          <v-icon :class="{ 'mr-2': !$vuetify.display.mobile }">mdi-plus</v-icon>
          {{ !$vuetify.display.mobile ? $t('userManagement.addUser') : null }}
        </v-btn>
      </template>
    </AppToolbar>

    <!-- Tabs -->
    <div class="mt-4">
      <v-window v-model="activeTab" :touch="false">
        <!-- Managers Tab -->
        <v-window-item :value="0">
          <!-- Loading Skeleton for Managers -->
          <LoadingWrapper
            v-if="isLoadingTeamUsers"
            class="mt-4"
          >
            <v-card
              v-for="n in 3"
              :key="n"
              class="mb-4"
              variant="outlined"
            >
              <v-card-text class="d-flex align-center">
                <v-skeleton-loader
                  class="mr-4"
                  type="avatar"
                />
                <div class="flex-grow-1">
                  <v-skeleton-loader
                    class="mb-2"
                    type="text"
                  />
                  <v-skeleton-loader
                    type="text"
                    width="60%"
                  />
                </div>
                <v-skeleton-loader
                  type="button"
                  width="100"
                />
              </v-card-text>
            </v-card>
          </LoadingWrapper>

          <!-- Managers Content -->
          <div v-else-if="managerUsers.length > 0" class="mt-4">
            <UserTable
              :show-guardians="false"
              :team-users="teamUsers"
              :users="managerUsers"
              @row-click="handleUserCardClick"
            />
          </div>
          <div v-else class="mt-4">
            <v-card variant="outlined">
              <v-card-text class="text-center py-8">
                <v-icon
                  class="mb-4"
                  color="grey-lighten-1"
                  size="64"
                >
                  mdi-account-supervisor
                </v-icon>
                <div class="text-h6 text-medium-emphasis mb-2">
                  {{ $t('userManagement.noManagers') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ $t('userManagement.noManagersDescription') }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

        <!-- Athletes Tab -->
        <v-window-item :value="1">
          <!-- Loading Skeleton for Athletes -->
          <LoadingWrapper
            v-if="isLoadingTeamUsers"
            class="mt-4"
          >
            <v-card
              v-for="n in 3"
              :key="n"
              class="mb-4"
              variant="outlined"
            >
              <v-card-text class="d-flex align-center">
                <v-skeleton-loader
                  class="mr-4"
                  type="avatar"
                />
                <div class="flex-grow-1">
                  <v-skeleton-loader
                    class="mb-2"
                    type="text"
                  />
                  <v-skeleton-loader
                    type="text"
                    width="60%"
                  />
                </div>
                <v-skeleton-loader
                  type="button"
                  width="100"
                />
              </v-card-text>
            </v-card>
          </LoadingWrapper>

          <!-- Athletes Content -->
          <div v-else-if="athleteUsers.length > 0" class="mt-4">
            <UserTable
              :show-guardians="true"
              :team-users="teamUsers"
              :users="athleteUsers"
              @row-click="handleUserCardClick"
            />
          </div>
          <div v-else class="mt-4">
            <v-card variant="outlined">
              <v-card-text class="text-center py-8">
                <v-icon
                  class="mb-4"
                  color="grey-lighten-1"
                  size="64"
                >
                  mdi-run
                </v-icon>
                <div class="text-h6 text-medium-emphasis mb-2">
                  {{ $t('userManagement.noAthletes') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ $t('userManagement.noAthletesDescription') }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

      </v-window>
    </div>
  </div>

  <BottomSheetModal
    v-model="inviteUserDialog"
    height="95vh"
    :title="$t('userManagement.inviteUser') + ' - ' + userStore.currentTeam.teamName"
  >
    <InviteUser :is-open="inviteUserDialog" @user-invited="handleUserInvited" />
  </BottomSheetModal>

  <BottomSheetModal
    v-model="userDetailDialog"
    height="95vh"
    :title="$t('userManagement.userDetails')"
    @update:model-value="closeUserDetail"
  >
    <UserDetailsCard
      v-if="selectedUser"
      :team-users="teamUsers"
      :user="selectedUser"
      @guardian-invited="handleGuardianInvited"
      @remove-invite="handleRemoveInvite"
      @remove-user="handleRemoveUser"
    />
  </BottomSheetModal>
</template>

<script lang="ts">
  import { useTeamStore } from '@/stores/team'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'UserManagement',
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    data() {
      return {
        teamStore: useTeamStore(),
        inviteUserDialog: false,
        userDetailDialog: false,
        userDetailDialogIsInvite: false,
        selectedUser: null,
        activeTab: 0
      }
    },
    computed: {
      teamUsers() {
        // Map roles to include status and compute invite/active state per user
        const users = (this.teamStore.teamUsers || []).map(u => {
          const roles = (u.roles || []).map(r => ({ ...r, status: r.status || 'active' }))
          const hasActive = roles.some(r => r.status === 'active')
          return {
            ...u,
            roles,
            isInvite: !hasActive
          }
        })
        return this.sortUsersByRole(users)
      },
      managerUsers() {
        // Filter users who have manager roles (owner, admin, coach)
        const managerRoles = new Set(['owner', 'admin', 'coach'])
        return this.teamUsers.filter(user =>
          user.roles.some(role => managerRoles.has(role.role))
        )
      },
      athleteUsers() {
        // Filter users who have athlete role
        return this.teamUsers.filter(user =>
          user.roles.some(role => role.role === 'athlete')
        )
      },
      isLoadingTeamUsers() {
        return this.teamStore.loadingTeamUsers
      },
      isLoadingTeamInvites() {
        return false
      }
    },
    async created() {
      await this.teamStore.fetchTeamUsers()

      // Check if we have a userId in the route and open the modal
      const userId = this.$route.params.userId
      if (userId) {
        this.openUserDetail(userId)
      }
    },
    methods: {
      guardiansFor(user) {
        const userId = user.userId || user.id
        return this.teamUsers.filter(u => (u.roles || []).some(r => r.role === 'guardian' && r.guardianOf === userId))
      },
      guardiansPreview(user) {
        return this.guardiansFor(user).slice(0, 3)
      },
      guardiansOverflowCount(user) {
        const count = this.guardiansFor(user).length
        return Math.max(0, count - 3)
      },
      isUserInvited(user) {
        return (user.roles || []).some(r => r.status !== 'active')
      },
      async onTeamChange() {
        await this.teamStore.fetchTeamUsers()
        await this.teamStore.fetchTeamInvites()

        // Check if we have a userId in the route and open the modal
        const userId = this.$route.params.userId
        if (userId) {
          this.openUserDetail(userId)
        }
      },
      openUserDetail(userId, isInvite) {
        // Find user in team users or invites
        const user = this.teamUsers.find(u => u.userId === userId || u.id === userId) ||
          this.teamInvites.find(u => u.userId === userId || u.id === userId)

        if (user) {
          this.selectedUser = user
          this.userDetailDialog = true
          this.userDetailDialogIsInvite = isInvite
        }
      },
      closeUserDetail() {
        this.userDetailDialog = false
        this.selectedUser = null
        // Navigate back to /users only if we have a userId in the route
        if (this.$route.params.userId) {
          this.$router.push('/users')
        }
      },
      handleUserCardClick(user, isInvite) {
        console.log('invite', user)
        // Just open the modal without navigation to avoid scroll issues
        this.openUserDetail(user.userId || user.id, isInvite)
      },
      handleRemoveUser(user) {
        // TODO: Implement remove user functionality
        console.log('Remove user:', user)
        this.closeUserDetail()
      },
      handleRemoveInvite(invite) {
        // TODO: Implement remove invite functionality
        console.log('Remove invite:', invite)
        this.closeUserDetail()
      },
      async handleGuardianInvited() {
        // Refresh team users to show the new guardian
        await this.teamStore.fetchTeamUsers()
      },
      async handleUserInvited() {
        await this.teamStore.fetchTeamUsers()
        this.inviteUserDialog = false
      },
      sortUsersByRole(users) {
        const roleOrder = ['owner', 'admin', 'coach', 'athlete']

        // Determine primary role for sorting: highest priority role present
        const getPrimaryRoleOrder = (user) => {
          const roles = user.roles || []
          for (const roleName of roleOrder) {
            if (roles.some(r => r.role === roleName)) {
              return roleOrder.indexOf(roleName)
            }
          }
          return roleOrder.length
        }

        return [...users].sort((a, b) => {
          const aOrder = getPrimaryRoleOrder(a)
          const bOrder = getPrimaryRoleOrder(b)
          if (aOrder !== bOrder) return aOrder - bOrder

          // Secondary sort: invited users after active within same role priority
          const aInvited = a.isInvite ? 1 : 0
          const bInvited = b.isInvite ? 1 : 0
          if (aInvited !== bInvited) return aInvited - bInvited

          // Tertiary: name
          const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase()
          const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase()
          return aName.localeCompare(bName)
        })
      }
    }
  }
</script>

<style>
  .user-table thead th {
    font-weight: 600;
    color: rgba(0,0,0,0.7);
  }
  .user-table .table-row {
    cursor: pointer;
  }
  .user-table .table-row:hover {
    background: rgba(0,0,0,0.02);
  }
</style>
