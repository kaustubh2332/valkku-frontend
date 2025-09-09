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
          class="flex-grow-1"
          main
        />
        <v-icon v-else class="me-2">mdi-account-group</v-icon>

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
        v-tooltip:right="getItemTitle(item)"
        :active="$route.name === item.name"
        :density="$vuetify.display.mobile ? 'default' : 'compact'"
        :prepend-icon="item.icon"
        :title="getItemTitle(item)"
        :to="{ name: item.name }"
        @click.stop="handleMobileNavigation"
      />
    </v-list>

    <template #append>
      <!-- Profile Menu -->
      <div class="pa-2">
        <ProfileMenu
          v-if="isAuthenticated"
          @close-mobile-drawer="handleMobileNavigation"
        />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import ChooseTeamBtn from '@/components/general/ChooseTeamBtn.vue'
  import ProfileMenu from '@/components/general/ProfileMenu.vue'

  export default {
    name: 'AppSidebar',
    components: {
      ChooseTeamBtn,
      ProfileMenu
    },
    setup() {
      const { isAuthenticated } = useAuth0()

      return {
        isAuthenticated
      }
    },
    data() {
      return {
        drawer: true,
        rail: false
      }
    },
    computed: {
      navigationItems() {
        return [
          {
            name: 'Home',
            icon: 'mdi-home',
            titleKey: 'sidebar.home'
          },
          {
            name: 'UserManagement',
            icon: 'mdi-account-group',
            titleKey: 'sidebar.userManagement'
          },
          {
            name: 'Settings',
            icon: 'mdi-cog',
            titleKey: 'sidebar.settings'
          },
        ]
      }
    },
    methods: {
      getItemTitle(item) {
        return this.$t(item.titleKey)
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
