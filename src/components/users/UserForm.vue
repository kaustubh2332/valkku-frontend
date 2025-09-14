<template>
  <v-form
    ref="form"
    v-model="formValid"
    class="mt-4"
    @keydown="handleKeydown"
  >
    <v-row>
      <v-col :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="12" :md="6">
        <v-text-field
          v-model="localUser.firstName"
          v-enterkeyhint="'next'"
          autofocus
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :label="$t('signUp.firstName')"
          required
          :rules="firstNameRules"
          type="text"
          validate-on="input"
          variant="outlined"
          @blur="touchedFields.firstName = true"
        />
      </v-col>
      <v-col :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="12" :md="6">
        <v-text-field
          v-model="localUser.lastName"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          enterkeyhint="next"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :label="$t('signUp.lastName')"
          required
          :rules="lastNameRules"
          validate-on="input"
          variant="outlined"
          @blur="touchedFields.lastName = true"
        />
      </v-col>
      <v-col :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="12">
        <v-text-field
          v-model="localUser.email"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          enterkeyhint="next"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :label="$t('signUp.email')"
          required
          :rules="emailRules"
          type="email"
          validate-on="input"
          variant="outlined"
          @blur="touchedFields.email = true"
        />
      </v-col>
      <v-col :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="12" :md="6">
        <v-select
          v-model="localUser.preferredLanguage"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          enterkeyhint="next"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :items="languageOptions"
          :label="$t('signUp.preferredLanguage')"
          :menu-props="{ zIndex: 30000 }"
          required
          :rules="languageRules"
          validate-on="input"
          variant="outlined"
          @blur="touchedFields.preferredLanguage = true"
        />
      </v-col>
      <v-col v-if="!guardian" :class="{ 'pa-2': $vuetify.display.mobile, 'pa-3': !$vuetify.display.mobile }" cols="12" :md="6">
        <v-select
          v-model="localUser.role"
          :density="$vuetify.display.mobile ? 'compact' : 'default'"
          enterkeyhint="done"
          :hide-details="$vuetify.display.mobile ? 'auto' : false"
          :items="roleOptions"
          :label="$t('userManagement.role')"
          :menu-props="{ zIndex: 30000 }"
          required
          :rules="roleRules"
          validate-on="input"
          variant="outlined"
          @blur="touchedFields.role = true"
        />
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
  export default {
    name: 'UserForm',
    props: {
      user: {
        type: Object,
        required: true,
        default: () => ({
          firstName: '',
          lastName: '',
          email: '',
          preferredLanguage: 'en',
          role: 'athlete'
        })
      },
      guardian: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:user', 'update:formValid', 'keydown'],
    data() {
      return {
        formValid: false,
        touchedFields: {
          firstName: false,
          lastName: false,
          email: false,
          preferredLanguage: false,
          role: false
        }
      }
    },
    computed: {
      localUser: {
        get() {
          return this.user
        },
        set(value) {
          this.$emit('update:user', value)
        }
      },
      languageOptions() {
        return [
          { title: 'English', value: 'en' },
          { title: 'Suomi', value: 'fi' }
        ]
      },
      roleOptions() {
        return [
          { title: this.$t('roles.admin'), value: 'admin' },
          { title: this.$t('roles.coach'), value: 'coach' },
          { title: this.$t('roles.athlete'), value: 'athlete' },
          { title: this.$t('roles.guardian'), value: 'guardian' },
        ]
      },
      firstNameRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.firstName_required'),
          (v: string) => !this.touchedFields.firstName || !v || v.length >= 2 || this.$t('signUp.errors.firstName_min_length')
        ]
      },
      lastNameRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.lastName_required'),
          (v: string) => !this.touchedFields.lastName || !v || v.length >= 2 || this.$t('signUp.errors.lastName_min_length')
        ]
      },
      emailRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.email_required'),
          (v: string) => !this.touchedFields.email || !v || /.+@.+\..+/.test(v) || this.$t('signUp.errors.email_invalid')
        ]
      },
      languageRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.language_required')
        ]
      },
      roleRules() {
        return [
          (v: string) => !!v || this.$t('signUp.errors.role_required')
        ]
      }
    },
    methods: {
      handleKeydown(event) {
        this.$emit('keydown', event)
      },
      resetForm() {
        this.touchedFields = {
          firstName: false,
          lastName: false,
          email: false,
          preferredLanguage: false,
          role: false
        }
        this.$refs.form?.resetValidation()
      },
      validate() {
        return this.$refs.form?.validate()
      },
      resetValidation() {
        this.$refs.form?.resetValidation()
      },
      getFormValid() {
        return this.formValid
      }
    },
    watch: {
      formValid(newVal) {
        this.$emit('update:formValid', newVal)
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
