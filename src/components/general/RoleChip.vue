<template>
  <v-chip
    class="role-chip"
    :class="[`role-chip--${role}`, { 'role-chip--text': text }]"
    :color="chipColor"
    size="small"
    :variant="text ? 'text' : 'elevated'"
  >
    <v-icon
      class="mr-0"
      :class="!$vuetify.display.mobile && !icon ? 'mr-2' : ''"
      :icon="roleIcon"
      size="12"
    />
    <span v-if="!$vuetify.display.mobile && !icon">
      {{ roleLabel }}
    </span>
  </v-chip>
</template>

<script lang="ts">
  export default {
    name: 'RoleChip',
    props: {
      role: {
        type: String,
        required: true,
        validator: (value: string) => ['owner', 'admin', 'athlete', 'guardian', 'coach'].includes(value)
      },
      text: {
        type: Boolean
      },
      icon: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      roleLabel() {
        const labels = {
          owner: this.$t('roles.owner'),
          admin: this.$t('roles.admin'),
          athlete: this.$t('roles.athlete'),
          guardian: this.$t('roles.guardian'),
          coach: this.$t('roles.coach')
        }
        return labels[this.role] || this.role
      },
      chipColor() {
        const colors = {
          owner: 'amber',
          admin: 'blue',
          athlete: 'green',
          guardian: 'purple',
          coach: 'deep-orange'
        }
        return colors[this.role] || 'grey'
      },
      roleIcon() {
        const icons = {
          owner: 'mdi-crown',
          admin: 'mdi-shield-crown',
          athlete: 'mdi-run',
          guardian: 'mdi-account-heart',
          coach: 'mdi-whistle'
        }
        return icons[this.role] || 'mdi-account'
      }
    }
  }
</script>

<style scoped>
.role-chip {
  transition: all 0.2s ease;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  font-size: 0.7rem;
  height: 20px;
}

.role-chip--owner {
  background: linear-gradient(135deg, #FFD700, #FFA000) !important;
  color: #000 !important;
}

.role-chip--admin {
  background: linear-gradient(135deg, #1976D2, #1565C0) !important;
  color: #fff !important;
}

.role-chip--athlete {
  background: linear-gradient(135deg, #4CAF50, #388E3C) !important;
  color: #fff !important;
}

.role-chip--guardian {
  background: linear-gradient(135deg, #9C27B0, #7B1FA2) !important;
  color: #fff !important;
}

.role-chip--coach {
  background: linear-gradient(135deg, #FF6B35, #F7931E) !important;
  color: #fff !important;
}

.role-chip--text.role-chip--owner,
.role-chip--text.role-chip--admin,
.role-chip--text.role-chip--athlete,
.role-chip--text.role-chip--guardian,
.role-chip--text.role-chip--coach {
  background: transparent !important;
  color: inherit !important;
}


.role-chip:hover {
  transform: scale(1.02);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .role-chip {
    font-size: 0.6rem !important;
    height: 18px;
  }
}
</style>
