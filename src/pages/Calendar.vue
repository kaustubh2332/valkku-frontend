<template>
  <div>
    <div class="text-h4 mt-4 mb-8">
      {{ $t('calendar.title') }}
    </div>

    <div>
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
      >
        <template #eventContent="data">
          <CalendarEventCard
            :data="data"
            :event="data.event"
          />
        </template>
      </FullCalendar>

      <!-- Loading overlay -->
      <v-overlay
        class="align-center justify-center"
        contained
        :model-value="loading"
        persistent
      >
        <v-progress-circular
          color="primary"
          indeterminate
          size="32"
          width="3"
        />
      </v-overlay>
    </div>
  </div>
</template>

<script lang="ts">
  import fiLocale from '@fullcalendar/core/locales/fi';
  import dayGridPlugin from '@fullcalendar/daygrid'
  import interactionPlugin from '@fullcalendar/interaction'
  import multimonthPlugin from '@fullcalendar/multimonth'
  import timeGridPlugin from '@fullcalendar/timegrid'
  import FullCalendar from '@fullcalendar/vue3'
  import { useI18n } from 'vue-i18n'
  import CalendarEventCard from '@/components/calendar/CalendarEventCard.vue'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Calendar',
    components: { FullCalendar, CalendarEventCard },
    setup() {
      const { locale } = useI18n()
      const userStore = useUserStore()
      return { locale, userStore }
    },
    data() {
      return {
        events: [],
        loading: false,
        calendarOptions: {
          plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multimonthPlugin],
          initialView: 'dayGridMonth',
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay'
          },
          locale: (this.locale && typeof this.locale === 'string' && this.locale === 'fi') ? fiLocale : null,
          firstDay: (this.locale && typeof this.locale === 'string' && this.locale === 'fi') ? 1 : 0,
          events: [],
          height: 'auto',
          slotMinTime: '06:00:00',
          slotMaxTime: '23:00:00',
        }
      }
    },
    computed: {
      dateLocale() {
        const appLocale = this.$i18n?.locale || 'en'
        const localeMap = {
          'en': 'en',
          'fi': 'fi'
        }
        return localeMap[appLocale] || 'en'
      },
      dateFirstDayOfWeek() {
        return this.$i18n?.locale === 'fi' ? 1 : 0
      }
    },
    mounted() {
      // Fetch events for initial visible range
      this.$nextTick(() => {
        try {
          const apiCal = (this.$refs.calendarRef as any)?.getApi?.()
          const start = apiCal?.view?.currentStart
          const end = apiCal?.view?.currentEnd
          if (start && end) {
            this.fetchEventsForRange(start, end)
          }
          // Hook into range changes
          this.calendarOptions.datesSet = (info) => this.onDatesSet(info)
        } catch {}
      })
    },
    methods: {
      escapeHtml(str) {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
      },
      getDurationMinutes(start, end) {
        if (!(start && end)) return 0
        const ms = new Date(end).getTime() - new Date(start).getTime()
        return Math.max(0, Math.round(ms / 60_000))
      },
      onDatesSet(info) {
        this.fetchEventsForRange(info.start, info.end)
      },
      fetchEventsForRange(startDate, endDate) {
        if (!this.userStore.currentTeamId) return
        this.loading = true

        const startDateStr = this.formatYMD(startDate)
        const endDateStr = this.formatYMD(endDate)

        api.get(`/event/team/${this.userStore.currentTeamId}`, {
          params: { startDate: startDateStr, endDate: endDateStr }
        })
          .then((res) => {
            console.log(res.data.data)
            const list = res?.data?.data || []
            this.events = Array.isArray(list) ? list.map((e) => this.mapBackendEventToCalendar(e)) : []

            // Inject into FullCalendar
            const apiCal = (this.$refs.calendarRef as any)?.getApi?.()
            if (apiCal) {
              apiCal.removeAllEvents()
              if (this.events.length > 0) {
                apiCal.addEventSource(this.events)
              }
            }
          })
          .catch((error) => {
            console.error('Failed to fetch events:', error)
          })
          .finally(() => {
            this.loading = false
          })
      },
      mapBackendEventToCalendar(ev) {
        const startSec = Number(ev.startTimeUnixSec)
        const endSec = Number(ev.endTimeUnixSec)
        const hasUnixTimes = Number.isFinite(startSec) && Number.isFinite(endSec) && startSec > 0 && endSec > 0

        let startIso
        let endIso
        let allDay = false

        if (hasUnixTimes) {
          // Event has explicit start/end times
          startIso = new Date(startSec * 1000).toISOString()
          endIso = new Date(endSec * 1000).toISOString()
          allDay = false
        } else if (ev.eventDate) {
          // All-day event: use date-only strings (YYYY-MM-DD)
          const raw = String(ev.eventDate)
          const ymd = raw.includes('T') ? raw.slice(0, 10) : this.formatYMD(raw)
          if (ymd && ymd.length === 10) {
            startIso = ymd
            // end is next day (exclusive) also as Y-M-D
            const [y, m, d] = ymd.split('-').map(Number)
            if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
              const nd = new Date(y, m - 1, d)
              nd.setDate(nd.getDate() + 1)
              const yy = nd.getFullYear()
              const mm = String(nd.getMonth() + 1).padStart(2, '0')
              const dd = String(nd.getDate()).padStart(2, '0')
              endIso = `${yy}-${mm}-${dd}`
            }
            allDay = true
          }
        }

        const colorMap = {
          practise: '#1e88e5',
          match: '#e53935',
          meeting: '#8e24aa',
          self_training: '#43a047',
          other_event: 'grey'
        }

        return {
          id: ev.id || `${startIso}-${endIso}`,
          title: ev.title || '',
          start: startIso,
          end: endIso,
          allDay: allDay,
          color: colorMap[ev.type] || undefined,
          extendedProps: {
            type: ev.type,
            typeLabel: ev.type,
            locationName: ev.locationName || ev.location?.name,
            likes: ev.likes,
            dislikes: ev.dislikes,
            durationInMins: ev.durationInMinutes ?? ev.durationInMins
          }
        }
      },
      formatYMD(dateLike) {
        const d = new Date(dateLike)
        if (Number.isNaN(d.getTime())) return ''
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const da = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${da}`
      }
    }
  }
</script>
