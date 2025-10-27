<template>
  <div class="home-page">
    <div id="confetti-trigger" style="position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 1px; height: 1px; z-index: 20050;" />

    <div class="hero-section mb-6 mb-md-8">
      <div class="d-flex align-center justify-space-between flex-wrap ga-4">
        <div>
          <div class="text-h3 text-md-h2 font-weight-bold mb-2">
            {{ greeting }}, {{ userStore.firstName }}!
            <BigEmoji />
          </div>
          <div v-if="userStore.currentTeam" class="text-subtitle-1 text-medium-emphasis">
            {{ userStore.currentTeam.teamName }}
          </div>
        </div>

        <!-- Quick Action Buttons (Staff Only) -->
        <div v-if="userStore.isStaff" class="d-flex ga-2 flex-wrap">
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            size="large"
            variant="elevated"
            @click="openCreateEvent"
          >
            {{ $t('home.addEvent') }}
          </v-btn>
        </div>
      </div>
    </div>

    <Loading v-if="isLoading" />

    <!-- Main Content Grid -->
    <v-row v-else>
      <!-- This Week Section - Use Program component in embedded mode for parity -->
      <v-col cols="12" lg="8" order="1" order-lg="1">
        <v-card class="week-card" elevation="3">
          <v-card-title class="d-flex align-center pa-4 pa-md-6">
            <v-icon class="mr-3" color="primary" size="28">
              mdi-calendar-week
            </v-icon>
            <span class="text-h5 font-weight-bold">{{ $t('home.thisWeek') }}</span>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <Program :embedded="true" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Sidebar - Upcoming Events and Tasks -->
      <v-col cols="12" lg="4" order="2" order-lg="2">
        <!-- Upcoming Events -->
        <v-card class="mb-4 upcoming-events-card" elevation="3">
          <v-card-title class="d-flex align-center pa-4 pa-md-5">
            <v-icon class="mr-3" color="primary" size="24">
              mdi-calendar-clock
            </v-icon>
            <span class="text-h6 font-weight-bold">{{ $t('home.upcomingEvents') }}</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-0">
            <!-- Loading State -->
            <div v-if="loadingEvents" class="d-flex justify-center py-12">
              <v-progress-circular color="primary" indeterminate size="48" />
            </div>

            <!-- Events List -->
            <div v-else-if="upcomingEvents && upcomingEvents.length > 0" class="events-list-container">
              <ProgramEvent
                v-for="event in upcomingEvents.slice(0, 5)"
                :key="event.id"
                :event="event"
                @open-event="handleOpenEvent"
              />
              <div v-if="upcomingEvents.length > 5" class="text-center pa-4">
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  @click="$router.push('/program')"
                >
                  {{ $t('home.viewAll') }} ({{ upcomingEvents.length }})
                </v-btn>
              </div>
            </div>

            <!-- No events state -->
            <div v-else class="empty-state py-12 px-4">
              <div class="text-center">
                <v-icon
                  class="mb-4"
                  color="medium-emphasis"
                  size="64"
                >
                  mdi-calendar-blank-outline
                </v-icon>
                <div class="text-body-1 text-medium-emphasis font-weight-medium">
                  {{ $t('home.noEventsNextMonth') }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Tasks Placeholder -->
        <v-card class="tasks-card" elevation="3">
          <v-card-title class="d-flex align-center pa-4 pa-md-5">
            <v-icon class="mr-3" color="primary" size="24">
              mdi-checkbox-marked-circle-outline
            </v-icon>
            <span class="text-h6 font-weight-bold">{{ $t('home.tasks') }}</span>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <div class="empty-state py-8 text-center">
              <v-icon class="mb-3" color="medium-emphasis" size="48">
                mdi-check-circle-outline
              </v-icon>
              <div class="text-body-2 text-medium-emphasis">
                {{ $t('home.comingSoon') }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>

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

  <!-- Create Event Modal -->
  <BottomSheetModal
    v-model="createEventOpen"
    :class="{ 'pa-0': $vuetify.display.mobile }"
    height="80vh"
    max-width="1000"
    :title="$t('home.addEvent')"
  >
    <CreateEvent @close="createEventOpen = false" @saved="onEventSaved" />
  </BottomSheetModal>

  <!-- Bottom App Buttons -->
  <div class="my-8 d-flex justify-space-around">
    <AppButton
      color="primary"
      icon="mdi-home"
      text="Home"
      @click="handleGetStarted"
    />
    <AppButton
      color="secondary"
      icon="mdi-account-multiple"
      text="Team"
      @click="handleExploreFeatures"
    />
    <AppButton
      color="success"
      icon="mdi-trophy"
      text="Results"
      @click="handleGetStarted"
    />
    <AppButton
      color="info"
      icon="mdi-chart-bar"
      text="Raportit"
      @click="handleExploreFeatures"
    />
  </div>
</template>

<script lang="ts">
  import CreateEvent from '@/components/events/CreateEvent.vue'
  import Event from '@/components/events/Event.vue'
  import ProgramEvent from '@/components/events/ProgramEvent.vue'
  import BottomSheetModal from '@/components/general/BottomSheetModal.vue'
  import BigEmoji from '@/components/home/BigEmoji.vue'
  import Program from '@/pages/Program.vue'
  import { useEventStore } from '@/stores/event'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Home',
    components: { BottomSheetModal, CreateEvent, ProgramEvent, Program, BigEmoji, Event },
    setup() {
      const userStore = useUserStore()
      const eventStore = useEventStore()
      return { userStore, eventStore }
    },
    data() {
      const today = new Date()
      return {
        isLoading: false,
        createEventOpen: false,
        loadingEvents: false,
        upcomingEvents: [],
        eventDetailsModal: false,
        openedEventId: null,
        openedRecurrenceDate: '',
        // Week view data no longer needed here (delegated to Program)
      }
    },
    computed: {
      user() {
        return this.userStore.user
      },
      greeting() {
        // If first=true, show welcome message instead of time-based greeting
        if (this.$route.query.first === 'true') {
          return this.$t('home.welcome')
        }

        const hour = new Date().getHours()

        let timeKey = 'goodMorning'
        if (hour >= 12 && hour < 17) {
          timeKey = 'goodAfternoon'
        } else if (hour >= 17 && hour < 22) {
          timeKey = 'goodEvening'
        } else if (hour >= 22 || hour < 6) {
          timeKey = 'goodNight'
        }

        return this.$t(`home.${timeKey}`)
      }
    },
    mounted() {
      // Check if 'first' query parameter is 'true' and shoot confetti
      if (this.$route.query.first === 'true') {
        this.shootConfetti()

        setTimeout(() => {
          this.shootConfetti()
        }, 300)

        setTimeout(() => {
          this.shootConfetti()
        }, 600)
      }

      // Fetch upcoming events (Program handles week/day fetching itself)
      this.fetchUpcomingEvents()
    },
    methods: {

      async fetchUpcomingEvents() {
        if (!this.userStore.currentTeamId) return

        this.loadingEvents = true
        try {
          // Calculate date range: today to 30 days from now
          const startDate = new Date()
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 30)

          const events = await this.eventStore.fetchEventsForRange(startDate, endDate)

          // Sort events by date and time
          this.upcomingEvents = events.sort((a, b) => {
            const dateA = new Date(a.eventDate || 0)
            const dateB = new Date(b.eventDate || 0)
            if (dateA.getTime() !== dateB.getTime()) {
              return dateA.getTime() - dateB.getTime()
            }
            // If same date, sort by start time
            return (a.startTimeUnixSec || 0) - (b.startTimeUnixSec || 0)
          })
        } catch (error) {
          console.error('Failed to fetch upcoming events:', error)
        } finally {
          this.loadingEvents = false
        }
      },
      handleOpenEvent(event) {
        // On mobile, open event in modal
        if (this.$vuetify.display.mobile) {
          this.openedEventId = event.id
          this.openedRecurrenceDate = event.repeatId && event.eventDate ? event.eventDate : ''
          this.eventDetailsModal = true
        } else {
          // On desktop, navigate to event page
          const route = this.eventStore.buildEventRoute(event)
          this.$router.push(route)
        }
      },
      openCreateEvent() {
        this.createEventOpen = true
      },
      onEventSaved(payload) {
        console.log('Event saved:', payload)
        // Refresh the upcoming events list
        this.fetchUpcomingEvents()
      },
      shootConfetti() {
        const config = {
          angle: 270, // Shoot downward from top
          spread: 60,
          startVelocity: 20,
          elementCount: 100,
          elementSize: 8,
          lifetime: 300,
          colors: ['#A45BF1', '#25C6F6', '#72F753', '#F76C88', '#F5F770'],
          position: 'fixed'
        }

        const { reward } = this.$reward('confetti-trigger', 'confetti', config)
        reward()
      },
      handleGetStarted() {
        // Add your get started logic here
        this.$router.push('/settings')
      },
      handleExploreFeatures() {
        // Add your explore features logic here
        this.$router.push('/users')
      }
    }
  }
