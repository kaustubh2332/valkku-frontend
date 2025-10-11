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
      <!-- Debug info -->
      <div v-if="swipeItems.length === 0" class="pa-4 text-center">
        <p>Loading swipe items...</p>
        <p>Items count: {{ swipeItems.length }}</p>
        <p>Current index: {{ currentDateIndex }}</p>
        <p>Selected date: {{ selectedDate?.toDateString() }}</p>
      </div>

      <!-- SwipePager with per-day page components -->
      <SwipePager
        v-else
        v-model="currentDateIndex"
        :count="swipeItems.length"
        :debug-freeze="false"
        :edge-resistance="0.4"
        :flick-velocity="0.5"
        :render-buffer="2"
        :threshold="0.25"
        @change="onDateChangeWithLog"
      >
        <template #page="{ index }">
          <ProgramDay
            :date="swipeItems[index].date"
            :events="swipeItems[index].events"
            :loading="swipeItems[index].loading"
          />
        </template>
      </SwipePager>
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
        // Swipe functionality
        currentDateIndex: 0,
        swipeItems: [] as any[]
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

      await Promise.all([this.fetchWeekEvents(), this.selectedDate ? this.fetchDayEvents() : Promise.resolve()])

      // Generate swipe items after data is loaded
      this.generateSwipeItems()
      this.updateSwipeItems()

      // Debug: log swipe items
      console.log('Swipe items:', this.swipeItems)
      console.log('Current date index:', this.currentDateIndex)
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
        const iso = this.toIso(date)
        if (this.$router && this.$route) {
          this.$router.replace({ path: this.$route.path, query: { ...this.$route.query, date: iso } }).catch(() => {})
        }

        // Check if date is in swipe range, if not regenerate
        const dateIndex = this.swipeItems.findIndex(item => this.toIso(item.date) === iso)
        if (dateIndex === -1) {
          console.log('Date outside swipe range, regenerating items...')
          this.generateSwipeItems()
          const newIndex = this.swipeItems.findIndex(item => this.toIso(item.date) === iso)
          if (newIndex !== -1) {
            this.currentDateIndex = newIndex
          }
        } else {
          this.currentDateIndex = dateIndex
        }

        if (this.prefetchedByIso[iso]) {
          this.dayEvents = this.prefetchedByIso[iso]
          this.updateSwipeItems()
          return
        }
        await this.fetchDayEvents()
        this.updateSwipeItems()
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
          this.updateSwipeItems()
        }
      },
      // Swipe functionality methods
      generateSwipeItems() {
        console.log('Generating swipe items...')
        const items: any[] = []
        const today = new Date()
        // Generate a larger range: ±6 months (365 days total)
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 182)

        for (let i = 0; i < 365; i++) {
          const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i)
          const iso = this.toIso(date)
          items.push({
            date,
            events: this.prefetchedByIso[iso] || [],
            loading: false
          })
        }

        this.swipeItems = items
        console.log('Generated items:', items.length)

        // Find current date index
        const currentDateIso = this.toIso(this.selectedDate || today)
        const currentIndex = items.findIndex(item => this.toIso(item.date) === currentDateIso)
        this.currentDateIndex = Math.max(0, currentIndex)
        console.log('Current index:', this.currentDateIndex)
      },
      updateSwipeItems() {
        this.swipeItems = this.swipeItems.map(item => ({
          ...item,
          events: this.prefetchedByIso[this.toIso(item.date)] || [],
          loading: this.isSameDay(item.date, this.selectedDate || new Date()) && this.loading
        }))
      },
      onDateChange(newIndex: number) {
        const newDate = this.swipeItems[newIndex]?.date
        if (newDate && !this.isSameDay(newDate, this.selectedDate || new Date())) {
          this.selectDate(newDate)
        }
      },
      onDateChangeWithLog(newIndex: number) {
        try { console.log('[Program] swipe change', { newIndex, currentDate: this.swipeItems[newIndex]?.date }) } catch {}
        this.onDateChange(newIndex)
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
