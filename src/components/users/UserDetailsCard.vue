<template>
  <div class="user-details-container">
    <!-- Header Section -->
    <div class="user-header">
      <UserAvatar
        size="100"
        :user="user"
      />

      <div class="user-info">
        <h1 class="user-name text-truncate">
          {{ user.fullName || user.email }}
        </h1>
        <div class="user-email text-truncate">
          {{ user.email }}
        </div>
        <v-chip
          class="user-status-chip"
          :color="isInvitedUser ? 'orange' : 'green'"
          size="small"
          variant="tonal"
        >
          <v-icon
            class="mr-1"
            :icon="isInvitedUser ? 'mdi-account-clock' : 'mdi-check-circle'"
            size="small"
          />
          {{ isInvitedUser ? $t('userManagement.invited') : $t('userManagement.active') }}
        </v-chip>
      </div>
    </div>

    <!-- Details Section -->
    <div class="user-details-section">
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">
            <v-icon
              class="mr-2"
              icon="mdi-account-badge"
              size="small"
            />
            {{ $t('userManagement.roles') }}
          </div>
          <div class="roles-container">
            <RoleChip
              v-for="userRole in userRoles"
              :key="userRole.role"
              always-show-text
              class="mr-1"
              :role="userRole.role"
            />
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-label">
            <v-icon
              class="mr-2"
              :icon="isInvitedUser ? 'mdi-email' : 'mdi-calendar-check'"
              size="small"
            />
            {{ isInvitedUser ? $t('userManagement.invitedOn') : $t('userManagement.joinedOn') }}
          </div>
          <div class="detail-value text-truncate">
            {{ formatDate(user.createdAt) }}
          </div>
        </div>

        <div
          v-if="isInvitedUser && user.inviteExpiresAt"
          class="detail-item"
        >
          <div class="detail-label">
            <v-icon
              class="mr-2"
              icon="mdi-clock-alert"
              size="small"
            />
            {{ $t('userManagement.inviteExpires') }}
          </div>
          <div class="detail-value text-truncate">
            {{ formatDate(user.inviteExpiresAt) }}
          </div>
        </div>

        <div
          v-if="userGuardians.length > 0"
          class="detail-item"
        >
          <div class="detail-label">
            <v-icon
              class="mr-2"
              icon="mdi-account-heart"
              size="small"
            />
            {{ $t('userManagement.guardians') }}
          </div>
          <div class="guardians-container">
            <div
              v-for="guardian in userGuardians"
              :key="guardian.id"
              class="guardian-item guardian-item--clickable"
              @click="openGuardianDetail(guardian)"
            >
              <UserAvatar
                size="24"
                :user="guardian"
              />
              <span class="guardian-name">
                {{ guardian.fullName || guardian.email }}
              </span>
              <v-icon
                class="guardian-arrow"
                icon="mdi-chevron-right"
                size="16"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="user-actions-section">
      <v-btn
        v-if="user.roles.some(r => r.role === 'athlete')"
        size="small"
        variant="tonal"
        @click="openGuardianInviteModal"
      >
        <v-icon class="mr-2">mdi-account-plus</v-icon>
        {{ $t('userManagement.addGuardian') }}
      </v-btn>
      <v-btn
        color="error"
        size="small"
        variant="tonal"
        @click="handleRemoveAction"
      >
        <v-icon class="mr-2">
          {{ isInvitedUser ? 'mdi-email-remove' : 'mdi-account-remove' }}
        </v-icon>
        {{ isInvitedUser ? $t('userManagement.removeInvite') : $t('userManagement.removeUser') }}
      </v-btn>
    </div>
  </div>

  <!-- Guardian Invitation Modal -->
  <BottomSheetModal
    v-model="guardianInviteModal"
    height="95vh"
    :title="$t('userManagement.addGuardian') + ' - ' + (user.fullName || user.email)"
  >
    <InviteUser
      :athlete-user="user"
      guardian
      :is-guardian="true"
      :is-open="guardianInviteModal"
      @user-invited="handleGuardianInvited"
    />
  </BottomSheetModal>

  <!-- Guardian Detail Modal -->
  <BottomSheetModal
    v-model="guardianDetailModal"
    height="95vh"
    :title="$t('userManagement.guardianDetails')"
  >
    <UserDetailsCard
      v-if="selectedGuardian"
      :team-users="teamUsers"
      :user="selectedGuardian"
      @guardian-invited="handleGuardianInvited"
      @remove-invite="handleRemoveInvite"
      @remove-user="handleRemoveUser"
    />
  </BottomSheetModal>
