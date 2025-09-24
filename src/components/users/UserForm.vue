<template>
  <v-form
    ref="form"
    v-model="formValidProxy"
    class="mt-4"
  >
    <v-row>
      <v-col :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="12">
        <v-menu
          v-if="(isGuardian || localUser.role === 'guardian') && !selectedGuardian"
          v-model="emailMenu"
          :close-on-content-click="true"
          location="bottom"
          :open-on-click="false"
          :z-index="dropdownZIndex"
        >
          <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="localUser.email"
              autofocus
              :density="$vuetify.display.mobile ? 'compact' : 'default'"
              :hide-details="$vuetify.display.mobile ? 'auto' : false"
              :label="$t('signUp.email') + ' *'"
              required
              :rules="emailRules"
              type="email"
              validate-on="input"
              variant="outlined"
              @blur="touchedFields.email = true"
              @focus="onGuardianEmailFocus"
              @input="onGuardianEmailInput"
              @keydown="onGuardianKeydown"
            />
          </template>
          <v-list v-if="emailSuggestions.length > 0" density="compact">
            <v-list-item
              v-for="s in emailSuggestions"
              :key="s.value"
              @click="selectGuardianSuggestion(s)"
            >
              <template #prepend>
                <UserAvatar v-if="s.raw" class="mr-2" size="28" :user="s.raw" />
              </template>
              <template #title>
                <div class="d-flex align-center">
                  <span>{{ s.title }}</span>
                </div>
              </template>
              <template v-if="s?.raw?.fullName && s?.raw?.email" #subtitle>
                <span class="text-caption text-medium-emphasis">{{ s.raw.email }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Selected existing guardian info -->
        <v-card v-if="isGuardian && selectedGuardian" class="mt-3" variant="outlined">
          <v-card-text class="d-flex align-center">
            <UserAvatar class="mr-3" size="40" :user="selectedGuardian" />
            <div class="flex-grow-1 min-width-0">
              <div class="text-body-1 font-weight-medium text-truncate">{{ selectedGuardian.fullName || selectedGuardian.email }}</div>
              <div class="text-caption text-medium-emphasis text-truncate">{{ selectedGuardian.email }}</div>
            </div>
            <v-btn icon="mdi-close" size="small" variant="text" @click="clearSelectedGuardian" />
          </v-card-text>
        </v-card>
        <v-text-field
          v-if="!(isGuardian || localUser.role === 'guardian')"
          v-model="localUser.email"
          autofocus
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :label="$t('signUp.email') + ' *'"
          required
          :rules="emailRules"
          type="email"
          validate-on="input"
          variant="outlined"
          @blur="touchedFields.email = true"
        />
      </v-col>
      <v-col v-if="!(isGuardian && selectedGuardian)" :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="6">
        <v-text-field
          v-model="localUser.firstName"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :hint="$t('userManagement.nameHint')"
          :label="`${$t('signUp.firstName')} (${$t('optional')})`"
          persistent-hint
          variant="outlined"
          @blur="touchedFields.firstName = true"
        />
      </v-col>
      <v-col v-if="!(isGuardian && selectedGuardian)" :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="6">
        <v-text-field
          v-model="localUser.lastName"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :label="`${$t('signUp.lastName')} (${$t('optional')})`"
          variant="outlined"
          @blur="touchedFields.lastName = true"
        />
      </v-col>
      <v-col v-if="!(isGuardian && selectedGuardian)" :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" :cols="isGuardian ? 12 : 6">
        <v-select
          v-model="localUser.preferredLanguage"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :items="languageOptions"
          :label="$t('signUp.preferredLanguage') + ' *'"
          :menu-props="{ zIndex: dropdownZIndex }"
          variant="outlined"
          @blur="touchedFields.preferredLanguage = true"
        />
      </v-col>
      <v-col v-if="!isGuardian" :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="6">
        <v-select
          v-model="localUser.role"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          enterkeyhint="done"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :items="roleOptions"
          :label="$t('userManagement.role') + ' *'"
          :menu-props="{ zIndex: dropdownZIndex }"
          required
          :rules="roleRules"
          validate-on="input"
          variant="outlined"
          @blur="touchedFields.role = true"
        >
          <template #selection="{ item }">
            <div class="d-flex justify-space-between align-center w-100">
              <span>{{ item.title }}</span>
            </div>
          </template>
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #title>
                <div class="d-flex justify-space-between align-center w-100">
                  <span>{{ item.title }}</span>
                  <v-spacer />
                  <v-hotkey v-if="!$vuetify.display.mobile" class="text-caption text-disabled" :keys="getRoleShortcut(item.value)" />
                </div>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
  import UserAvatar from '@/components/users/UserAvatar.vue'
  import { useTeamStore } from '@/stores/team'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'UserForm',
    components: { UserAvatar },
    props: {
      user: {
        type: Object,
        required: false,
        default: () => ({
          email: '',
          firstName: '',
          lastName: '',
          preferredLanguage: 'en',
          role: 'athlete'
        })
      },
      formValid: {
        type: Boolean,
        default: false
      },
      dropdownZIndex: {
        type: Number,
        default: 30_000
      },
      isGuardian: {
        type: Boolean,
        default: false
      },
      isModal: {
        type: Boolean,
        default: false
      },
      athleteUser: {
        type: Object,
        default: null
      }
    },
    emits: ['update:user', 'update:formValid', 'keydown'],
    setup() {
      const userStore = useUserStore()
      const teamStore = useTeamStore()
      return { userStore, teamStore }
    },
    data() {
      return {
        isSyncingFromProp: false,
        localUser: {
          email: this.user?.email || '',
          firstName: this.user?.firstName || '',
          lastName: this.user?.lastName || '',
          preferredLanguage: this.user?.preferredLanguage || 'en',
          role: this.user?.role || 'athlete'
        },
        touchedFields: {
          email: false,
          firstName: false,
          lastName: false,
          preferredLanguage: false,
          role: false
        },
        emailSearch: '',
        emailSuggestions: [],
        selectedGuardian: null,
        emailMenu: false
      }
    },
    computed: {
      formValidProxy: {
        get() {
          return this.formValid
        },
        set(value: boolean) {
          this.$emit('update:formValid', value)
        }
      },
      defaultPreferredLanguage() {
        return this.userStore.user?.preferredLanguage || 'en'
      },
      isMac() {
        return navigator.platform.toUpperCase().includes('MAC')
      },
      modifierKey() {
        return this.isMac ? 'cmd' : 'ctrl'
      },
      roleOptions() {
        return [
          { title: this.$t('roles.admin'), value: 'admin' },
          { title: this.$t('roles.coach'), value: 'coach' },
          { title: this.$t('roles.athlete'), value: 'athlete' }
        ]
      },
      languageOptions() {
        return [
          { title: 'English', value: 'en' },
          { title: 'Suomi', value: 'fi' }
        ]
      },
      emailRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.email_required'),
          (v: string) => !this.touchedFields.email || !v || /.+@.+\..+/.test(v) || this.$t('signUp.errors.email_invalid')
        ]
      },
      roleRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.role_required')
        ]
      }
    },
    watch: {
      user: {
        deep: true,
        immediate: true,
        handler(newUser) {
          if (!newUser) return
          // Sync prop to local copy without emitting
          this.isSyncingFromProp = true
          this.localUser = {
            email: newUser.email || '',
            firstName: newUser.firstName || '',
            lastName: newUser.lastName || '',
            preferredLanguage: newUser.preferredLanguage || 'en',
            role: newUser.role || 'athlete'
          }
          this.$nextTick(() => {
            this.isSyncingFromProp = false
          })
        }
      },
      localUser: {
        deep: true,
        handler(newVal) {
          if (this.isSyncingFromProp) return
          this.$emit('update:user', { ...newVal })
        }
      },
      emailSearch(newVal) {
        if (!(this.isGuardian || this.localUser.role === 'guardian')) return
        const query = (newVal || '').trim().toLowerCase()
        if (query.length < 3) {
          this.emailSuggestions = []
          this.emailMenu = false
          return
        }
        const teamUsers = this.teamStore.teamUsers
        // Get team users from current team in user store if available
        const list = teamUsers || []

        const athleteId = (this.user && (this.user.userId || this.user.id)) ? (this.user.userId || this.user.id) : null
        // Filter by query (email or name) and exclude existing guardians of the athlete
        const filtered = list.filter(u => {
          // Exclude if already a guardian of the target athlete
          if (athleteId && Array.isArray(u.roles)) {
            const isGuardianOfAthlete = u.roles.some(r => r && r.role === 'guardian' && r.guardianOf === athleteId)
            if (isGuardianOfAthlete) return false
          }
          // Exclude the athlete themself
          if ((u.userId || u.id) === athleteId) return false
          // Exclude users who have athlete role only
          if (Array.isArray(u.roles) && u.roles.length > 0) {
            const hasNonAthleteRole = u.roles.some(r => r && r.role !== 'athlete')
            if (!hasNonAthleteRole) return false
          }

          const emailLc = (u.email || '').toLowerCase()
          const firstLc = (u.firstName || '').toLowerCase()
          const lastLc = (u.lastName || '').toLowerCase()
          const fullLc = `${firstLc} ${lastLc}`.trim()
          return (
            emailLc.includes(query) ||
            firstLc.includes(query) ||
            lastLc.includes(query) ||
            fullLc.includes(query)
          )
        })

        // Dedupe by email and map to items
        const seen = new Set()
        const items = []
        for (const u of filtered) {
          const email = u.email || ''
          if (!email || seen.has(email)) continue
          seen.add(email)
          items.push({ title: u.fullName ? `${u.fullName} <${u.email}>` : u.email, value: u.email, raw: u })
        }

        this.emailSuggestions = items.slice(0, 6)
        this.emailMenu = this.emailSuggestions.length > 0
      }
    },
    mounted() {
      // Set default preferred language if not already set or if it's the default 'en'
      if (!this.localUser.preferredLanguage || this.localUser.preferredLanguage === 'en') {
        this.localUser = {
          ...this.localUser,
          preferredLanguage: this.defaultPreferredLanguage
        }
      }

      // Add document-level keydown listener for role shortcuts
      document.addEventListener('keydown', this.handleKeydown)
    },
    beforeUnmount() {
      // Remove document-level keydown listener
      document.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
      handleGuardianSelection(email) {
        if (!email) return
        const found = (this.emailSuggestions || []).find(s => s.value === email)
        this.selectedGuardian = found?.raw || null
      },
      onGuardianEnter(event) {
        // Prevent submitting arbitrary email; only accept when selection exists
        if (!this.selectedGuardian) {
          event.preventDefault()
          event.stopPropagation()
        }
      },
      onGuardianKeydown(event) {
        const key = event.key?.toLowerCase()
        // Enter: select the first suggestion if none selected yet
        if (key === 'enter') {
          if (!this.selectedGuardian && this.emailSuggestions.length > 0) {
            this.selectGuardianSuggestion(this.emailSuggestions[0])
          }
        }
      },
      onGuardianEmailInput() {
        this.emailSearch = this.localUser.email
      },
      onGuardianEmailFocus() {
        if ((this.emailSearch || '').length >= 3 && this.emailSuggestions.length > 0) {
          this.emailMenu = true
        }
      },
      selectGuardianSuggestion(s) {
        this.localUser.email = s.value
        this.selectedGuardian = s.raw || null
        this.emailMenu = false
      },
      clearSelectedGuardian() {
        this.selectedGuardian = null
        this.localUser.email = ''
        this.emailSearch = ''
      },
      handleKeydown(event) {
        // Handle role shortcuts only for non-guardian forms
        if (!this.isGuardian && (event.metaKey || event.ctrlKey)) {
          const key = event.key.toLowerCase()
          if (key === 'a') {
            event.preventDefault()
            event.stopPropagation()
            this.selectRole('athlete')
            return
          }
          if (key === 'c') {
            event.preventDefault()
            event.stopPropagation()
            this.selectRole('coach')
            return
          }
          if (key === 'm') {
            event.preventDefault()
            event.stopPropagation()
            this.selectRole('admin')
            return
          }
        }

        // For guardian forms, emit the event so parent can handle it
        if (this.isGuardian) {
          this.$emit('keydown', event)
        }
      },
      selectRole(role) {
        if (!this.isGuardian) {
          this.localUser = { ...this.localUser, role }
        }
      },
      resetForm() {
        this.touchedFields = {
          email: false,
          firstName: false,
          lastName: false,
          preferredLanguage: false,
          role: false
        }
        this.$refs.form?.resetValidation()
      },
      async validate() {
        // Mark fields as touched so rules that depend on it will run
        this.touchedFields = {
          email: true,
          firstName: true,
          lastName: true,
          preferredLanguage: true,
          role: true
        }
        await this.$nextTick()
        const result = await this.$refs.form?.validate()
        return typeof result === 'object' ? result?.valid : result
      },
      resetValidation() {
        this.$refs.form?.resetValidation()
      },
      getFormValid() {
        return this.formValid
      },
      getRoleShortcut(role) {
        const shortcuts = {
          athlete: `${this.modifierKey}+a`,
          coach: `${this.modifierKey}+c`,
          admin: `${this.modifierKey}+m`
        }
        return shortcuts[role] || ''
      }
    }
  }
</script>

<style scoped>
/* Mobile-specific compact styling */
@media (max-width: 960px) {
  /* Make form fields more compact */
  :deep(.v-field) {
    min-height: 40px !important;
  }

  :deep(.v-field__input) {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }

  :deep(.v-label) {
    font-size: 0.9rem !important;
  }
}
</style>
