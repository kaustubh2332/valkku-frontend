<template>
  <v-table class="user-table" density="comfortable" fixed-header>
    <thead>
      <tr>
        <th class="text-left" style="width: 35%">{{ $t('userManagement.teamMember') }}</th>
        <!-- <th class="text-left" style="width: 25%">Email</th> -->
        <th class="text-left" style="width: 10%">Status</th>
        <th v-if="showGuardians" class="text-left" style="width: 15%">{{ $t('userManagement.guardians') }}</th>
        <th class="text-left" style="width: 15%">{{ $t('userManagement.roles') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="user in users"
        :key="user.userId"
        class="table-row"
        @click="$emit('row-click', user, false)"
      >
        <td>
          <div class="d-flex align-center">
            <UserAvatar class="mr-3" size="28" :user="user" />
            <div class="text-truncate">
              <div class="text-body-1 font-weight-medium text-truncate">{{ user.fullName || user.email }}</div>
            </div>
          </div>
        </td>
        <!-- <td class="text-truncate">
          <span class="text-caption text-medium-emphasis">{{ user.email }}</span>
        </td> -->
        <td>
          <v-chip
            :color="isUserInvited(user) ? 'orange' : 'green'"
            label
            size="x-small"
            variant="tonal"
          >
            <v-icon class="mr-1" size="14">{{ isUserInvited(user) ? 'mdi-account-clock' : 'mdi-check-circle' }}</v-icon>
            {{ isUserInvited(user) ? $t('userManagement.invited') : $t('userManagement.active') }}
          </v-chip>
        </td>
        <td v-if="showGuardians">
          <div class="d-flex align-center">
            <v-tooltip
              v-for="g in guardiansPreview(user)"
              :key="g.id"
              location="top"
              :text="g.email"
            >
              <template #activator="{ props }">
                <UserAvatar
                  v-bind="props"
                  :key="g.id"
                  class="mr-1"
                  size="20"
                  :user="g"
                />
              </template>
              <div class="d-flex align-center">
                <div v-if="g.fullName">
                  {{ g.fullName }}
                </div>
                <div v-else>
                  {{ g.email }}
                </div>
              </div>
            </v-tooltip>
            <span v-if="guardiansOverflowCount(user) > 0" class="text-caption text-medium-emphasis ml-1">+{{ guardiansOverflowCount(user) }}</span>
          </div>
        </td>
        <td>
          <div class="d-flex align-center flex-wrap" style="gap: 4px;">
            <template v-for="roleObj in rolesPreview(user)" :key="roleObj.role + (roleObj.guardianOf || '')">
              <v-tooltip
                v-if="roleObj.role === 'guardian' && roleObj.guardianOf"
                location="top"
                :text="getAthleteDisplay(roleObj.guardianOf)"
              >
                <template #activator="{ props }">
                  <RoleChip v-bind="props" :role="roleObj.role" />
                </template>
              </v-tooltip>
              <RoleChip
                v-else
                :role="roleObj.role"
              />
            </template>

            <v-tooltip v-if="rolesOverflowCount(user) > 0" location="top">
              <template #activator="{ props }">
                <v-chip
                  v-bind="props"
                  class="ml-1"
                  color="grey"
                  size="x-small"
                  variant="tonal"
                >
                  +{{ rolesOverflowCount(user) }}
                </v-chip>
              </template>
              <div class="d-flex align-center flex-wrap" style="gap: 4px; background-color: white; border-radius: 4px; padding: 4px;">
                <template v-for="extra in rolesOverflow(user)" :key="extra.role + (extra.guardianOf || '')">
                  <v-tooltip
                    v-if="extra.role === 'guardian' && extra.guardianOf"
                    location="top"
                    :text="getAthleteDisplay(extra.guardianOf)"
                  >
                    <template #activator="{ props }">
                      <RoleChip
                        v-bind="props"
                        :role="extra.role"
                      />
                    </template>
                  </v-tooltip>
                  <RoleChip v-else :role="extra.role" />
                </template>
              </div>
            </v-tooltip>
          </div>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts">
  import RoleChip from '@/components/general/RoleChip.vue'
  import UserAvatar from '@/components/users/UserAvatar.vue'

  export default {
    name: 'UserTable',
    components: {
      RoleChip,
      UserAvatar
    },
    props: {
      users: {
        type: Array as unknown as () => Array<Record<string, any>>,
        required: true
      },
      teamUsers: {
        type: Array as unknown as () => Array<Record<string, any>>,
        default: () => []
      },
      showGuardians: {
        type: Boolean,
        default: true
      }
    },
    emits: ['row-click'],
    methods: {
      sortedRoles(roles) {
        return (roles || []).sort((a, b) => {
          const roleOrder = ['owner', 'admin', 'coach', 'athlete', 'guardian']
          return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
        })
      },
      rolesPreview(user) {
        const roles = Array.isArray(this.sortedRoles(user.roles)) ? this.sortedRoles(user.roles) : []
        return this.sortedRoles(roles).slice(0, 1)
      },
      rolesOverflow(user) {
        const roles = Array.isArray(this.sortedRoles(user.roles)) ? this.sortedRoles(user.roles) : []
        return this.sortedRoles(roles).slice(1)
      },
      rolesOverflowCount(user) {
        const roles = Array.isArray(this.sortedRoles(user.roles)) ? this.sortedRoles(user.roles) : []
        return Math.max(0, this.sortedRoles(roles).length - 1)
      },
      getAthleteDisplay(athleteId) {
        const athlete = (this.teamUsers || []).find(u => (u.userId || u.id) === athleteId)
        return athlete ? (athlete.fullName || athlete.email || athleteId) : athleteId
      },
      guardiansFor(user) {
        const userId = user.userId || user.id
        return this.teamUsers.filter(u => (u.roles || []).some(r => r.role === 'guardian' && r.guardianOf === userId))
      },
      guardiansPreview(user) {
        return this.guardiansFor(user).slice(0, 3)
      },
      guardiansOverflowCount(user) {
        const count = this.guardiansFor(user).length
        return Math.max(0, count - 3)
      },
      isUserInvited(user) {
        return (user.status || 'active') !== 'active'
      }
    },
  }
</script>

<style scoped>
  .user-table thead th {
    font-weight: 600;
    color: rgba(0,0,0,0.7);
  }
  .user-table .table-row {
    cursor: pointer;
  }
  .user-table .table-row:hover {
    background: rgba(0,0,0,0.02);
  }
</style>
