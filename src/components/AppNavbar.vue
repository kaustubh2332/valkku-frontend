<template>
  <v-app-bar
    color="white"
    dark
    prominent
  >
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


            <span class="me-2">{{ user?.name || user?.email || 'User' }}</span>

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
            @click="logout"
          />
        </v-list>
      </v-menu>
    </div>

    <div v-else>
      <v-btn
        prepend-icon="mdi-login"
        variant="text"
        @click="login"
      >
        {{ $t('app.login') }}
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'

  export default {
    name: 'AppNavbar',
    setup() {
      const {
        isAuthenticated,
        user,
        loginWithRedirect,
        logout: auth0Logout
      } = useAuth0()

      return {
        isAuthenticated,
        user,
        loginWithRedirect,
        auth0Logout
      }
    },
    data() {
      return {
        menu: false
      }
    },
    methods: {
      login() {
        this.loginWithRedirect()
      },
      logout() {
        this.menu = false
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
