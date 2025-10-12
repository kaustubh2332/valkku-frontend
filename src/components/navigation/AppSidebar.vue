<template>
  <v-navigation-drawer
    v-model="drawer"
    class="sidebar-drawer"
    :location="$vuetify.display.mobile ? 'right' : 'left'"
    :permanent="!$vuetify.display.mobile"
    :rail="rail && !$vuetify.display.mobile"
    :rail-width="72"
    :temporary="$vuetify.display.mobile"
    :width="300"
    @click="rail = false"
  >
    <!-- Safe area spacer for mobile -->
    <div v-if="$vuetify.display.mobile" class="mobile-safe-area-top" />

    <!-- Team Selection -->
    <div v-if="isAuthenticated" class="pa-4 pr-0">
      <div class="d-flex align-center justify-center">
        <div v-if="!rail" class="d-flex align-center justify-center">
          <div class="flex-grow-1">
            <ChooseTeamBtn
              block
              class="flex-grow-1"
              main
            />
          </div>
          <div v-if="!$vuetify.display.mobile && !rail" class="pa-2">
            <v-tooltip>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  block
                  color="default"
                  variant="text"
                  @click.stop="rail = true"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
              </template>
              <span>{{ $t('sidebar.minify') }}</span>
            </v-tooltip>
          </div>
        </div>
        <div v-else class="d-flex align-center justify-center pr-4">
          <v-icon class="text-align-center">mdi-account-group</v-icon>
        </div>
      </div>
    </div>

    <v-divider />

    <v-list class="px-2">
      <template v-for="item in filteredNavigationItems" :key="item.name">
        <!-- Items with children (collapsible groups) -->
        <v-list-group
          v-if="item.children && !rail"
          class="sidebar-list-group"
          :model-value="isGroupOpen(item)"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :active="$route.path.startsWith(item.path)"
              class="rounded-lg mb-1"
              color="primary"
              :prepend-icon="item.icon"
              :title="item.title"
            />
          </template>

          <v-list-item
            v-for="child in item.children"
            :key="child.name"
            :active="$route.name === child.name"
            class="rounded-lg mb-1"
            color="primary"
            density="compact"
            :title="child.title"
            :to="{ name: child.name }"
            @click.stop="handleMobileNavigation"
          />
        </v-list-group>

        <!-- Items with children but in rail mode - show as regular item -->
        <v-tooltip
          v-else-if="item.children && rail"
          :disabled="isMobile || !rail"
          location="right"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :active="$route.path.startsWith(item.path)"
              class="rounded-lg mb-1"
              color="primary"
              :prepend-icon="item.icon"
              :title="item.title"
              :to="{ name: item.children[0].name }"
              @click.stop="handleMobileNavigation"
            />
          </template>
          <span>{{ item.title }}</span>
        </v-tooltip>

        <!-- Regular items without children -->
        <v-tooltip
          v-else
          :disabled="isMobile || !rail"
          location="right"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :active="item.path === '/' ? $route.path === '/' : $route.path.startsWith(item.path)"
              class="rounded-lg mb-1"
              color="primary"
              :prepend-icon="item.icon"
              :title="item.title"
              :to="{ name: item.name }"
              @click.stop="handleMobileNavigation"
            />
          </template>
          <span>{{ item.title }}</span>
        </v-tooltip>
      </template>

      <v-list-item
        v-if="userStore.user?.superAdmin"
        :active="$route.path.startsWith('/admin')"
        class="rounded-lg mb-1"
        color="primary"
        prepend-icon="mdi-shield-crown-outline"
        title="Admin dashboard"
        :to="{ path: '/admin' }"
        @click.stop="handleMobileNavigation"
      />
    </v-list>

    <template #append>
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
        return this.navigationItems.filter(item => item.roles?.includes(this.userStore.currentRole?.role) || !item.roles)
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
            name: 'Program',
            path: '/program',
            icon: 'mdi-clipboard-text',
            title: this.$t('sidebar.program')
          },
          {
            name: 'Users',
            path: '/users',
            icon: 'mdi-account-group',
            title: this.$t('sidebar.userManagement'),
            roles: ['owner', 'admin'],
            children: [
              {
                name: 'UsersManagers',
                icon: 'mdi-account-group',
                title: this.$t('sidebar.users_managers')
              },
              {
                name: 'UsersAthletes',
                icon: 'mdi-run',
                title: this.$t('sidebar.users_athletes')
              }
            ]
          },
          {
            name: 'Library',
            path: '/library',
            icon: 'mdi-library-outline',
            title: this.$t('sidebar.library'),
            children: [
              {
                name: 'LibraryPracticePlans',
                icon: 'mdi-notebook-outline',
                title: this.$t('sidebar.library_practice_plans')
              },
              {
                name: 'LibraryPlanParts',
                icon: 'mdi-vector-intersection',
                title: this.$t('sidebar.library_plan_parts')
              }
            ]
          },
          {
            name: 'Settings',
            path: '/settings',
            icon: 'mdi-cog',
            title: this.$t('sidebar.settings')
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
            this.rail = false
          } else {
            this.drawer = true
          }
        }
      },
      rail(newVal) {
        // Save rail state to localStorage for desktop
        if (!this.$vuetify.display.mobile) {
          localStorage.setItem('sidebar-rail', newVal.toString())
        }
      }
    },
    mounted() {
      // Set initial drawer state based on screen size
      // Desktop: open, Mobile: closed
      this.drawer = !this.$vuetify.display.mobile

      // Load rail preference from localStorage for desktop
      if (!this.$vuetify.display.mobile) {
        const savedRailState = localStorage.getItem('sidebar-rail')
        this.rail = savedRailState === 'true'
      }
    },
    methods: {
      handleMobileNavigation() {
        // Close mobile drawer when navigation items are clicked
        if (this.$vuetify.display.mobile) {
          this.drawer = false
        }
      },
      isGroupOpen(item) {
        // Keep the group open if the current route starts with the item's path
        return this.$route.path.startsWith(item.path)
      }
    }
  }
</script>

<style scoped>
.mobile-safe-area-top {
  height: env(safe-area-inset-top, 0px);
  background: inherit;
}

.mobile-safe-area-bottom {
  height: env(safe-area-inset-bottom, 0px);
  background: inherit;
}

/* Inset for subpage items in list groups */
:deep(.v-list-group__items .v-list-item) {
  padding-inline-start: 72px !important;
}

/* Hide the expand/collapse icon in list groups */
.sidebar-list-group :deep(.v-list-group__header__append-icon) {
  display: none;
}
</style>

<style>
/* Ensure sidebar goes over bottom nav on mobile */
.sidebar-drawer.v-navigation-drawer {
  z-index: 2001 !important;
}

.sidebar-drawer.v-navigation-drawer .v-overlay__scrim {
  z-index: 2000 !important;
}
</style>
