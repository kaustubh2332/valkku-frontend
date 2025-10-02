<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="top start"
    offset="8"
    :z-index="2100"
  >
    <template #activator="{ props }">
      <div
        v-bind="props"
        class="profile-activator"
        :class="sidebar ? 'profile-activator-rail' : 'profile-activator-full'"
      >
        <div class="avatar-container">
          <v-avatar
            :class="sidebar ? '' : 'me-3'"
            :size="32"
          >
            <v-img
              v-if="user?.picture"
              :alt="user.name || 'User'"
              :src="user.picture"
            />
            <v-icon v-else>mdi-account</v-icon>
          </v-avatar>
          <v-icon
            v-if="sidebar"
            class="chevron-badge"
            size="12"
          >
            mdi-chevron-up
          </v-icon>
        </div>

        <div v-if="!sidebar" class="profile-content">
          <span class="profile-name">{{ fullName || user?.email || 'User' }}</span>
          <v-icon class="profile-chevron">mdi-chevron-up</v-icon>
        </div>
      </div>
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
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'ProfileMenu',
    props: {
      sidebar: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close-mobile-drawer'],
    data() {
      return {
        userStore: useUserStore(),
        menu: false
      }
    },
    computed: {
      isAuthenticated() {
        return !!this.userStore.user
      },
      user() {
        return this.userStore.user
      },
      fullName() {
        return this.userStore.fullName
      }
    },
    methods: {
      startLogout() {
        this.menu = false
        this.userStore.logout()
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

<style scoped>
.profile-activator {
  display: flex;
  align-items: center;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.profile-activator:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.profile-activator-full {
  width: 100%;
  padding: 8px 12px;
  justify-content: flex-start;
}

.profile-activator-rail {
  padding: 8px;
  justify-content: center;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.chevron-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background-color: rgb(var(--v-theme-surface));
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.profile-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.profile-chevron {
  font-size: 1.25rem;
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
