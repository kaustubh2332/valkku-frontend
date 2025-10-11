<template>
  <div class="program-page">
    <!-- Sticky Header -->
    <div class="sticky-header">
      <div class="py-4 py-md-8">
        <v-row justify="center">
          <v-col
            cols="12"
            lg="10"
            xl="8"
          >
            <!-- Calendar-like header -->
            <v-card
              elevation="3"
              rounded="xl"
            >
              <v-toolbar class="px-2 px-md-4 pt-1" flat>
                <v-btn icon="mdi-chevron-left" variant="text" @click="goPrevWeek" />
                <v-toolbar-title class="text-subtitle-1 text-medium-emphasis">
                  {{ monthLabel }}
                </v-toolbar-title>
                <v-spacer />
                <v-btn icon="mdi-chevron-right" variant="text" @click="goNextWeek" />
                <v-btn icon="mdi-dots-vertical" variant="text" />
              </v-toolbar>
              <div class="px-4 px-md-6 pb-4 pt-2 d-flex justify-space-between align-center">
                <div
                  v-for="d in weekDays"
                  :key="d.iso"
                  class="text-center"
                  style="cursor: pointer;"
                  @click="selectDate(d.date)"
                  @mouseenter="onDayHover(d.iso)"
                >
                  <div class="text-caption text-medium-emphasis mb-1">
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
                      :color="selectedDate && isSameDay(d.date, selectedDate) ? 'primary' : undefined"
                      size="36"
                      :variant="selectedDate && isSameDay(d.date, selectedDate) ? 'tonal' : 'outlined'"
                    >
                      <span class="text-body-2">{{ d.day }}</span>
                    </v-avatar>
                  </v-badge>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- Swipeable Content -->
    <div class="swipe-container">
      <!-- DateSwipePager with per-day page components -->
      <DateSwipePager
        :key="pagerKey"
        :current-date="selectedDate"
        :prefetched-data="prefetchedByIso"
        @date-change="onSwipeDateChange"
      >
        <template #page="{ date, events, loading: pageLoading }">
          <ProgramDay
            :date="date"
            :events="events"
            :loading="pageLoading"
          />
        </template>
      </DateSwipePager>
    </div>
  </div>
</template>

<script lang="ts">

  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Program',
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    data() {
      const today = new Date()
      return {
        weekReferenceDate: today,
        selectedDate: today as Date | null,
        dayEvents: [] as any[],
        prefetchedByIso: {} as Record<string, any[]>,
        weekEventsByIso: {} as Record<string, number>,
        loading: false,
        // Swipe functionality - now date-based for infinite scrolling
        pagerKey: 0 // Force re-render when clicking week dates
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
            hasDot: Boolean(this.weekEventsByIso[iso])
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
      // Swipe functionality
      async onSwipeDateChange(newDate: Date) {
        if (!this.isSameDay(newDate, this.selectedDate || new Date())) {
          this.selectedDate = newDate
          this.weekReferenceDate = newDate

          const iso = this.toIso(newDate)
          if (this.$router && this.$route) {
            this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, date: iso } }).catch(() => {})
          }

          // Fetch data if not cached
          if (!this.prefetchedByIso[iso]) {
            await this.fetchDayEvents()
          }

          await this.fetchWeekEvents()

          // Prefetch adjacent days for smooth swiping
          this.prefetchAdjacentDays(newDate)
        }
      }
    }
  }
</script>

<style scoped>
.program-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.swipe-container {
  /* Let pager grow with content; page already full-height */
  flex: none;
}

/* Smooth transitions */
.v-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}
</style>
