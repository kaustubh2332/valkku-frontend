<template>
  <v-card
    class="mb-6"
    elevation="2"
    rounded="xl"
  >
    <!-- Event Header -->
    <div class="pa-5 pb-3">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-h6 font-weight-bold">
          {{ event.title }}
        </div>
        <v-chip
          v-if="event.type"
          size="small"
          variant="tonal"
        >
          <v-icon
            class="mr-1"
            size="small"
          >
            {{ eventTypeIcon }}
          </v-icon>
          {{ eventTypeLabel }}
        </v-chip>
      </div>

      <!-- Event metadata -->
      <div class="d-flex flex-wrap ga-3 text-body-2 text-medium-emphasis">
        <div
          v-if="event.durationInMinutes"
          class="d-flex align-center"
        >
          <v-icon
            class="mr-1"
            size="small"
          >
            mdi-clock-outline
          </v-icon>
          {{ event.durationInMinutes }} {{ $t('events.minutes') }}
        </div>
        <div
          v-if="eventDate"
          class="d-flex align-center"
        >
          <v-icon
            class="mr-1"
            size="small"
          >
            mdi-calendar
          </v-icon>
          {{ eventDate }}
        </div>
        <div
          v-if="eventTime"
          class="d-flex align-center"
        >
          <v-icon
            class="mr-1"
            size="small"
          >
            mdi-clock
          </v-icon>
          {{ eventTime }}
        </div>
      </div>
    </div>

    <!-- Event notes if present -->
    <div
      v-if="event.notes"
      class="px-5 pb-3"
    >
      <div class="text-caption text-uppercase text-medium-emphasis mb-1">
        {{ $t('events.notes') }}
      </div>
      <div class="text-body-2" v-html="event.notes" />
    </div>

    <!-- Plan Section -->
    <div v-if="event.plan">
      <v-divider />
      <div class="pa-5">
        <CreatePlan :plan="event.plan" />
      </div>
    </div>
  </v-card>
</template>

<script lang="ts">
  import CreatePlan from './CreatePlan.vue'

  export default {
    name: 'ProgramEvent',
    components: {
      CreatePlan
    },
    props: {
      event: {
        type: Object,
        required: true
      }
    },
    computed: {
      eventTypeIcon(): string {
        const iconMap: Record<string, string> = {
          game: 'mdi-trophy',
          team_training: 'mdi-account-group',
          self_training: 'mdi-run',
          meeting: 'mdi-account-multiple',
          other: 'mdi-calendar-blank'
        }
        return iconMap[this.event.type] || 'mdi-calendar-blank'
      },
      eventTypeLabel(): string {
        const labelMap: Record<string, string> = {
          game: this.$t('events.game'),
          team_training: this.$t('events.team_training'),
          self_training: this.$t('events.self_directed_training'),
          meeting: this.$t('events.meeting'),
          other: this.$t('events.other')
        }
        return labelMap[this.event.type] || this.$t('events.other')
      },
      eventDate(): string {
        if (!this.event.eventDate) return ''
        const date = new Date(this.event.eventDate)
        const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
        return new Intl.DateTimeFormat(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date)
      },
      eventTime(): string {
        if (!this.event.startTimeUnixSec) return ''
        const date = new Date(this.event.startTimeUnixSec * 1000)
        const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit'
        }).format(date)
      }
    }
  }
</script>
