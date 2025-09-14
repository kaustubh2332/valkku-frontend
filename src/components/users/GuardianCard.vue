<template>
  <v-card
    class="guardian-card"
    :class="{ 'guardian-card--mobile': $vuetify.display.mobile }"
  >
    <v-card-text class="d-flex align-center justify-space-between pa-3">
      <div class="guardian-info">
        <div class="guardian-name">
          {{ guardian.firstName }} {{ guardian.lastName }}
        </div>
        <div class="guardian-email text-caption text-medium-emphasis">
          {{ guardian.email }}
        </div>
        <div class="guardian-language text-caption text-medium-emphasis">
          {{ getLanguageName(guardian.preferredLanguage) }}
        </div>
      </div>
      <v-btn
        color="error"
        icon="mdi-close"
        size="small"
        variant="text"
        @click="$emit('remove')"
      />
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
  export default {
    name: 'GuardianCard',
    props: {
      guardian: {
        type: Object,
        required: true
      }
    },
    emits: ['remove'],
    methods: {
      getLanguageName(languageCode) {
        const languageMap = {
          'en': 'English',
          'fi': 'Suomi'
        }
        return languageMap[languageCode] || languageCode
      }
    }
  }
</script>

<style scoped>
.guardian-card {
  margin-bottom: 8px;
}

.guardian-card--mobile {
  margin-bottom: 6px;
}

.guardian-name {
  font-weight: 500;
  font-size: 0.95rem;
  line-height: 1.2;
}

.guardian-email {
  margin-top: 2px;
  font-size: 0.8rem;
}

.guardian-language {
  margin-top: 1px;
  font-size: 0.75rem;
}

/* Mobile-specific styling */
@media (max-width: 960px) {
  .guardian-name {
    font-size: 0.9rem;
  }

  .guardian-email {
    font-size: 0.75rem;
  }

  .guardian-language {
    font-size: 0.7rem;
  }
}
</style>
