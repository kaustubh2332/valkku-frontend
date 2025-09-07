<template>
  <v-container>
    <div class="text-h4 my-4">
      {{ $t('settings.title') }}
    </div>

    <!-- Language Settings -->
    <v-card
      class="mb-4"
      variant="outlined"
    >
      <v-card-text class="pa-6">
        <div class="text-h6 mb-4">
          <v-icon class="me-2">mdi-translate</v-icon>
          {{ $t('settings.language') }}
        </div>
        <v-radio-group
          v-model="selectedLanguage"
          @update:model-value="setLocale"
        >
          <v-radio
            :label="$t('language.english')"
            value="en"
          />
          <v-radio
            :label="$t('language.finnish')"
            value="fi"
          />
        </v-radio-group>
      </v-card-text>
    </v-card>

    <!-- Account Settings -->
    <v-card
      class="mb-4"
      variant="outlined"
    >
      <v-card-text class="pa-6">
        <div class="text-h6 mb-4">
          <v-icon class="me-2">mdi-account-cog</v-icon>
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
        {{ $t('settings.version') }} 1.0.0. {{ $t('settings.emojiClicked', { count: userStore.getUser?.emojiClickedCount }) }}.
      </div>
    </v-card-text>
  </v-container>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Settings',
    setup() {
      const { user, logout: auth0Logout } = useAuth0()
      const userStore = useUserStore()
      return { user, userStore, auth0Logout }
    },
    data() {
      return {
        selectedLanguage: this.$i18n.locale,
        loadingPwChangeUri: false
      }
    },
    methods: {
      setLocale(locale: string) {
        this.$i18n.locale = locale
        localStorage.setItem('locale', locale)
      },
      startLogout() {
        this.userStore.logout()
        this.auth0Logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        })
      },
      async changePassword() {
        try {
          // Call your backend to generate a password change ticket
          this.loadingPwChangeUri = true
          const response = await api.post('/auth/password/change-ticket', {
            userId: this.user.sub
          })

          console.log(response.data.data)

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
