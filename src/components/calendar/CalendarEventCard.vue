<template>
  <v-menu
    :close-on-content-click="false"
    location="top"
    :offset="4"
    :open-delay="200"
    open-on-hover
  >
    <template #activator="{ props }">
      <div
        class="event-card"
        :class="{ 'year-view': isYearView }"
        :style="styleVars"
        v-bind="props"
      >
        <!-- Year view: just a colored box -->
        <div v-if="isYearView" class="year-event">
          <!-- Just a colored box, no text -->
        </div>

        <!-- Mobile month view: start time and title -->
        <div v-else-if="shouldShowStartTimeOnly" class="mobile-month-event">
          <div class="mobile-start-time">{{ startTime }}</div>
          <div class="mobile-title">{{ title }}</div>
        </div>

        <!-- Regular view: full display -->
        <div v-else>
          <div class="top-row">
            <span v-if="durationText" class="pill duration">{{ durationText }}</span>
          </div>
          <div class="title" :title="title">{{ title }}</div>
        </div>
      </div>
    </template>
    <v-card elevation="6" min-width="220">
      <v-card-text class="py-3">
        <strong class="evt-tt-title text-truncate">{{ title }}</strong>
        <div v-if="durationText" class="evt-tt-line">{{ durationText }}</div>
        <div v-if="typeLabel" class="evt-tt-line mt-2">
          <v-chip
            class="evt-tt-chip"
            :color="typeColor"
            label
            size="small"
            variant="tonal"
          >
            {{ typeLabel }}
          </v-chip>
        </div>
        <div v-if="locationName" class="evt-tt-line">{{ locationName }}</div>
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
      styleVars() {
        const base = this.baseColor
        const lighter = this.shadeColor(base, 10)
        const darker = this.shadeColor(base, -8)
        const border = this.shadeColor(base, -14)
        const glow = this.shadeColor(base, 12)
        return {
          '--evt-base': base,
          '--evt-light': lighter,
          '--evt-dark': darker,
          '--evt-border': border,
          '--evt-glow': glow
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
.event-card {
  position: relative;
  background: linear-gradient(135deg, var(--evt-dark), var(--evt-base) 60%, var(--evt-light));
  color: #f5fbff;
  border-radius: 10px;
  border: 1px solid var(--evt-border);
  padding: 8px 10px;
  line-height: 1.25;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset;
  width: 100%;
  height: 100%;
}

/* Desktop improvements */
@media (min-width: 769px) {
  .event-card {
    padding: 12px 14px !important;
    border-radius: 12px !important;
  }

  .title {
    font-size: 15px !important;
    line-height: 1.4 !important;
  }

  .pill {
    font-size: 13px !important;
    padding: 4px 10px !important;
  }
}

/* Mobile padding reduction */
@media (max-width: 768px) {
  .event-card {
    padding: 2px 4px !important;
    border-radius: 4px !important;
  }

  .event-card.year-view {
    padding: 0 !important;
  }
}

@media (max-width: 480px) {
  .event-card {
    padding: 1px 2px !important;
    border-radius: 2px !important;
  }

  .mobile-month-event {
    padding: 0px 1px !important;
  }
}
.event-card::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 10px;
  box-shadow: 0 0 22px 0 var(--evt-glow);
  opacity: 0.18;
  pointer-events: none;
}
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.pill {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(2px);
}
.pill.type { text-transform: capitalize; }
.title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}
.meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #eaf4ff;
  opacity: 0.9;
  font-size: 11px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.8);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.12);
}
.reactions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.like, .dislike {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.icon.like { color: #86efac; }
.icon.dislike { color: #f87171; }
.count { color: #ffffff; }

/* Year view styles - just a colored box */
.event-card.year-view {
  padding: 0;
  min-height: 8px;
  height: 8px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.year-event {
  width: 100%;
  height: 100%;
  border-radius: 2px;
}

/* Mobile month view styles */
.mobile-month-event {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1px 2px;
  gap: 0px;
  overflow: hidden;
}

.mobile-start-time {
  font-size: 9px;
  font-weight: 600;
  color: white;
  text-align: left;
  line-height: 1;
  opacity: 0.9;
  white-space: nowrap;
}

.mobile-title {
  font-size: 8px;
  font-weight: 500;
  color: white;
  text-align: left;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
  width: 100%;
  word-wrap: break-word;
}
</style>
