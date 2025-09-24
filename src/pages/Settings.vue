<template>
  <div class="text-h4 my-4">
    {{ $t('settings.title') }}
  </div>

  <!-- Language Settings -->
  <v-card
    flat
  >
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
      <v-btn
        :loading="loadingPwChangeUri"
        @click="changePassword"
      >
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
  <v-card-text>
    <div class="text-caption text-grey-darken-3 mb-4" style="opacity: 0.6;">
      {{ $t('settings.version') }} 1.0.0. {{ $t('settings.emojiClicked', { count: userStore.user?.emojiClickedCount }) }}.
    </div>
  </v-card-text>
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'
  export default {
    name: 'Settings',
    data() {
      return {
        userStore: useUserStore(),
        notificationStore: useNotificationStore(),
        selectedLanguage: this.$i18n.locale,
        loadingPwChangeUri: false
      }
    },
    computed: {
      user() {
        return this.userStore.user
      },
      englishLabel() {
        return this.$t('language.english')
      },
      finnishLabel() {
        return this.$t('language.finnish')
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
      async changePassword() {
        try {
          // Call your backend to generate a password change ticket
          this.loadingPwChangeUri = true
          const response = await api.post('/auth/password/change-ticket', {
            userId: this.user.sub
          })

          // Redirect to the generated password change URL
          window.location.href = response.data.data.url
        } catch (error) {
          console.error('Failed to generate password change ticket:', error)
          // You could show a user-friendly error message here
        } finally {
          this.loadingPwChangeUri = false
        }
      }
    }
  }
</script>
