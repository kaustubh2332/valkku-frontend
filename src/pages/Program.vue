<template>
  <div class="program-page">
    <div class="text-h4 mt-4 mb-2">
      {{ $t('program.title') }}
    </div>
    <!-- Sticky Header -->
    <div class="sticky-header">
      <div class="py-4 py-md-6">
        <v-row>
          <v-col
            cols="12"
            lg="12"
            md="12"
            xl="12"
          >
            <!-- Calendar-like header -->
            <v-card elevation="2">
              <v-card-text class="pa-4 pa-md-6">
                <!-- Month Navigation -->
                <div class="d-flex align-center justify-space-between mb-4">
                  <div class="d-flex align-center ga-2">
                    <v-btn
                      icon="mdi-chevron-left"
                      size="small"
                      variant="text"
                      @click="goPrevWeek"
                    />
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-calendar-today"
                      size="small"
                      variant="text"
                      @click="goToToday"
                    >
                      {{ $t('program.today') }}
                    </v-btn>
                  </div>
                  <h3 class="text-h6 text-center flex-grow-1">
                    {{ monthLabel }}
                  </h3>
                  <v-btn
                    icon="mdi-chevron-right"
                    size="small"
                    variant="text"
                    @click="goNextWeek"
                  />
                </div>

                <!-- Week Days -->
                <div class="d-flex justify-space-between align-center">
                  <v-hover
                    v-for="d in weekDays"
                    :key="d.iso"
                    v-slot="{ isHovering, props }"
                  >
                    <div
                      v-bind="props"
                      class="text-center day-item"
                      @click="selectDate(d.date)"
                      @mouseenter="onDayHover(d.iso)"
                    >
                      <div class="text-caption text-medium-emphasis mb-2 font-weight-medium">
                        {{ d.weekdayShort }}
                      </div>
                      <v-badge
                        color="success"
                        dot
                        location="bottom end"
                        :model-value="d.hasDot"
                        offset-x="2"
                        offset-y="2"
                      >
                        <v-avatar
                          :class="{ 'today-highlight': d.isToday && (!selectedDate || !isSameDay(d.date, selectedDate)) }"
                          :color="selectedDate && isSameDay(d.date, selectedDate) ? 'primary' : undefined"
                          :elevation="isHovering ? 4 : 0"
                          :size="$vuetify.display.xs ? 32 : 44"
                          :variant="selectedDate && isSameDay(d.date, selectedDate) ? 'flat' : 'outlined'"
                        >
                          <span :class="$vuetify.display.xs ? 'text-body-2 font-weight-medium' : 'text-body-1 font-weight-medium'">{{ d.day }}</span>
                        </v-avatar>
                      </v-badge>
                    </div>
                  </v-hover>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Swipeable Content -->
    <v-row class="swipe-container">
      <v-col cols="12">
        <!-- DateSwipePager with per-day page components -->
        <!-- Use swipeDate for smoother transitions, selectedDate for header -->
        <DateSwipePager
          :key="pagerKey"
          :current-date="swipeDate || selectedDate"
          :prefetched-data="prefetchedByIso"
          @date-change="onSwipeDateChange"
        >
          <template #page="{ date, events, loading: pageLoading }">
            <ProgramDay
              :date="date"
              :events="events"
              :loading="pageLoading"
              @open-event="openEventFromProgram"
            />
          </template>
        </DateSwipePager>
      </v-col>
    </v-row>

    <!-- Mobile Event Details Modal -->
    <BottomSheetModal
      v-model="eventDetailsModal"
      :title="$t('events.event')"
    >
      <Event
        v-if="eventDetailsModal && openedEventId"
        :embedded="true"
        :event-id="openedEventId"
        :recurrence-date="openedRecurrenceDate"
        @close="eventDetailsModal = false"
      />
    </BottomSheetModal>
  </div>
</template>