</script>

<style scoped>
/* Home Page Container */
.home-page {
  max-width: 1600px;
  margin: 0 auto;
}

/* Hero Section */
.hero-section {
  padding: 1.5rem 0;
  animation: fadeInDown 0.6s ease-out;
}

.hero-section .text-h3,
.hero-section .text-h2 {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Card Enhancements */
.week-card,
.upcoming-events-card,
.tasks-card {
  border-radius: 16px !important;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: fadeInUp 0.6s ease-out;
}

.week-card {
  animation-delay: 0.1s;
}

.upcoming-events-card {
  animation-delay: 0.2s;
}

.tasks-card {
  animation-delay: 0.3s;
}

.week-card:hover,
.upcoming-events-card:hover,
.tasks-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

/* Week Days Container */
.week-days-container {
  padding: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px;
}

.week-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.day-item-wrapper {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 8px;
  border-radius: 12px;
}

.day-item-wrapper:hover {
  background: rgba(var(--v-theme-primary), 0.08);
  transform: scale(1.05);
}

.day-avatar {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;
}

.today-highlight {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.15) !important;
  animation: pulse 2s ease-in-out infinite;
}

/* Events List Container */
.events-list-container {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom Scrollbar */
.events-list-container::-webkit-scrollbar {
  width: 6px;
}

.events-list-container::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 3px;
}

