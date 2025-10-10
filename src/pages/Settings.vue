<template>
  <div class="text-h4 my-4">
    {{ $t('settings.title') }}
  </div>

  <!-- General Tab -->
  <div>
    <!-- Language Settings -->
    <v-card flat>
      <v-card-text class="pa-6">
        <div class="text-h6 mb-4">
          <v-icon class="me-2">mdi-translate</v-icon>
          {{ $t('settings.language') }}
        </div>
        <v-radio-group
          v-model="selectedLanguage"
          hide-details
          @update:model-value="setLocale"
        >
          <v-radio
            :label="englishLabel"
            value="en"
          />
          <v-radio
            :label="finnishLabel"
            value="fi"
          />
        </v-radio-group>
      </v-card-text>
    </v-card>
    <v-divider />
    <!-- Account Settings -->
    <v-card
      class="mb-4"
      flat
    >
      <v-card-text class="pa-6">
        <div class="text-h6 mb-4">
          <v-icon class="me-2">mdi-account-cog-outline</v-icon>
          {{ $t('settings.account') }}
        </div>
        <v-btn @click="openChangePasswordDialog">
          <v-icon class="me-2">mdi-key</v-icon>
          {{ $t('settings.changePassword') }}
        </v-btn>
        <br>
        <v-btn
          class="mt-4"
          @click="startLogout"
        >
          <v-icon class="me-2">mdi-logout</v-icon>
          {{ $t('app.logout') }}
        </v-btn>
      </v-card-text>
    </v-card>
    <v-divider v-if="currentTeamName" />
    <!-- Team Settings -->
    <v-card
      v-if="currentTeamName"
      class="mb-4"
      flat
    >
      <v-card-text class="pa-6">
        <div class="text-h6 mb-4 d-flex align-center">
          <v-icon class="me-2">mdi-account-group-outline</v-icon>
          {{ $t('settings.team') }}
          <span class="text-grey-darken-1 ml-4">{{ currentTeamName }}</span>
        </div>
        <v-btn
          color="error"
          variant="outlined"
          @click="startLeaveTeam"
        >
          <v-icon class="me-2">mdi-exit-to-app</v-icon>
          {{ $t('settings.leaveTeam') }}
        </v-btn>
      </v-card-text>
    </v-card>
    <v-card-text>
      <div class="text-caption text-grey-darken-3 mb-4" style="opacity: 0.6;">
        {{ $t('settings.version') }} 1.0.0. {{ $t('settings.emojiClicked', { count: userStore.user?.emojiClickedCount }) }}.
      </div>
    </v-card-text>
  </div>

  <!-- Leave Team Confirmation -->
  <Confirm
    v-model="leaveTeamConfirm"
    accept-color="error"
    :accept-text="$t('settings.leaveTeam')"
    :cancel-text="$t('cancel')"
    :loading="leavingTeam"
    :text="leaveTeamConfirmText"
    :title="$t('settings.leaveTeam')"
    @accept="confirmLeaveTeam"
  />

  <!-- Change Password Dialog -->
  <ChangePasswordDialog v-model="changePasswordDialog" />
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useTeamStore } from '@/stores/team'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Settings',
    data() {
      return {
        userStore: useUserStore(),
        teamStore: useTeamStore(),
        notificationStore: useNotificationStore(),
        selectedLanguage: this.$i18n.locale,
        leaveTeamConfirm: false,
        leavingTeam: false,
        changePasswordDialog: false,
        planPartTypes: [],
        loadingPlanPartTypes: false
      }
    },
    computed: {
      currentTab() {
        return this.$route.name === 'SettingsGeneral' ? 'general' : 'planPartTypes'
      },
      user() {
        return this.userStore.user
      },
      englishLabel() {
        return this.$t('language.english')
      },
      finnishLabel() {
        return this.$t('language.finnish')
      },
      leaveTeamConfirmText() {
        return this.$t('settings.leaveTeamConfirm', { teamName: this.currentTeamName })
      },
      currentTeamName() {
        return this.userStore.currentTeam?.teamName || ''
      }
    },
    watch: {
      '$route.name': {
        immediate: true,
        handler(routeName) {
          if (routeName === 'SettingsPlanPartTypes' && this.planPartTypes.length === 0) {
            this.fetchPlanPartTypes()
          }
        }
      }
    },
    methods: {
      async setLocale(locale: string) {
        const result = await this.userStore.changeLocale(locale)
        if (result.success) {
          this.notificationStore.success(this.$t('settings.language_updated'))
        } else {
          this.notificationStore.handleBackendError(result.error)
        }
      },
      startLogout() {
        this.userStore.logout()
      },
      openChangePasswordDialog() {
        this.changePasswordDialog = true
      },
      startLeaveTeam() {
        this.leaveTeamConfirm = true
      },
      confirmLeaveTeam() {
        this.leavingTeam = true

        this.teamStore.leaveTeam({
          teamId: this.userStore.currentTeamId,
          userId: this.userStore.user.id
        })
          .then(() => {
            this.notificationStore.success(this.$t('settings.leaveTeamSuccess'))
            // Redirect to home after leaving team
            this.$router.push('/callback')
          })
          .catch((error) => {
            console.error('Failed to leave team:', error)
            this.notificationStore.handleBackendError(error)
          })
          .finally(() => {
            this.leavingTeam = false
            this.leaveTeamConfirm = false
          })
      },
      async fetchPlanPartTypes(silent = false) {
        if (!silent) {
          this.loadingPlanPartTypes = true
        }
        try {
          const response = await api.get('/plan/plan-part-type/me')
          this.planPartTypes = response.data.data
        } catch (error) {
          console.error('Error fetching plan part types:', error)
          this.notificationStore.handleBackendError(error)
        } finally {
          if (!silent) {
            this.loadingPlanPartTypes = false
          }
        }
      },
      updatePlanPartType(updatedItem) {
        // Optimistically update the item in the local array
        const itemIndex = this.planPartTypes.findIndex(item => item.id === updatedItem.id)
        if (itemIndex !== -1) {
          this.planPartTypes[itemIndex] = { ...this.planPartTypes[itemIndex], ...updatedItem }
        }
      }
    }
  }
</script>