<script lang="ts">

  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'
  import Event from '@/components/events/Event.vue'
  import BottomSheetModal from '@/components/general/BottomSheetModal.vue'

  export default {
    name: 'Program',
    components: { Event, BottomSheetModal },
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    data() {
      const today = new Date()
      return {
        weekReferenceDate: today,
        selectedDate: today as Date | null,
        swipeDate: null as Date | null, // Separate state for DateSwipePager to prevent flash
        dayEvents: [] as any[],
        prefetchedByIso: {} as Record<string, any[]>,
        weekEventsByIso: {} as Record<string, number>,
        loading: false,
        // Swipe functionality - now date-based for infinite scrolling
        pagerKey: 0, // Force re-render when clicking week dates
        // Event details bottom sheet
        eventDetailsModal: false,
        openedEventId: null as any,
        openedRecurrenceDate: '' as string
      }
    },
    computed: {

      monthLabel(): string {
        const d = this.weekReferenceDate
        const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
        return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d)
      },
      weekDays(): Array<any> {
        const start = this.getStartOfWeek(this.weekReferenceDate)
        const today = new Date()
        const todayIso = this.toIso(today)
        const days: any[] = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
          const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
          const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          const iso = `${year}-${month}-${day}`
          days.push({
            date: d,
            iso,
            weekdayShort,
            day: d.getDate(),
            hasDot: Boolean(this.weekEventsByIso[iso]),
            isToday: iso === todayIso
          })
        }
        return days
      }
    },
    async mounted() {
      const qd = (this.$route && this.$route.query && this.$route.query.date) ? String(this.$route.query.date) : undefined
      if (qd && /^\d{4}-\d{2}-\d{2}$/.test(qd)) {
        const [y, m, d] = qd.split('-').map(Number)
        const dateFromRoute = new Date(y, m - 1, d)
        this.selectedDate = dateFromRoute
        this.weekReferenceDate = dateFromRoute
      }

      await Promise.all([
        this.fetchWeekEvents(),
        this.selectedDate ? this.fetchDayEvents() : Promise.resolve()
      ])

      // Prefetch adjacent days after initial load
      if (this.selectedDate) {
        this.prefetchAdjacentDays(this.selectedDate)
      }

      // Open event modal from URL on initial load
      this.syncEventModalFromRoute()
    },
    watch: {
      '$route.query': {
        handler() {
          this.syncEventModalFromRoute()
        },
        deep: true
      },
      eventDetailsModal(newValue, oldValue) {
        // When modal closes, reset the route
        if (oldValue === true && newValue === false) {
          console.log('[Program] Modal closed, resetting route')
          this.handleCloseEventModal()
        }
      }
    },
    methods: {
      toIso(date: Date): string {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      },
      getStartOfWeek(date: Date): Date {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const day = (d.getDay() + 6) % 7
        d.setDate(d.getDate() - day)
        d.setHours(0, 0, 0, 0)
        return d
      },
      isSameDay(a: Date, b: Date): boolean {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
      },
      async selectDate(date: Date) {
        this.selectedDate = date
        this.weekReferenceDate = date
        const iso = this.toIso(date)

        if (this.$router && this.$route) {
          this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, date: iso } }).catch(() => {})
        }

        // Reset pager to center on this date
        this.pagerKey++

        // Fetch data if not cached
        if (!this.prefetchedByIso[iso]) {
          await this.fetchDayEvents()
        }

        await this.fetchWeekEvents()

        // Prefetch adjacent days for smooth swiping
        this.prefetchAdjacentDays(date)
      },
      async onDayHover(iso: string) {
        if (this.prefetchedByIso[iso]) return
        try {
          const teamId = this.userStore.currentTeamId
          const res = await api.get(`/event/team/${teamId}`, { params: { date: iso, withPlans: true } })
          this.prefetchedByIso[iso] = res?.data?.data || []
        } catch {
          // ignore prefetch errors
        }
      },
      async prefetchAdjacentDays(centerDate: Date) {
        // Prefetch previous day
        const prevDate = new Date(centerDate)
        prevDate.setDate(prevDate.getDate() - 1)
        const prevIso = this.toIso(prevDate)

        // Prefetch next day
        const nextDate = new Date(centerDate)
        nextDate.setDate(nextDate.getDate() + 1)
        const nextIso = this.toIso(nextDate)

        // Fetch both in parallel
        const teamId = this.userStore.currentTeamId
        const promises = []

        if (!this.prefetchedByIso[prevIso]) {
          promises.push(
            api.get(`/event/team/${teamId}`, { params: { date: prevIso, withPlans: true } })
              .then(res => {
                this.prefetchedByIso[prevIso] = res?.data?.data || []
              })
              .catch(() => {
                this.prefetchedByIso[prevIso] = []
              })
          )
        }

        if (!this.prefetchedByIso[nextIso]) {
          promises.push(
            api.get(`/event/team/${teamId}`, { params: { date: nextIso, withPlans: true } })
              .then(res => {
                this.prefetchedByIso[nextIso] = res?.data?.data || []
              })
              .catch(() => {
                this.prefetchedByIso[nextIso] = []
              })
          )
        }

        await Promise.all(promises)
      },
      async goPrevWeek() {
        const d = new Date(this.weekReferenceDate)
        d.setDate(d.getDate() - 7)
        this.weekReferenceDate = d
        await this.fetchWeekEvents()
      },
      async goNextWeek() {
        const d = new Date(this.weekReferenceDate)
        d.setDate(d.getDate() + 7)
        this.weekReferenceDate = d
        await this.fetchWeekEvents()
      },
      async goToToday() {
        const today = new Date()
        this.selectedDate = today
        this.weekReferenceDate = today
        const iso = this.toIso(today)

        if (this.$router && this.$route) {
          this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, date: iso } }).catch(() => {})
        }

        // Reset pager to center on today
        this.pagerKey++

        // Fetch data if not cached
        if (!this.prefetchedByIso[iso]) {
          await this.fetchDayEvents()
        }

        await this.fetchWeekEvents()

        // Prefetch adjacent days for smooth swiping
        this.prefetchAdjacentDays(today)
      },
      async fetchWeekEvents() {
        try {
          const teamId = this.userStore.currentTeamId
          const start = this.getStartOfWeek(this.weekReferenceDate)
          const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)

          const startYear = start.getFullYear()
          const startMonth = String(start.getMonth() + 1).padStart(2, '0')
          const startDay = String(start.getDate()).padStart(2, '0')
          const startDate = `${startYear}-${startMonth}-${startDay}`

          const endYear = end.getFullYear()
          const endMonth = String(end.getMonth() + 1).padStart(2, '0')
          const endDay = String(end.getDate()).padStart(2, '0')
          const endDate = `${endYear}-${endMonth}-${endDay}`

          const res = await api.get(`/event/team/${teamId}`, {
            params: { startDate, endDate, withPlans: false }
          })
          const events = res?.data?.data || []

          // Create a map of dates with event counts
          const map: Record<string, number> = {}
          for (const event of events) {
            if (event.eventDate) {
              const date = new Date(event.eventDate)
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              const iso = `${year}-${month}-${day}`
              map[iso] = (map[iso] || 0) + 1
            }
          }

          this.weekEventsByIso = map
        } catch {
          this.weekEventsByIso = {}
        }
      },
      async fetchDayEvents() {
        this.loading = true
        try {
          const teamId = this.userStore.currentTeamId
          const year = this.selectedDate.getFullYear()
          const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0')
          const day = String(this.selectedDate.getDate()).padStart(2, '0')
          const iso = `${year}-${month}-${day}`
          if (this.prefetchedByIso[iso]) {
            this.dayEvents = this.prefetchedByIso[iso]
          } else {
            const res = await api.get(`/event/team/${teamId}`, { params: { date: iso, withPlans: true } })
            this.dayEvents = res?.data?.data || []
            this.prefetchedByIso[iso] = this.dayEvents
          }
        } catch {
          this.dayEvents = []
        } finally {
          this.loading = false
        }
      },
      openEventFromProgram(event: any) {
        try {
          const isMobile = !!this.$vuetify.display.mobile
          const eventId = String(event?.id)
          const recurrenceDate = event?.eventDate ? String((event?.eventDate as any).toString().split('T')[0]) : undefined
          if (isMobile) {
            const newQuery: any = { ...this.$route.query, openEvent: eventId }
            if (recurrenceDate) newQuery.recurrenceDate = recurrenceDate
            this.$router.replace({ name: 'Program', query: newQuery }).catch(() => {})
            this.openedEventId = eventId
            this.openedRecurrenceDate = recurrenceDate || ''
            this.eventDetailsModal = true
          } else {
            // Desktop: navigate
            this.$router.push({ name: 'EventInfo', params: { eventId }, query: recurrenceDate ? { recurrenceDate } : undefined })
          }
        } catch {}
      },
      syncEventModalFromRoute() {
        try {
          if (!this.$vuetify.display.mobile) return
          const id = this.$route?.query?.openEvent as any
          console.log('[Program] syncEventModalFromRoute - openEvent:', id, 'modal open:', this.eventDetailsModal)
          if (id) {
            this.openedEventId = String(id)
            const rec = this.$route?.query?.recurrenceDate as any
            this.openedRecurrenceDate = rec ? String(rec) : ''
            this.eventDetailsModal = true
          } else if (this.eventDetailsModal) {
            // Clear local state when no openEvent in URL
            console.log('[Program] No openEvent in URL but modal is open, closing modal')
            this.eventDetailsModal = false
            this.openedEventId = null
            this.openedRecurrenceDate = ''
          }
        } catch {}
      },
      handleCloseEventModal() {
        console.log('[Program] handleCloseEventModal called')
        console.log('[Program] Current route query:', JSON.stringify(this.$route.query))

        // Clear local state
        this.openedEventId = null
        this.openedRecurrenceDate = ''

        // Reset route - preserve only the date parameter if it exists
        const currentQuery = this.$route.query as any
        const newQuery: any = currentQuery.date ? { date: currentQuery.date } : {}
        console.log('[Program] Replacing route with query:', JSON.stringify(newQuery))
        this.$router.replace({ name: 'Program', query: newQuery }).then(() => {
          console.log('[Program] Route replaced successfully, new query:', JSON.stringify(this.$route.query))
        }).catch((err) => {
          console.log('[Program] Route replace error:', err)
        })
      },
      // Swipe functionality
      async onSwipeDateChange(newDate: Date) {
        if (!this.isSameDay(newDate, this.selectedDate || new Date())) {
          // Ensure data exists for the new date AND its adjacent dates
          // This prevents any flash during the transition
          const datesToEnsure = [
            new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate() - 1), // prev
            newDate, // current
            new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate() + 1)  // next
          ]

          const updates = {}
          const fetchPromises = []

          for (const date of datesToEnsure) {
            const dateIso = this.toIso(date)
            if (!(dateIso in this.prefetchedByIso)) {
              // Initialize with empty array to prevent loading state
              updates[dateIso] = []

              // Fetch actual data immediately and wait for it
              const fetchPromise = api.get(`/event/team/${this.userStore.currentTeamId}`, { params: { date: dateIso, withPlans: true } })
                .then(res => {
                  this.prefetchedByIso = { ...this.prefetchedByIso, [dateIso]: res?.data?.data || [] }
                })
                .catch(() => {
                  // Keep empty array on error
                  this.prefetchedByIso = { ...this.prefetchedByIso, [dateIso]: [] }
                })
              fetchPromises.push(fetchPromise)
            }
          }

          // Apply all updates at once for better performance
          if (Object.keys(updates).length > 0) {
            this.prefetchedByIso = { ...this.prefetchedByIso, ...updates }
          }

          // Wait for the current date's data to be fetched before updating
          const currentDateIso = this.toIso(newDate)
          if (fetchPromises.length > 0) {
            await Promise.all(fetchPromises)
          }

          // Only update dates AFTER data is available
          this.selectedDate = newDate
          this.weekReferenceDate = newDate
          this.swipeDate = newDate

          const iso = this.toIso(newDate)
          if (this.$router && this.$route) {
            this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, date: iso } }).catch(() => {})
          }

          // Update week view asynchronously
          this.fetchWeekEvents()

          // Continue prefetching more adjacent days for smooth swiping
          this.prefetchAdjacentDays(newDate)
        }
      }
    }
  }
</script>

<style scoped>
/* Page layout with scrolling logic */
.program-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Sticky header for navigation */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
}

/* Swipe container */
.swipe-container {
  flex: none;
}

/* Day item cursor */
.day-item {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.day-item:hover {
  transform: translateY(-2px);
}

/* Highlight today's date */
.today-highlight {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}
</style>
