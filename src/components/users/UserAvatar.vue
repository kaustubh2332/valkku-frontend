<template>
  <v-avatar
    class="user-avatar"
    :color="avatarColor"
    :size="size"
  >
    <span
      v-if="!isInvitedUser"
      class="text-white font-weight-bold"
      :class="textClass"
    >
      {{ userInitials }}
    </span>
    <span v-else>
      <v-icon
        color="white"
      >
        mdi-email-outline
      </v-icon>
    </span>
  </v-avatar>
</template>

<script lang="ts">
  export default {
    name: 'UserAvatar',
    props: {
      user: {
        type: Object,
        required: true
      },
      size: {
        type: [String, Number],
        default: 40
      }
    },
    computed: {
      isInvitedUser() {
        return !(this.user?.roles || []).some(r => r.status === 'active')
      },
      userInitials() {
        const firstName = this.user.firstName || ''
        const lastName = this.user.lastName || ''
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?'
      },
      avatarColor() {
        if (!this.user) return 'grey'
        const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
        const firstName = this.user.firstName || ''
        const lastName = this.user.lastName || ''
        const name = (firstName + lastName).toLowerCase()
        if (!name) return 'grey'
        const index = name.codePointAt(0) % colors.length
        return colors[index]
      },
      iconSize() {
        // Calculate icon size based on avatar size
        const avatarSize = typeof this.size === 'string' ? Number.parseInt(this.size) : this.size
        return Math.round(avatarSize * 0.5)
      },
      textClass() {
        // Calculate text class based on avatar size
        const avatarSize = typeof this.size === 'string' ? Number.parseInt(this.size) : this.size
        if (avatarSize >= 80) return 'text-h3'
        if (avatarSize >= 60) return 'text-h4'
        if (avatarSize >= 40) return 'text-body-2'
        return 'text-caption'
      },
      badgeSize() {
        const avatarSize = typeof this.size === 'string' ? Number.parseInt(this.size) : this.size
        return Math.round(avatarSize * 0.35)
      }
    }
  }
</script>

<style scoped>
.user-avatar {
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
}

.user-avatar:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
</style>
