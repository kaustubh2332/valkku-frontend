<template>
  <div>
    <div class="text-h4 my-4">
      {{ $t('userManagement.title') }}
    </div>
    <AppToolbar inline>
      <ChooseTeamBtn
        :block="$vuetify.display.mobile"
        @change="onTeamChange"
      />
      <template #append>
        <v-btn
          v-tooltip:bottom="!$vuetify.display.mobile ? $t('userManagement.addUser') : null"
          color="primary"
          fab
          small
          @click="inviteUserDialog = true"
        >
          <v-icon :class="{ 'mr-2': !$vuetify.display.mobile }">mdi-plus</v-icon>
          {{ !$vuetify.display.mobile ? $t('userManagement.addUser') : null }}
        </v-btn>
      </template>
    </AppToolbar>

    <!-- Tabs -->
    <div class="mt-6">
      <v-tabs
        v-model="activeTab"
        align-tabs="start"
        color="primary"
      >
        <v-tab :value="0">
          {{ $t('userManagement.teamMembers') }}
          <v-chip
            class="ml-2"
            color="primary"
            size="x-small"
          >
            {{ teamUsers.length }}
          </v-chip>
        </v-tab>
        <v-tab :value="1">
          {{ $t('userManagement.pendingInvites') }}
          <v-chip
            class="ml-2"
            color="orange"
            size="x-small"
          >
            {{ teamInvites.length }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- Team Members Tab -->
        <v-window-item :value="0">
          <!-- Loading Skeleton for Team Members -->
          <LoadingWrapper
            v-if="isLoadingTeamUsers"
            class="mt-4"
          >
            <v-card
              v-for="n in 5"
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

          <!-- Team Members Content -->
          <div v-else-if="teamUsers.length > 0" class="mt-4">
            <UserCard
              v-for="user in teamUsers"
              :key="user.id"
              :user="user"
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
                  mdi-account-group
                </v-icon>
                <div class="text-h6 text-medium-emphasis mb-2">
                  {{ $t('userManagement.noUsers') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ $t('userManagement.noUsersDescription') }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

        <!-- Pending Invites Tab -->
        <v-window-item :value="1">
          <!-- Loading Skeleton for Pending Invites -->
          <LoadingWrapper
            v-if="isLoadingTeamInvites"
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

          <!-- Pending Invites Content -->
          <div v-else-if="teamInvites.length > 0" class="mt-4">
            <UserCard
              v-for="invite in teamInvites"
              :key="invite.id"
              :is-invite="true"
              :user="invite"
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
                  mdi-account-clock
                </v-icon>
                <div class="text-h6 text-medium-emphasis mb-2">
                  {{ $t('userManagement.noInvites') }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ $t('userManagement.noInvitesDescription') }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>
      </v-window>
    </div>
  </div>

  <Dialog
    v-model="inviteUserDialog"
  >
    <InviteUser />
  </Dialog>
</template>

<script lang="ts">
  import UserCard from '@/components/users/UserCard.vue'
  import { useTeamStore } from '@/stores/team'

  export default {
    name: 'UserManagement',
    components: {
      UserCard
    },
    data() {
      return {
        teamStore: useTeamStore(),
        inviteUserDialog: false,
        activeTab: 0
      }
    },
    computed: {
      teamUsers() {
        return this.sortUsersByRole(this.teamStore.teamUsers)
      },
      isLoadingTeamUsers() {
        return this.teamStore.loadingTeamUsers
      },
      teamInvites() {
        return this.sortUsersByRole(this.teamStore.teamInvites)
      },
      isLoadingTeamInvites() {
        return this.teamStore.loadingTeamInvites
      }
    },
    created() {
      this.teamStore.fetchTeamUsers()
      this.teamStore.fetchTeamInvites()
    },
    methods: {
      onTeamChange() {
        this.teamStore.fetchTeamUsers()
        this.teamStore.fetchTeamInvites()
      },
      sortUsersByRole(users) {
        const roleOrder = ['owner', 'admin', 'athlete', 'guardian']

        return [...users].sort((a, b) => {
          const aIndex = roleOrder.indexOf(a.role)
          const bIndex = roleOrder.indexOf(b.role)

          // If role not found in order, put it at the end
          const aOrder = aIndex === -1 ? roleOrder.length : aIndex
          const bOrder = bIndex === -1 ? roleOrder.length : bIndex

          return aOrder - bOrder
        })
      }
    }
  }
</script>
