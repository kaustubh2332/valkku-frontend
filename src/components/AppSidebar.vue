<template>
  <v-navigation-drawer
    v-model="drawer"
    :location="$vuetify.display.mobile ? 'right' : 'left'"
    :permanent="!$vuetify.display.mobile"
    :rail="rail && !$vuetify.display.mobile"
    :temporary="$vuetify.display.mobile"
    @click="rail = false"
  >
    <!-- User Menu from Navbar -->
    <div v-if="isAuthenticated" class="pa-4">
      <div class="d-flex align-center">
        <v-menu
          v-model="menu"
          :close-on-content-click="false"
          location="bottom start"
          offset="8"
        >
          <template #activator="{ props }">
            <v-btn
              class="d-flex align-center pa-2 flex-grow-1"
              v-bind="props"
              min-width="auto"
              variant="text"
            >
              <v-avatar
                class="me-2"
                :size="rail ? 24 : 32"
              >
                <v-img
                  v-if="user?.picture"
                  :alt="user.name || 'User'"
                  :src="user.picture"
                />
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>

              <span v-if="!rail" class="me-2">{{ fullName || user?.email || 'User' }}</span>
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

        <v-btn
          v-if="!rail && !$vuetify.display.mobile"
          v-tooltip:right="$t('sidebar.minify')"
          :icon="'mdi-chevron-left'"
          size="small"
          variant="text"
          @click.stop="rail = !rail"
        />
      </div>
    </div>

    <v-divider />

    <v-list>
      <v-list-item
        v-for="item in navigationItems"
        :key="item.name"
        v-tooltip:right="$t(item.titleKey)"
        :active="$route.name === item.name"
        :density="$vuetify.display.mobile ? 'default' : 'compact'"
        :prepend-icon="item.icon"
        :title="$t(item.titleKey)"
        :to="{ name: item.name }"
        @click.stop="handleMobileNavigation"
      />
    </v-list>

    <template #append>
      <v-list>
        <v-list-item
          :active="$route.name === 'Settings'"
          :density="$vuetify.display.mobile ? 'default' : 'compact'"
          prepend-icon="mdi-cog"
          :title="$t('sidebar.settings')"
          :to="{ name: 'Settings' }"
          @click.stop="handleMobileNavigation"
        />
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'AppSidebar',
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
        drawer: true,
        rail: false,
        menu: false,
        navigationItems: [
          {
            name: 'Home',
            icon: 'mdi-home',
            titleKey: 'sidebar.home'
          }
        ]
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
          this.drawer = false
        }
      }
    }
  }
</script>
