<template>
  <div
    class="user-card"
    :class="{ 'user-card--invite': isInvitedUser }"
    @click="handleClick"
  >
    <div class="user-card-content d-flex align-center pa-3">
      <div class="user-avatar-container mr-3">
        <UserAvatar
          size="36"
          :user="user"
        />
      </div>

      <div class="flex-grow-1 user-info min-width-0">
        <div class="text-subtitle-1 font-weight-medium mb-0 user-name text-truncate">
          {{ fullName }}
          <v-chip
            v-if="isInvitedUser"
            class="ml-2"
            label
            size="x-small"
            variant="outlined"
          >{{ $t('userManagement.invited') }}</v-chip>
        </div>
        <div class="text-caption text-medium-emphasis user-email text-truncate">
          {{ email }}
        </div>
        <div
          v-if="isAthlete && guardians.length > 0"
          class="guardians-row d-flex align-center mt-1"
        >
          <v-icon
            class="mr-1 guardians-icon"
            size="14"
          >mdi-account-heart</v-icon>
          <div class="d-flex align-center guardians-avatars">
            <UserAvatar
              v-for="g in guardiansPreview"
              :key="g.id"
              class="mr-1"
              size="18"
              :user="g"
            />
            <span
              v-if="guardiansOverflowCount > 0"
              class="text-caption text-medium-emphasis ml-1"
            >+{{ guardiansOverflowCount }}</span>
          </div>
        </div>
      </div>

      <div class="user-actions">
        <div class="roles-container">
          <RoleChip
            v-for="userRole in userRoles"
            :key="userRole.role"
            class="mr-1"
            :role="userRole.role"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'UserCard',
    props: {
      user: {
        type: Object,
        required: true
      },
      teamUsers: {
        type: Array,
        default: () => []
      }
    },
    emits: ['click'],
    computed: {
      fullName() {
        return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || this.user.email
      },
      email() {
        return this.user.email || 'No email'
      },
      userRoles() {
        return this.user.roles || []
      },
      hasActiveRole() {
        return (this.user.roles || []).some(r => r.status === 'active')
      },
      isInvitedUser() {
        return !this.hasActiveRole
      },
      primaryRole() {
        return this.userRoles.length > 0 ? this.userRoles[0].role : 'athlete'
      },
      isAthlete() {
        return (this.user.roles || []).some(r => r.role === 'athlete')
      },
      guardians() {
        const userId = this.user.userId || this.user.id
        if (!userId) return []
        return (this.teamUsers || []).filter(u =>
          (u.roles || []).some(r => r.role === 'guardian' && r.guardianOf === userId)
        )
      },
      guardiansPreview() {
        return this.guardians.slice(0, 2)
      },
      guardiansOverflowCount() {
        return Math.max(0, this.guardians.length - 2)
      }
    },
    methods: {
      handleClick() {
        this.$emit('click', this.user)
      }
    }
  }
</script>

<style scoped>
.user-card {
  transition: all 0.2s ease;
  position: relative;
  min-height: 60px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.user-card:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.user-card:last-child {
  border-bottom: none;
}

.user-avatar-container {
  position: relative;
}

.user-status-indicator {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  transition: all 0.3s ease;
}

.user-status-indicator--owner {
  background: linear-gradient(135deg, #FFD700, #FFA000);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.user-status-indicator--admin {
  background: linear-gradient(135deg, #01B0D8, #1976D2);
  box-shadow: 0 0 8px rgba(1, 176, 216, 0.5);
}

.user-status-indicator--athlete {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.user-status-indicator--guardian {
  background: linear-gradient(135deg, #9C27B0, #6A1B9A);
  box-shadow: 0 0 8px rgba(156, 39, 176, 0.5);
}

.user-status-indicator--coach {
  background: linear-gradient(135deg, #FF5722, #D84315);
  box-shadow: 0 0 8px rgba(255, 87, 34, 0.5);
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  color: rgba(0, 0, 0, 0.9);
  font-weight: 500;
  margin-bottom: 2px;
}

.user-card--invite .user-name {
  color: rgba(0, 0, 0, 0.9);
}

.user-email {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
}

.user-actions {
  flex-shrink: 0;
  min-width: fit-content;
}

.roles-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.invited-chip {
  opacity: 0.9;
}



/* Mobile responsiveness */
@media (max-width: 600px) {
  .user-card {
    min-height: 50px;
  }

  .user-name {
    font-size: 0.9rem !important;
  }

  .user-email {
    font-size: 0.8rem !important;
  }

  .user-status-indicator {
    width: 8px;
    height: 8px;
    border-width: 1px;
  }

  .roles-container {
    gap: 2px;
  }
}
</style>
