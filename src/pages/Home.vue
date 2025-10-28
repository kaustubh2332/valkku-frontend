<template>
  <div class="mt-4">
    <div id="confetti-trigger" style="position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 1px; height: 1px; z-index: 20050;" />

    <div class="mb-6 mb-md-6">
      <div>
        <h1 class="text-h3 mb-2 d-flex align-center">
          {{ greeting }}, {{ userStore.firstName }}!
          <BigEmoji />
        </h1>

        <!-- Add Event Button (Staff Only) -->
        <v-btn
          class="mt-6"
          v-if="userStore.isStaff"
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

    <Loading v-if="isLoading" />

    <!-- Main Content -->
    <v-row v-else>
      <!-- Upcoming Events -->
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3" color="primary">
              mdi-calendar-clock
            </v-icon>
            <span>{{ $t('home.upcomingEvents') }}</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Loading State -->
            <div v-if="loadingEvents" class="d-flex justify-center py-12">
              <v-progress-circular color="primary" indeterminate size="48" />
            </div>

            <!-- Events List -->
            <div v-else-if="upcomingEvents && upcomingEvents.length > 0">
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
            <div v-else class="py-12 px-4">
              <div class="text-center">
                <v-icon
                  class="mb-4"
                  color="medium-emphasis"
                  size="64"
                >
                  mdi-calendar-blank-outline
                </v-icon>
                <div class="text-body-1 text-medium-emphasis">
                  {{ $t('home.noEventsNextMonth') }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Tasks Placeholder -->
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3" color="primary">
              mdi-checkbox-marked-circle-outline
            </v-icon>
            <span>{{ $t('home.tasks') }}</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="py-8 text-center">
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
  import { useEventStore } from '@/stores/event'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'Home',
    setup() {
      const userStore = useUserStore()
      const eventStore = useEventStore()
      return { userStore, eventStore }
    },
    data() {
      return {
        isLoading: false,
        createEventOpen: false,
        loadingEvents: false,
        upcomingEvents: [],
        eventDetailsModal: false,
        openedEventId: null,
        openedRecurrenceDate: ''
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
