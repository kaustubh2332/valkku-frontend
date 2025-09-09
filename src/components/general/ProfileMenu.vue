<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="top start"
    offset="8"
  >
    <template #activator="{ props }">
      <v-btn
        class="d-flex align-left pa-2 flex-grow-1"
        v-bind="props"
        min-width="auto"
        style="width: 100%;"
        variant="text"
      >
        <v-avatar
          class="mr-4"
          :size="32"
        >
          <v-img
            v-if="user?.picture"
            :alt="user.name || 'User'"
            :src="user.picture"
          />
          <v-icon v-else>mdi-account</v-icon>
        </v-avatar>

        <span class="me-2">{{ fullName || user?.email || 'User' }}</span>
        <v-icon>mdi-chevron-up</v-icon>
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
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'ProfileMenu',
    emits: ['close-mobile-drawer'],
    setup() {
      const {
        isAuthenticated,
        user,
        logout: auth0Logout
      } = useAuth0()
      const userStore = useUserStore()

      return {
        isAuthenticated,
        user,
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
        this.handleMobileNavigation()
      },
      handleMobileNavigation() {
        // Close mobile drawer when navigation items are clicked
        if (this.$vuetify.display.mobile) {
          // Emit event to parent to close drawer
          this.$emit('close-mobile-drawer')
        }
      }
    }
  }
</script>
