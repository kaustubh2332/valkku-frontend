<template>
  <v-menu
    :close-on-content-click="false"
    location="top"
    :offset="4"
    :open-delay="200"
    open-on-hover
  >
    <template #activator="{ props }">
      <v-card
        v-bind="props"
        class="event-card"
        :class="eventCardClass"
        :color="baseColor"
        :elevation="isYearView ? 0 : 2"
        variant="flat"
      >
        <!-- Year view: just a colored box -->
        <div v-if="isYearView" class="year-event" />

        <!-- Mobile month view: start time and title -->
        <v-card-text v-else-if="shouldShowStartTimeOnly" class="pa-1">
          <div class="text-caption font-weight-medium text-white mb-1">
            {{ startTime }}
          </div>
          <div class="text-caption text-white text-truncate">
            {{ title }}
          </div>
        </v-card-text>

        <!-- Regular view: full display -->
        <v-card-text v-else class="pa-2">
          <div class="d-flex justify-space-between align-center mb-2">
            <v-chip
              v-if="durationText"
              color="white"
              label
              size="x-small"
              variant="tonal"
            >
              {{ durationText }}
            </v-chip>
          </div>
          <div class="text-body-2 font-weight-medium text-white text-truncate" :title="title">
            {{ title }}
          </div>
        </v-card-text>
      </v-card>
    </template>

    <v-card elevation="8" min-width="240">
      <v-card-text class="pa-4">
        <div class="text-h6 font-weight-medium mb-2">{{ title }}</div>

        <div v-if="durationText" class="text-body-2 text-medium-emphasis mb-2">
          <v-icon class="mr-1" size="small">mdi-clock-outline</v-icon>
          {{ durationText }}
        </div>

        <div v-if="typeLabel" class="mb-2">
          <v-chip
            :color="typeColor"
            label
            size="small"
            variant="tonal"
          >
            {{ typeLabel }}
          </v-chip>
        </div>

        <div v-if="locationName" class="text-body-2 text-medium-emphasis">
          <v-icon class="mr-1" size="small">mdi-map-marker-outline</v-icon>
          {{ locationName }}
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
  export default {
    name: 'CalendarEventCard',
    props: {
      event: {
        type: Object,
        required: true
      },
      view: {
        type: String,
        default: 'dayGridMonth'
      }
    },
    data() {
      return {
        windowWidth: window.innerWidth
      }
    },
    computed: {
      isYearView() {
        return this.view === 'multiMonthYear'
      },
      isMobile() {
        return this.windowWidth <= 768
      },
      isMonthView() {
        return this.view === 'dayGridMonth'
      },
      shouldShowStartTimeOnly() {
        return this.isMobile && this.isMonthView && !this.isYearView
      },
      title() {
        return this.event?.title || ''
      },
      locationName() {
        const ext = this.event?.extendedProps || {}
        return ext.locationName || ext.location || ''
      },
      typeLabel() {
        const ext = this.event?.extendedProps || {}
        const raw = (ext.type || ext.typeLabel || '').toString().toLowerCase()
        const map = {
          practise: this.$t('events.practise'),
          match: this.$t('events.match'),
          meeting: this.$t('events.meeting'),
          self_training: this.$t('events.self_directed_training'),
          other_event: this.$t('events.other_event')
        }
        return map[raw] || (raw || '')
      },
      typeColor() {
        const ext = this.event?.extendedProps || {}
        const raw = (ext.type || ext.typeLabel || '').toString().toLowerCase()
        const colorMap = {
          practise: '#1e88e5',
          match: '#e53935',
          meeting: '#8e24aa',
          self_training: '#43a047',
          other_event: 'grey'
        }
        return colorMap[raw] || this.baseColor
      },
      durationText() {
        const ext = this.event?.extendedProps || {}
        const ownDuration = Number(ext.durationInMins)
        if (Number.isFinite(ownDuration) && ownDuration > 0) {
          return `${ownDuration} min`
        }

        const start = this.event?.start
        const end = this.event?.end
        if (start && end) {
          const fmt = (d) => {
            const hh = String(new Date(d).getHours()).padStart(2, '0')
            const mm = String(new Date(d).getMinutes()).padStart(2, '0')
            return `${hh}:${mm}`
          }
          return `${fmt(start)}-${fmt(end)}`
        }
        return ''
      },
      startTime() {
        const ext = this.event?.extendedProps || {}
        const start = this.event?.start
        if (start) {
          const date = new Date(start)
          const hh = String(date.getHours()).padStart(2, '0')
          const mm = String(date.getMinutes()).padStart(2, '0')
          return `${hh}:${mm}`
        }
        return ''
      },
      baseColor() {
        const c = (this.event && (this.event.backgroundColor || this.event.color)) || ''
        if (typeof c === 'string' && c.trim()) return c
        const t = String((this.event?.extendedProps && this.event.extendedProps.type) || '').toLowerCase()
        const map = {
          practise: '#2563eb',
          match: '#ef4444',
          meeting: '#8b5cf6',
          self_training: '#10b981',
          other_event: '#64748b'
        }
        return map[t] || '#0ea5e9'
      },
      eventCardClass() {
        return {
          'year-view': this.isYearView,
          'mobile-view': this.shouldShowStartTimeOnly
        }
      }
    },
    mounted() {
      window.addEventListener('resize', this.handleResize)
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.handleResize)
    },
    methods: {
      handleResize() {
        this.windowWidth = window.innerWidth
      },
      shadeColor(hex, percent) {
        try {
          const h = hex.replace('#', '')
          const num = Number.parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16)
          let r = (num >> 16) & 0xff
          let g = (num >> 8) & 0xff
          let b = num & 0xff
          const amt = Math.round(2.55 * percent)
          r = Math.min(255, Math.max(0, r + amt))
          g = Math.min(255, Math.max(0, g + amt))
          b = Math.min(255, Math.max(0, b + amt))
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
        } catch {
          return hex
        }
      }
    }
  }
</script>

<style scoped>
/* Event card styling */
.event-card {
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Year view - minimal colored box */
.event-card.year-view {
  min-height: 8px;
  height: 8px;
}

.year-event {
  width: 100%;
  height: 100%;
  border-radius: 2px;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .event-card {
    border-radius: 4px;
  }
}

@media (max-width: 480px) {
  .event-card {
    border-radius: 2px;
  }
}
</style>