</template>

<script lang="ts">
  import BottomSheetModal from '@/components/general/BottomSheetModal.vue'
  import RoleChip from '@/components/general/RoleChip.vue'
  import InviteUser from '@/components/users/InviteUser.vue'
  import UserAvatar from '@/components/users/UserAvatar.vue'

  export default {
    name: 'UserDetailsCard',
    components: {
      RoleChip,
      UserAvatar,
      InviteUser,
      BottomSheetModal
    },
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
    emits: ['remove-user', 'remove-invite', 'guardian-invited'],
    data() {
      return {
        guardianInviteModal: false,
        guardianDetailModal: false,
        selectedGuardian: null
      }
    },
    computed: {
      userRoles() {
        return this.user.roles || []
      },
      isInvitedUser() {
        return (this.user.status || 'active') !== 'active'
      },
      userGuardians() {
        // Filter team users who have guardian role with guardianOf === user.id
        return this.teamUsers.filter(teamUser => {
          return teamUser.roles.some(role =>
            role.role === 'guardian' && role.guardianOf === this.user.userId
          )
        })
      }
    },
    methods: {
      getLanguageName(languageCode) {
        const languageMap = {
          'en': 'English',
          'fi': 'Suomi'
        }
        return languageMap[languageCode] || languageCode
      },
      formatDate(dateString) {
        if (!dateString) return '-'
        const date = new Date(dateString)
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}.${month}.${year}`
      },
      handleRemoveAction() {
        if (this.isInvitedUser) {
          this.$emit('remove-invite', this.user)
        } else {
          this.$emit('remove-user', this.user)
        }
      },
      openGuardianInviteModal() {
        this.guardianInviteModal = true
      },
      handleGuardianInvited() {
        this.guardianInviteModal = false
        // Optionally emit an event to refresh the user data
        this.$emit('guardian-invited')
      },
      openGuardianDetail(guardian) {
        this.selectedGuardian = guardian
        this.guardianDetailModal = true
      },
      handleRemoveInvite(invite) {
        this.$emit('remove-invite', invite)
      },
      handleRemoveUser(user) {
        this.$emit('remove-user', user)
      }
    }
  }
</script>

<style scoped>
.user-details-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 16px;
}

/* Header Section */
.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}


.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1976D2;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.user-email {
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
}

.user-status-chip {
  font-weight: 500;
}

/* Details Section */
.user-details-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976D2;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 2px solid rgba(25, 118, 210, 0.1);
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.detail-item:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(25, 118, 210, 0.1);
}

.detail-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  font-size: 0.9rem;
}

.detail-value {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
  font-size: 0.9rem;
  min-width: 0;
  overflow: hidden;
}

.roles-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.guardians-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guardian-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.guardian-item--clickable {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.guardian-item--clickable:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.guardian-name {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.8);
  font-weight: 500;
  flex: 1;
}

.guardian-arrow {
  color: rgba(0, 0, 0, 0.4);
  transition: color 0.2s ease;
}

.guardian-item--clickable:hover .guardian-arrow {
  color: rgba(0, 0, 0, 0.6);
}

/* Actions Section */
.user-actions-section {
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .user-details-container {
    padding: 12px;
  }

  .user-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .user-info {
    min-width: 0;
    overflow: hidden;
  }


  .user-name {
    font-size: 1.3rem;
  }

  .user-email {
    font-size: 0.9rem;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 10px 12px;
  }

  .detail-label {
    font-size: 0.85rem;
  }

  .detail-value {
    font-size: 0.85rem;
    align-self: flex-end;
    min-width: 0;
    overflow: hidden;
    width: 100%;
  }

  .roles-container {
    gap: 2px;
  }

  .user-actions-section {
    padding-top: 16px;
  }
}

@media (max-width: 480px) {
  .user-details-container {
    padding: 8px;
  }

  .user-header {
    margin-bottom: 16px;
    padding-bottom: 16px;
  }

  .user-details-section {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 10px;
  }

  .details-grid {
    gap: 8px;
  }

  .detail-item {
    padding: 8px 10px;
  }

  .user-info {
    min-width: 0;
    overflow: hidden;
  }

  .detail-value {
    min-width: 0;
    overflow: hidden;
    width: 100%;
  }
}
</style>
