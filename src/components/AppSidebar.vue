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
            :active="$route.name === item.name"
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

  <!-- Minify FAB Button -->
  <v-fab
    v-if="!$vuetify.display.mobile"
    v-tooltip:right="isMobile ? null : (rail ? $t('sidebar.expand') : $t('sidebar.minify'))"
    :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
    size="small"
    :style="rail ? 'position: absolute; left: 60px; top: 4px;' : 'position: absolute; left: 260px; top: 4px;'"
    variant="text"
    @click="rail = !rail"
  />
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
      isMobile() {
        return this.$vuetify.display.mobile
      },
      navigationItems() {
        return [
          {
            name: 'Home',
            icon: 'mdi-home',
            title: this.$t('sidebar.home')
          },
          {
            name: 'Users',
            icon: 'mdi-account-group',
            title: this.$t('sidebar.userManagement')
          },
          {
            name: 'Settings',
            icon: 'mdi-cog',
            title: this.$t('sidebar.settings')
          },
        ]
      }
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
