<template>
  <v-card
    class="user-card mb-4 mx-1"
    :class="{ 'user-card--invite': isInvite }"
    elevation="3"
    hover
  >
    <v-card-text class="d-flex align-center pa-2">
      <div class="user-avatar-container mr-2">
        <v-avatar
          class="user-avatar"
          :color="avatarColor"
          size="40"
        >
          <v-icon
            v-if="isInvite"
            color="white"
            size="20"
          >
            mdi-account-clock
          </v-icon>
          <span
            v-else
            class="text-white text-body-2 font-weight-bold"
          >
            {{ userInitials }}
          </span>
        </v-avatar>
        <div
          v-if="!isInvite"
          class="user-status-indicator"
          :class="`user-status-indicator--${user.role}`"
        />
      </div>

      <div class="flex-grow-1 user-info">
        <div class="text-h6 font-weight-medium mb-0 user-name">
          {{ fullName }}
        </div>
        <div class="text-caption text-medium-emphasis user-email">
          {{ email }}
        </div>
      </div>

      <div class="user-actions">
        <RoleChip :role="user.role" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
  import RoleChip from '@/components/general/RoleChip.vue'

  export default {
    name: 'UserCard',
    components: {
      RoleChip
    },
    props: {
      user: {
        type: Object,
        required: true
      },
      isInvite: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      fullName() {
        return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || 'Unknown User'
      },
      email() {
        return this.user.email || 'No email'
      },
      userInitials() {
        const firstName = this.user.firstName?.charAt(0)?.toUpperCase() || ''
        const lastName = this.user.lastName?.charAt(0)?.toUpperCase() || ''
        return firstName + lastName || 'U'
      },
      avatarColor() {
        return this.isInvite ? 'orange' : 'primary'
      }
    }
  }
</script>

<style scoped>
.user-card {
  border-radius: 12px !important;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  min-height: 48px;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #01B0D8 0%, #1976D2 50%, #01B0D8 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card--invite::before {
  background: linear-gradient(90deg, #FF9800 0%, #F57C00 50%, #FF9800 100%);
}

.user-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(1, 176, 216, 0.2);
}

.user-card--invite:hover {
  border-color: rgba(255, 152, 0, 0.2);
}

.user-card:hover::before {
  opacity: 0.6;
}

.user-avatar-container {
  position: relative;
}

.user-avatar {
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-card:hover .user-avatar {
  transform: scale(1.02);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.user-status-indicator {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
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
  transition: all 0.2s ease;
}

.user-name {
  color: #1976D2;
  transition: all 0.2s ease;
}

.user-card--invite .user-name {
  color: #FF9800;
}

.user-card:hover .user-name {
  transform: translateX(2px);
}

.user-email {
  transition: all 0.2s ease;
}

.user-card:hover .user-email {
  transform: translateX(2px);
}

.user-meta {
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.user-card:hover .user-meta {
  transform: translateX(2px);
}


/* Mobile responsiveness */
@media (max-width: 600px) {
  .user-card {
    margin: 0 2px 6px 2px;
    min-height: 40px;
  }

  .user-avatar {
    width: 28px !important;
    height: 28px !important;
  }

  .user-name {
    font-size: 0.9rem !important;
  }

  .user-email {
    font-size: 0.75rem !important;
  }


  .user-status-indicator {
    width: 8px;
    height: 8px;
    border-width: 1px;
  }
}

/* Light theme - ensure proper light background */
.user-card {
  background: rgba(255, 255, 255, 0.98) !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
}

.user-card:hover {
  background: rgba(255, 255, 255, 1) !important;
  border-color: rgba(1, 176, 216, 0.2) !important;
}

.user-card--invite:hover {
  border-color: rgba(255, 152, 0, 0.2) !important;
}
</style>
