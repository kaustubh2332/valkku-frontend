<template>
  <v-app-bar
    color="white"
    dark
    prominent
  >
    <Loading v-if="isLoading" />
    <v-app-bar-title>
      <v-img
        alt="Valkku"
        contain
        height="40"
        src="@/assets/logo.svg"
        style="cursor: pointer;"
        width="40"
        @click="$router.push('/')"
      />
    </v-app-bar-title>

    <v-spacer />

    <div v-if="isAuthenticated" class="d-flex align-center">
      <!-- User Menu -->
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        location="bottom end"
        offset="8"
      >
        <template #activator="{ props }">
          <v-btn
            class="d-flex align-center pa-2 mr-4"
            v-bind="props"
            min-width="auto"
            variant="text"
          >
            <v-avatar
              class="me-2"
              size="32"
            >
              <v-img
                v-if="user?.picture"
                :alt="user.name || 'User'"
                :src="user.picture"
              />
              <v-icon v-else>mdi-account</v-icon>
            </v-avatar>


            <span class="me-2">{{ fullName || user?.email || 'User' }}</span>

            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list min-width="200">
          <v-list-item
            prepend-icon="mdi-cog"
            :title="$t('app.settings')"
            @click="goToSettings"
          />

          <v-divider />

          <v-list-item
            prepend-icon="mdi-logout"
            :title="$t('app.logout')"
            @click="startLogout"
          />
        </v-list>
      </v-menu>
    </div>

    <div v-else>
      <v-btn
        prepend-icon="mdi-login"
        variant="text"
      >
        {{ $t('app.login') }}
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'AppNavbar',
    setup() {
      const {
        isAuthenticated,
        isLoading,
        user,
        loginWithRedirect,
        logout: auth0Logout
      } = useAuth0()
      const userStore = useUserStore()

      return {
        isAuthenticated,
        isLoading,
        user,
        loginWithRedirect,
        userStore,
        auth0Logout
      }
    },
    data() {
      return {
        menu: false
      }
    },
    computed: {
      fullName() {
        return this.userStore.fullName
      }
    },
    methods: {
      startLogout() {
        this.menu = false
        this.userStore.logout()
        this.auth0Logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        })
      },
      goToSettings() {
        this.menu = false
        this.$router.push('/settings')
      }
    }
  }
</script>
