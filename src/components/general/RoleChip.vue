<template>
  <v-chip
    class="role-chip"
    :class="[`role-chip--${role}`, { 'role-chip--text': text, 'px-0': noPadding }]"
    :color="chipColor"
    size="small"
    :variant="chipVariant"
  >
    <span v-if="(!$vuetify.display.mobile && !icon) || alwaysShowText" :class="!$vuetify.display.mobile && !icon ? 'mr-2' : ''">
      {{ roleLabel }}
    </span>
    <v-icon
      class="mr-0"
      :icon="roleIcon"
      size="12"
    />
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
      },
      alwaysShowText: {
        type: Boolean,
        default: false
      },
      noPadding: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      chipVariant() {
        if (this.text) return 'text'
        return 'elevated'
      },
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
  font-weight: 500;
  letter-spacing: 0.1px;
  text-transform: uppercase;
  font-size: 0.65rem;
  height: 18px;
  opacity: 0.9;
}

.role-chip--owner {
  background: rgba(255, 193, 7, 0.12) !important;
  color: #E65100 !important;
  border: 1px solid rgba(255, 193, 7, 0.3) !important;
}

.role-chip--admin {
  background: rgba(25, 118, 210, 0.12) !important;
  color: #0D47A1 !important;
  border: 1px solid rgba(25, 118, 210, 0.3) !important;
}

.role-chip--athlete {
  background: rgba(76, 175, 80, 0.12) !important;
  color: #1B5E20 !important;
  border: 1px solid rgba(76, 175, 80, 0.3) !important;
}

.role-chip--guardian {
  background: rgba(156, 39, 176, 0.12) !important;
  color: #4A148C !important;
  border: 1px solid rgba(156, 39, 176, 0.3) !important;
}

.role-chip--coach {
  background: rgba(255, 107, 53, 0.12) !important;
  color: #BF360C !important;
  border: 1px solid rgba(255, 107, 53, 0.3) !important;
}

.role-chip--text.role-chip--owner,
.role-chip--text.role-chip--admin,
.role-chip--text.role-chip--athlete,
.role-chip--text.role-chip--guardian,
.role-chip--text.role-chip--coach {
  background: transparent !important;
  border: none !important;
}


.role-chip:hover {
  transform: scale(1.005);
  opacity: 1;
}

.invited-icon {
  color: currentColor !important;
  opacity: 0.9;
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .role-chip {
    font-size: 0.55rem !important;
    height: 16px;
  }
}
</style>
