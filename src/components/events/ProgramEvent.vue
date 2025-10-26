<template>
  <v-card
    class="mb-3"
  >
    <!-- Event Header -->
    <div
      class="pa-5 pb-3"
      style="cursor: pointer;"
      :style="{ borderLeft: `0px solid ${eventTypeColor}` }"
      @click="navigateToEvent"
    >
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="text-h6 text-truncate">
          {{ event.title }}
        </div>
        <v-chip
          v-if="event.type"
          :color="eventTypeColor"
          size="small"
          variant="tonal"
        >
          <v-icon
            size="small"
          >
            {{ eventTypeIcon }}
          </v-icon>
          <span v-if="!$vuetify.display.mobile" class="ml-1">
            {{ eventTypeLabel }}
          </span>
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
  import { useEventStore } from '@/stores/event'
  import { getEventTypeColor, getEventTypeIcon, getEventTypeLabel } from '@/utils/eventTypes'
  import CreatePlan from './CreatePlan.vue'

  export default {
    name: 'ProgramEvent',
    components: {
      CreatePlan
    },
    emits: ['open-event'],
    props: {
      event: {
        type: Object,
        required: true
      }
    },
    setup() {
      const eventStore = useEventStore()
      return { eventStore }
    },
    computed: {
      eventTypeColor(): string {
        return getEventTypeColor(this.event.type)
      },
      eventTypeIcon(): string {
        return getEventTypeIcon(this.event.type)
      },
      eventTypeLabel(): string {
        return getEventTypeLabel(this.event.type, this.$t)
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
    },
    methods: {
      navigateToEvent() {
        if (this.$vuetify.display.mobile) {
          this.$emit('open-event', this.event)
          return
        }
        const route = this.eventStore.buildEventRoute(this.event)
        this.$router.push(route)
      }
    },
  }
</script>
