<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom end"
    :z-index="zIndex"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-pencil"
        size="x-small"
        variant="text"
        @click="initEditableRoles"
      />
    </template>

    <v-card v-if="menu" min-width="240">
      <v-list v-if="editableRoles" density="compact">
        <v-list-item>
          <v-checkbox
            v-model="editableRoles.admin"
            density="compact"
            hide-details
            :label="$t('roles.admin')"
          />
        </v-list-item>
        <v-list-item>
          <v-checkbox
            v-model="editableRoles.coach"
            density="compact"
            hide-details
            :label="$t('roles.coach')"
          />
        </v-list-item>
        <v-list-item>
          <v-checkbox
            v-model="editableRoles.athlete"
            density="compact"
            hide-details
            :label="$t('roles.athlete')"
          />
        </v-list-item>
      </v-list>
      <v-divider />
      <v-card-actions>
        <v-btn size="small" variant="text" @click="menu = false">{{ $t('cancel') }}</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          :loading="saving"
          size="small"
          @click="handleSave"
        >
          {{ $t('ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
  export default {
    name: 'RoleSelector',
    props: {
      user: {
        type: Object,
        required: true
      },
      saving: {
        type: Boolean,
        default: false
      },
      zIndex: {
        type: Number,
        default: 30000
      }
    },
    emits: ['save'],
    data() {
      return {
        menu: false,
        editableRoles: {
          admin: false,
          coach: false,
          athlete: false
        }
      }
    },
    computed: {
      hasGuardian() {
        const roles = Array.isArray(this.user?.roles) ? this.user.roles : []
        return roles.some((r: any) => r && r.role === 'guardian')
      }
    },
    methods: {
      initEditableRoles() {
        const roles = Array.isArray(this.user?.roles) ? this.user.roles : []
        this.editableRoles = {
          admin: roles.some((r: any) => r && r.role === 'admin'),
          coach: roles.some((r: any) => r && r.role === 'coach'),
          athlete: roles.some((r: any) => r && r.role === 'athlete')
        }
      },
      handleSave() {
        const roles: Array<{ role: 'admin' | 'coach' | 'athlete' } > = []
        if (this.editableRoles.admin) roles.push({ role: 'admin' })
        if (this.editableRoles.coach) roles.push({ role: 'coach' })
        if (this.editableRoles.athlete) roles.push({ role: 'athlete' })
        this.$emit('save', roles)
      }
    }
  }
</script>

<style scoped>
</style>
