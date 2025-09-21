<template>
  <v-navigation-drawer
    v-model="drawer"
    :location="$vuetify.display.mobile ? 'right' : 'left'"
    :permanent="!$vuetify.display.mobile"
    :rail="rail && !$vuetify.display.mobile"
    :temporary="$vuetify.display.mobile"
    @click="rail = false"
  >
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
        v-for="item in navigationItems"
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
  import ChooseTeamBtn from '@/components/general/ChooseTeamBtn.vue'
  import ProfileMenu from '@/components/general/ProfileMenu.vue'

  import { useUserStore } from '@/stores/user'

  export default {
    name: 'AppSidebar',
    components: {
      ChooseTeamBtn,
      ProfileMenu
    },
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
      navigationItems() {
        return [
          {
            name: 'Home',
            path: '/',
            icon: 'mdi-home',
            title: this.$t('sidebar.home')
          },
          {
            name: 'Users',
            path: '/users',
            icon: 'mdi-account-group',
            title: this.$t('sidebar.userManagement')
          },
          {
            name: 'Settings',
            path: '/settings',
            icon: 'mdi-cog',
            title: this.$t('sidebar.settings')
          },
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