.events-list-container::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.3);
  border-radius: 3px;
  transition: background 0.3s;
}

.events-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-primary), 0.5);
}

/* Selected Day Content */
.selected-day-content {
  min-height: 200px;
  animation: fadeIn 0.4s ease-out;
}

/* Empty State */
.empty-state {
  opacity: 0.7;
  transition: opacity 0.3s;
}

.empty-state:hover {
  opacity: 1;
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.15);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(var(--v-theme-primary), 0.25);
  }
}

/* Responsive Adjustments */
@media (max-width: 960px) {
  .hero-section {
    padding: 1rem 0;
  }

  .week-days-container {
    gap: 8px;
    padding: 6px;
  }

  .day-item-wrapper {
    padding: 4px;
  }

  .events-list-container {
    max-height: 400px;
  }
}

@media (max-width: 600px) {
  .week-days-container {
    gap: 4px;
    padding: 4px;
  }

  .day-item-wrapper {
    padding: 2px;
  }

  .hero-section .text-h3 {
    font-size: 1.75rem !important;
  }
}

/* Card Title Icons */
.v-card-title .v-icon {
  opacity: 0.9;
}

/* Divider Styling */
.v-divider {
  opacity: 0.12;
}

/* Prevent text selection on interactive elements */
.day-item-wrapper,
.v-btn {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
