<template>
  <v-container>
    <div class="text-h4 my-4">
      {{ $t('settings.title') }}
    </div>

    <!-- Language Settings -->
    <v-card
      class="mb-4"
      variant="outlined"
    >
      <v-card-text class="pa-6">
        <div class="text-h6 mb-4">
          <v-icon class="me-2">mdi-translate</v-icon>
          {{ $t('settings.language') }}
        </div>
        <v-radio-group
          v-model="selectedLanguage"
          @update:model-value="setLocale"
        >
          <v-radio
            :label="$t('language.english')"
            value="en"
          />
          <v-radio
            :label="$t('language.finnish')"
            value="fi"
          />
        </v-radio-group>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'

  export default {
    name: 'Settings',
    setup() {
      const { user } = useAuth0()
      return { user }
    },
    data() {
      return {
        selectedLanguage: this.$i18n.locale
      }
    },
    methods: {
      setLocale(locale: string) {
        this.$i18n.locale = locale
        localStorage.setItem('locale', locale)
      }
    }
  }
</script>
