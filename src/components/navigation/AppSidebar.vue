<template>
  <v-navigation-drawer
    v-model="drawer"
    class="sidebar-drawer"
    :location="$vuetify.display.mobile ? 'right' : 'left'"
    :permanent="!$vuetify.display.mobile"
    :rail="rail && !$vuetify.display.mobile"
    :temporary="$vuetify.display.mobile"
    @click="rail = false"
  >
    <!-- Safe area spacer for mobile -->
    <div v-if="$vuetify.display.mobile" class="mobile-safe-area-top" />

    <!-- Team Selection -->
    <div v-if="isAuthenticated" class="pa-4">
      <div class="d-flex align-center">
        <ChooseTeamBtn
          v-if="!rail"
          block
          class="flex-grow-1"
          main
        />
        <v-icon v-else class="me-2">mdi-account-group</v-icon>
      </div>
    </div>

    <v-divider />

    <v-list>
      <v-tooltip
        v-for="item in filteredNavigationItems"
        :key="item.name"
        :disabled="isMobile || !rail"
        location="right"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :active="item.path === '/' ? $route.path === '/' : $route.path.startsWith(item.path)"
            color="primary"
            :prepend-icon="item.icon"
            :title="item.title"
            :to="{ name: item.name }"
            @click.stop="handleMobileNavigation"
          />
        </template>
        <span>{{ item.title }}</span>
      </v-tooltip>
      <v-list-item
        v-if="userStore.user?.superAdmin"
        :active="$route.path.startsWith('/admin')"
        color="primary"
        prepend-icon="mdi-shield-crown-outline"
        title="Admin dashboard"
        :to="{ path: '/admin' }"
        @click.stop="handleMobileNavigation"
      />
    </v-list>

    <template #append>
      <!-- Profile Menu -->
      <div class="pa-2">
        <ProfileMenu
          v-if="isAuthenticated"
          :sidebar="rail"
          @close-mobile-drawer="handleMobileNavigation"
        />
      </div>

      <!-- Safe area spacer for mobile bottom -->
      <div v-if="$vuetify.display.mobile" class="mobile-safe-area-bottom" />
    </template>
  </v-navigation-drawer>

  <!-- <v-fab
    v-if="!$vuetify.display.mobile"
    v-tooltip:right="isMobile ? null : (rail ? $t('sidebar.expand') : $t('sidebar.minify'))"
    :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
    size="small"
    :style="rail ? 'position: absolute; left: 60px; top: 4px;' : 'position: absolute; left: 260px; top: 4px;'"
    variant="text"
    @click="rail = !rail"
  /> -->
</template>

<script lang="ts">
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'AppSidebar',
    data() {
      return {
        userStore: useUserStore(),
        drawer: false,
        rail: false
      }
    },
    computed: {
      isAuthenticated() {
        return !!this.userStore.getUser
      },
      isMobile() {
        return this.$vuetify.display.mobile
      },
      filteredNavigationItems() {
        return this.navigationItems.filter(item => item.roles?.includes(this.userStore.currentRoleId) || !item.roles)
      },
      navigationItems() {
        return [
          {
            name: 'Home',
            path: '/',
            icon: 'mdi-home',
            title: this.$t('sidebar.home')
          },
          {
            name: 'Calendar',
            path: '/calendar',
            icon: 'mdi-calendar-blank-outline',
            title: this.$t('sidebar.calendar')
          },
          {
            name: 'Users',
            path: '/users',
            icon: 'mdi-account-group',
            title: this.$t('sidebar.userManagement'),
            roles: ['owner', 'admin']
          },
          {
            name: 'Settings',
            path: '/settings',
            icon: 'mdi-cog',
            title: this.$t('sidebar.settings')
          },
          {
            name: 'Library',
            path: '/library',
            icon: 'mdi-library-outline',
            title: this.$t('sidebar.library')
          }
        ]
      }
    },
    watch: {
      '$vuetify.display.mobile': {
        handler(isMobile) {
          // Auto-hide drawer when switching to mobile
          if (isMobile) {
            this.drawer = false
          }
        }
      }
    },
    mounted() {
      // Set initial drawer state based on screen size
      this.drawer = !this.$vuetify.display.mobile
    },
    methods: {
      handleMobileNavigation() {
        // Close mobile drawer when navigation items are clicked
        if (this.$vuetify.display.mobile) {
          this.drawer = false
        }
      }
    }
  }
</script>

<style>
.mobile-safe-area-top {
  height: env(safe-area-inset-top, 0px);
  background: inherit;
}

.mobile-safe-area-bottom {
  height: env(safe-area-inset-bottom, 0px);
  background: inherit;
}

/* Ensure sidebar goes over bottom nav on mobile */
.sidebar-drawer.v-navigation-drawer {
  z-index: 2001 !important;
}

.sidebar-drawer.v-navigation-drawer .v-overlay__scrim {
  z-index: 2000 !important;
}
</style>
