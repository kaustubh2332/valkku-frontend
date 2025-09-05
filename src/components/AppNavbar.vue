<template>
  <v-app-bar
    color="primary"
    dark
    prominent
  >
    <v-app-bar-title>
      Valkku
    </v-app-bar-title>

    <v-spacer />

    <div v-if="isAuthenticated" class="d-flex align-center">
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        location="bottom end"
        offset="8"
      >
        <template #activator="{ props }">
          <v-btn
            class="d-flex align-center pa-2"
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
            prepend-icon="mdi-account"
            subtitle="Manage your profile"
            title="Profile"
            @click="goToManageAccount"
          />

          <v-divider />

          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
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
        Login
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'

const menu = ref(false)

const {
  isAuthenticated,
  user,
  loginWithRedirect,
  logout: auth0Logout
} = useAuth0()

const login = () => {
  loginWithRedirect()
}

const logout = () => {
  menu.value = false
  auth0Logout({
    logoutParams: {
      returnTo: window.location.origin
    }
  })
}

// Redirect to Auth0's hosted account management page
const goToManageAccount = () => {
  menu.value = false
  window.location.href = 'https://valkku.eu.auth0.com/u/account'
}
</script>
