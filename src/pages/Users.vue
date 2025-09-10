<template>
  <div>
    <div class="text-h4 my-4">
      {{ $t('userManagement.title') }}
    </div>
    <ChooseTeamBtn
      @change="teamStore.fetchTeamUsers"
    />

    {{ teamStore.teamUsers }}

    <!-- Loading Skeleton -->
    <div v-if="isLoadingTeamUsers" class="mt-6">
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
    </div>

    <!-- Actual Content -->
    <div v-else-if="teamUsers.length > 0" class="mt-6">
      <v-card
        v-for="user in teamUsers"
        :key="user.id"
        class="mb-4"
        variant="outlined"
      >
        <v-card-text class="d-flex align-center">
          <v-avatar
            class="mr-4"
            color="primary"
          >
            <span class="text-white">{{ user.firstName?.charAt(0)?.toUpperCase() + user.lastName?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-h6">{{ user.firstName + ' ' + user.lastName || 'Unknown User' }}</div>
            <div class="text-caption text-medium-emphasis">{{ user.email || 'No email' }}</div>
          </div>
          <v-chip
            :color="user.role === 'admin' ? 'primary' : 'default'"
            size="small"
          >
            {{ user.role || 'member' }}
          </v-chip>
        </v-card-text>
      </v-card>
    </div>

    <!-- Empty State -->
    <div v-else class="mt-6">
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
  </div>
</template>

<script lang="ts">
  import { useTeamStore } from '@/stores/team'

  export default {
    name: 'UserManagement',
    data() {
      return {
        teamStore: useTeamStore()
      }
    },
    computed: {
      teamUsers() {
        return this.teamStore.teamUsers
      },
      isLoadingTeamUsers() {
        return this.teamStore.loadingTeamUsers
      }
    },
    created() {
      this.teamStore.fetchTeamUsers()
    }
  }
</script>
