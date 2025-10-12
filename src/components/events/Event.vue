<template>
  <div class="event-page">
    <!-- Loading State -->
    <div v-if="loading">
      <v-container class="py-4 py-md-8" fluid>
        <v-row justify="center">
          <v-col cols="12" lg="10" xl="8">
            <v-skeleton-loader class="mb-6" elevation="2" type="image, text, text" />
            <v-row>
              <v-col cols="12" md="3" sm="6">
                <v-skeleton-loader type="card" />
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <v-skeleton-loader type="card" />
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <v-skeleton-loader type="card" />
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <v-skeleton-loader type="card" />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Error State -->
    <v-container v-else-if="error" class="py-8">
      <v-row justify="center">
        <v-col
          cols="12"
          lg="6"
          md="8"
        >
          <v-alert
            color="error"
            icon="mdi-alert-circle"
            prominent
            variant="tonal"
          >
            <v-alert-title class="text-h6 mb-2">
              {{ $t('something_went_wrong') }}
            </v-alert-title>
            {{ error }}
          </v-alert>
          <div class="d-flex justify-center mt-6">
            <v-btn
              color="primary"
              prepend-icon="mdi-arrow-left"
              size="large"
              variant="elevated"
              @click="$router.back()"
            >
              {{ $t('back') }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Event Details -->
    <v-container v-else-if="event" class="py-4 py-md-8" :class="{ 'pa-0': $vuetify.display.mobile }">
      <v-row justify="center">
        <v-col
          cols="12"
          lg="10"
          xl="8"
        >
          <!-- Hero Section with Gradient Background -->
          <v-card
            class="mb-6 overflow-visible"
            :color="eventTypeColor"
            elevation="8"
            rounded="lg"
          >
            <div class="event-hero-gradient pa-6 pa-md-8">
              <!-- Back Button -->
              <v-btn
                class="mb-4"
                color="white"
                icon="mdi-arrow-left"
                size="small"
                variant="text"
                @click="$router.back()"
              />

              <!-- Title Section -->
              <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-4">
                <div class="flex-grow-1">
                  <!-- Top Row: Location, Type, Status -->
                  <div class="d-flex align-center flex-wrap ga-2 mb-3">
                    <!-- Location (moved to start) -->
                    <div
                      v-if="hasLocation"
                      class="hero-location-btn d-flex align-center ga-3 cursor-pointer"
                      color="white"
                      prepend-icon="mdi-map-marker"
                      @click="openMaps"
                    >
                      <div>
                        <v-icon>mdi-map-marker</v-icon>
                      </div>
                      <div>
                        <strong>
                          {{ locationName || $t('events.location') }}
                        </strong>
                        <div>
                          {{ locationAddress }}
                        </div>
                      </div>
                    </div>

                    <!-- Spacer to push type and status to the end -->
                    <v-spacer />

                    <!-- Type and Status (moved to end) -->
                    <v-chip class="hero-chip" color="white" label variant="elevated">
                      <v-icon
                        class="mr-2"
                        start
                      >
                        {{ eventTypeIcon }}
                      </v-icon>
                      {{ eventTypeLabel }}
                    </v-chip>
                    <v-chip
                      v-if="event.status"
                      class="hero-chip"
                      :color="statusColor"
                      label
                      variant="flat"
                    >
                      <v-icon
                        class="mr-2"
                        size="small"
                        start
                      >
                        {{ statusIcon }}
                      </v-icon>
                      {{ event.status }}
                    </v-chip>
                  </div>

                  <!-- Title -->
                  <h1 class="hero-title text-h5 text-md-h4 font-weight-bold text-white mb-2">
                    {{ event.title || $t('events.event_type') }}
                  </h1>

                  <!-- Date and Time Row -->
                  <div class="d-flex align-center flex-wrap ga-3">
                    <div class="hero-meta text-body-2 text-md-h6 text-white text-opacity-90">
                      <v-icon
                        class="mr-1 hero-meta-icon"
                        color="white"
                      >
                        mdi-calendar
                      </v-icon>
                      {{ formattedDate }}
                    </div>
                    <div v-if="headerTimeChipText">
                      <v-chip
                        v-tooltip:top="event.durationInMinutes ? $t('events.duration_in_minutes', { duration: event.durationInMinutes }) : $t('events.duration')"
                        class="hero-chip hero-time-chip"
                        color="white"
                        label
                        variant="elevated"
                      >
                        <v-icon class="mr-2" start>mdi-timer-outline</v-icon>
                        {{ headerTimeChipText }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card>

          <v-tabs
            class="mb-4"
            density="comfortable"
            :model-value="currentTab"
            slider-color="primary"
            @update:model-value="navigateToTab"
          >
            <v-tab value="info">
              <v-icon class="mr-2" size="small">mdi-information-outline</v-icon>
              {{ $t('events.event') }}
            </v-tab>
            <v-tab value="plan">
              <v-icon class="mr-2" size="small">mdi-clipboard-text-outline</v-icon>
              {{ $t('events.plan') }}
            </v-tab>
          </v-tabs>
          <v-window class="mb-4 pa-2" :model-value="currentTab">
            <v-window-item value="info">
              <!-- Header-only time; quick stats removed per requirements -->

              <!-- Main Content Grid -->
              <v-row>
                <!-- Left Column -->
                <v-col
                  cols="12"
                  md="8"
                >
                  <!-- Repeating Info Card -->
                  <v-card
                    v-if="event.repeats"
                    class="mb-6"
                    elevation="2"
                    rounded="lg"
                  >
                    <v-card-title class="d-flex align-center bg-surface-variant">
                      <v-avatar
                        class="mr-3"
                        color="primary"
                        size="40"
                      >
                        <v-icon color="white">
                          mdi-repeat
                        </v-icon>
                      </v-avatar>
                      <span class="text-h6">{{ $t('events.repeats') }}</span>
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-6">
                      <v-list
                        bg-color="transparent"
                        class="pa-0"
                      >
                        <v-list-item class="px-0">
                          <template #prepend>
                            <v-icon
                              class="mr-4"
                              color="primary"
                            >
                              mdi-autorenew
                            </v-icon>
                          </template>
                          <v-list-item-title class="text-caption text-medium-emphasis">
                            {{ $t('events.repeats') }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-body-1 font-weight-medium text-capitalize mt-1">
                            {{ event.repeats }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="event.repeatsOn && event.repeatsOn.length > 0"
                          class="px-0"
                        >
                          <template #prepend>
                            <v-icon
                              class="mr-4"
                              color="primary"
                            >
                              mdi-calendar-week
                            </v-icon>
                          </template>
                          <v-list-item-title class="text-caption text-medium-emphasis">
                            {{ $t('events.repeat_on_weekdays') }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="mt-2">
                            <v-chip-group>
                              <v-chip
                                v-for="day in getWeekdayLabels(event.repeatsOn)"
                                :key="day"
                                color="primary"
                                size="small"
                                variant="tonal"
                              >
                                {{ day }}
                              </v-chip>
                            </v-chip-group>
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item
                          v-if="repeatsUntilDate"
                          class="px-0"
                        >
                          <template #prepend>
                            <v-icon
                              class="mr-4"
                              color="primary"
                            >
                              mdi-calendar-end
                            </v-icon>
                          </template>
                          <v-list-item-title class="text-caption text-medium-emphasis">
                            {{ $t('events.repeat_until') }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-body-1 font-weight-medium mt-1">
                            {{ repeatsUntilDate }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>

                  <!-- Notes Section -->
                  <div>
                    <!-- Team Notes -->
                    <v-card
                      class="mb-6"
                      elevation="2"
                      rounded="lg"
                    >
                      <v-card-title class="d-flex align-center bg-surface-variant">
                        <v-avatar
                          class="mr-3"
                          color="primary"
                          size="40"
                        >
                          <v-icon color="white">
                            mdi-note-text
                          </v-icon>
                        </v-avatar>
                        <span class="text-h6">{{ $t('events.notes') }}</span>
                      </v-card-title>
                      <v-divider />
                      <v-card-text v-if="event.notes" class="pa-6">
                        <div class="text-body-1" v-html="event.notes" />
                      </v-card-text>
                      <v-card-text v-else class="pa-6">
                        {{ $t('events.no_notes') }}
                      </v-card-text>
                    </v-card>

                    <!-- Coach Notes -->
                    <v-card
                      v-if="event.coachesNotes"
                      class="mb-6"
                      elevation="2"
                      rounded="lg"
                    >
                      <v-card-title class="d-flex align-center bg-warning-lighten-4">
                        <v-avatar
                          class="mr-3"
                          color="warning"
                          size="40"
                        >
                          <v-icon color="white">
                            mdi-clipboard-text
                          </v-icon>
                        </v-avatar>
                        <span class="text-h6">{{ $t('events.coach_notes') }}</span>
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-6">
                        <v-alert
                          class="mb-4"
                          color="warning"
                          density="compact"
                          icon="mdi-information"
                          variant="tonal"
                        >
                          {{ $t('events.coach_notes_hint') }}
                        </v-alert>
                        <div class="text-body-1" v-html="event.coachesNotes" />
                      </v-card-text>
                    </v-card>

                    <!-- Own Notes -->
                    <v-card
                      v-if="event.ownNotes"
                      class="mb-6"
                      elevation="2"
                      rounded="lg"
                    >
                      <v-card-title class="d-flex align-center bg-info-lighten-4">
                        <v-avatar
                          class="mr-3"
                          color="info"
                          size="40"
                        >
                          <v-icon color="white">
                            mdi-account-circle
                          </v-icon>
                        </v-avatar>
                        <span class="text-h6">{{ $t('events.own_notes') }}</span>
                      </v-card-title>
                      <v-divider />
                      <v-card-text class="pa-6">
                        <v-alert
                          class="mb-4"
                          color="info"
                          density="compact"
                          icon="mdi-lock"
                          variant="tonal"
                        >
                          {{ $t('events.own_notes_hint') }}
                        </v-alert>
                        <div class="text-body-1" v-html="event.ownNotes" />
                      </v-card-text>
                    </v-card>
                  </div>
                </v-col>

                <!-- Right Column - Metadata Sidebar -->
                <v-col
                  cols="12"
                  md="4"
                >
                  <v-card
                    class="sticky-sidebar"
                    elevation="2"
                    rounded="lg"
                  >
                    <v-card-title class="bg-surface-variant">
                      <v-icon
                        class="mr-2"
                        color="primary"
                      >
                        mdi-information
                      </v-icon>
                      {{ $t('userManagement.event_details') }}
                    </v-card-title>
                    <v-divider />
                    <v-card-text class="pa-0">
                      <v-list
                        bg-color="transparent"
                        density="comfortable"
                        lines="two"
                      >
                        <v-list-item>
                          <template #prepend>
                            <v-icon color="primary">
                              mdi-account-plus
                            </v-icon>
                          </template>
                          <v-list-item-title class="text-caption text-medium-emphasis">
                            {{ $t('events.created_by') }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-body-2">
                            {{ event.createdByName || '-' }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-divider />

                        <v-list-item>
                          <template #prepend>
                            <v-icon color="primary">
                              mdi-clock-plus
                            </v-icon>
                          </template>
                          <v-list-item-title class="text-caption text-medium-emphasis">
                            {{ $t('events.created_at') }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-body-2">
                            {{ formatDateTime(event.createdAt) }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-divider />

                        <v-list-item>
                          <template #prepend>
                            <v-icon color="primary">
                              mdi-clock-edit
                            </v-icon>
                          </template>
                          <v-list-item-title class="text-caption text-medium-emphasis">
                            {{ $t('events.updated_at') }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-body-2">
                            {{ formatDateTime(event.updatedAt) }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-divider />

                        <v-list-item>
                          <template #prepend>
                            <v-icon color="primary">
                              mdi-shield-account
                            </v-icon>
                          </template>
                          <v-list-item-title class="text-caption text-medium-emphasis">
                            {{ $t('events.team_id') }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="text-body-2 font-mono">
                            {{ event.teamId }}
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <v-window-item value="plan">
              <!-- Loading State for Plan -->
              <div v-if="loadingPlan" class="d-flex justify-center py-8">
                <v-progress-circular color="primary" indeterminate />
              </div>

              <!-- Plan Content -->
              <div v-else-if="showMe('plan')">
                <CreatePlan
                  ref="createPlanRef"
                  :plan="eventPlan"
                  @cancel="handlePlanCancelled"
                  @save="handlePlanSaved"
                />

                <!-- Edit Plan Button at Bottom -->
                <div v-if="!editing" class="mt-4 d-flex justify-end">
                  <v-btn
                    color="primary"
                    size="small"
                    @click="startPlanEditing"
                  >
                    <v-icon class="mr-2">mdi-pencil</v-icon>
                    {{ $t('events.edit_event_plan') }}
                  </v-btn>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
  import type { PublicEvent } from '@/types/event'
  import { useEventStore } from '@/stores/event'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'
  import CreatePlan from './CreatePlan.vue'
  import { getEventTypeColor, getEventTypeIcon, getEventTypeLabel } from '@/utils/eventTypes'

  export default {
    name: 'Event',
    components: {
      CreatePlan
    },
    setup() {
      const eventStore = useEventStore()
      const userStore = useUserStore()
      return { eventStore, userStore }
    },
    data() {
      return {
        event: null as PublicEvent | null,
        loading: false,
        error: null,
        editing: false,
        loadingPlan: false,
        eventPlan: null
      }
    },
    computed: {
      currentTab() {
        const routeName = this.$route.name
        if (routeName === 'EventPlan') return 'plan'
        return 'info' // Default to 'info' for EventInfo or any other route
      },
      hasLocation() {
        const e = this.event || {}
        return Boolean(e.locationId || (e.location && e.location.id))
      },
      locationName() {
        const e = this.event || {}
        const loc = e.location || {}
        return loc.name || e.name || e.locationName || ''
      },
      locationAddress() {
        const e = this.event || {}
        const loc = e.location || {}
        return loc.formattedAddress || e.formattedAddress || [loc.addressLine1 || e.addressLine1, loc.addressLine2 || e.addressLine2, loc.city || e.city].filter(Boolean).join(', ')
      },
      locationPlaceId() {
        const e = this.event || {}
        const loc = e.location || {}
        return loc.providerPlaceId || e.providerPlaceId || ''
      },
      mapsUrl() {
        // Prefer provider place ID (exact place), else address/name, else coords
        const e = this.event || {}
        const loc = e.location || {}
        const provider = (loc.provider || e.provider || '').toString().toLowerCase()
        const displayQuery = (this.locationName || this.locationAddress || '').toString()

        // Use Google Maps with place ID when provider is google
        if (provider === 'google' && this.locationPlaceId) {
          const q = encodeURIComponent(displayQuery)
          const pid = encodeURIComponent(this.locationPlaceId)
          return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${pid}`
        }

        // Otherwise use a plain address/name query if available
        if (displayQuery) {
          return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayQuery)}`
        }

        // Fallback to coordinates if present
        const lat = Number(loc.lat || e.lat)
        const lon = Number(loc.lon || e.lon)
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lon)
        if (hasCoords) {
          return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
        }

        // Last resort: open maps with no query
        return 'https://www.google.com/maps'
      },
      eventTypeLabel() {
        return getEventTypeLabel(this.event?.type, this.$t)
      },
      eventTypeColor() {
        return getEventTypeColor(this.event?.type)
      },
      eventTypeIcon() {
        return getEventTypeIcon(this.event?.type)
      },
      statusColor() {
        const statusMap = {
          'draft': 'grey',
          'published': 'success',
          'cancelled': 'error',
          'completed': 'info'
        }
        return statusMap[this.event?.status] || 'default'
      },
      statusIcon() {
        const iconMap = {
          'draft': 'mdi-file-document-edit',
          'published': 'mdi-check-circle',
          'cancelled': 'mdi-cancel',
          'completed': 'mdi-check-all'
        }
        return iconMap[this.event?.status] || 'mdi-information'
      },
      formattedDate() {
        if (!this.event?.eventDate) return '-'

        try {
          const date = new Date(this.event.eventDate)
          if (Number.isNaN(date.getTime())) return '-'

          // Relative labels for today/tomorrow
          const now = new Date()
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

          const isToday = startOfDay.getTime() === startOfToday.getTime()
          const isTomorrow = startOfDay.getTime() === startOfTomorrow.getTime()
          if (isToday) return this.$t('events.today')
          if (isTomorrow) return this.$t('events.tomorrow')

          const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
          return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          }).format(date)
        } catch {
          return '-'
        }
      },
      formattedStartTime() {
        if (!this.event?.startTimeUnixSec) return null

        try {
          const date = new Date(this.event.startTimeUnixSec * 1000)
          if (Number.isNaN(date.getTime())) return null

          const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
          return new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit'
          }).format(date)
        } catch {
          return null
        }
      },
      formattedEndTime() {
        if (!this.event?.endTimeUnixSec) return null

        try {
          const date = new Date(this.event.endTimeUnixSec * 1000)
          if (Number.isNaN(date.getTime())) return null

          const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
          return new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit'
          }).format(date)
        } catch {
          return null
        }
      },
      durationText() {
        if (this.event?.durationInMinutes) {
          return `${this.event.durationInMinutes} min`
        }

        if (this.event?.startTimeUnixSec && this.event?.endTimeUnixSec) {
          const durationMinutes = Math.floor(
            (this.event.endTimeUnixSec - this.event.startTimeUnixSec) / 60
          )
          return `${durationMinutes} min`
        }

        return null
      },
      headerTimeChipText() {
        // If explicit duration is provided, show that
        if (this.event?.durationInMinutes && Number(this.event.durationInMinutes) > 0) {
          return `${this.event.durationInMinutes} min`
        }
        // Otherwise, show start-end if both available
        if (this.formattedStartTime && this.formattedEndTime) {
          return `${this.formattedStartTime} – ${this.formattedEndTime}`
        }
        return ''
      },
      repeatsUntilDate() {
        if (!this.event?.repeatsUntilUnixSec) return null

        try {
          const date = new Date(this.event.repeatsUntilUnixSec * 1000)
          if (Number.isNaN(date.getTime())) return null

          const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
          return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }).format(date)
        } catch {
          return null
        }
      }
    },
    async created() {
      await this.loadEvent()
      await this.loadPlan()
    },
    methods: {
      openMaps() {
        window.open(this.mapsUrl, '_blank')
      },
      showMe(key) {
        const showMap = {
          notes: ['all'],
          title: ['all'],
          locationId: ['practise', 'match', 'meeting', 'other_event'],
          plan: ['all']
        }
        return this.event?.type && (showMap[key]?.includes(this.event.type) || showMap[key]?.includes('all'))
      },
      toggleEdit() {
        this.editing = !this.editing
      },
      startPlanEditing() {
        this.editing = true
        if (this.$refs.createPlanRef) {
          this.$refs.createPlanRef.startEditing()
        }
      },
      handlePlanSaved(updatedPlan) {
        this.editing = false
        if (updatedPlan) {
          this.eventPlan = updatedPlan
          this.$nextTick(() => {
            if (this.$refs.createPlanRef) {
              this.$refs.createPlanRef.refreshFromPlan()
            }
          })
        } else {
          // Fallback - reload from server if no payload
          this.loadPlan()
        }
      },
      handlePlanCancelled() {
        this.editing = false
        if (this.$refs.createPlanRef) {
          this.$refs.createPlanRef.stopEditing()
        }
      },
      navigateToTab(tab) {
        const eventId = this.$route.params.eventId
        if (tab === 'plan') {
          this.$router.replace({ name: 'EventPlan', params: { eventId } })
          this.loadPlan()
        } else {
          this.$router.replace({ name: 'EventInfo', params: { eventId } })
        }
      },
      async loadPlan() {
        if (this.eventPlan || this.loadingPlan) return

        try {
          this.loadingPlan = true
          const eventId = this.$route.params.eventId
          const response = await api.get(`/plan/event/${eventId}/team/${this.userStore.currentTeamId}`)
          this.eventPlan = response.data.data || null
        } catch (error) {
          console.error('Error loading plan:', error)
          this.eventPlan = null
        } finally {
          this.loadingPlan = false
        }
      },
      async loadEvent() {
        try {
          this.loading = true
          this.error = null
          const eventId = this.$route.params.eventId
          this.event = await this.eventStore.getEvent(eventId, this.userStore.currentTeamId) as PublicEvent;
        } catch (error) {
          console.error('Error loading event:', error)
          this.error = this.$t('something_went_wrong')
        } finally {
          this.loading = false
        }
      },
      formatDateTime(dateString) {
        if (!dateString) return '-'

        try {
          const date = new Date(dateString)
          if (Number.isNaN(date.getTime())) return '-'

          const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
          return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).format(date)
        } catch {
          return '-'
        }
      },
      getWeekdayLabels(binaryStr: string) {
        const weekdays = []
        const chars = Array.from(binaryStr)
        let index = 0
        for (const char of chars) {
          if(char === '1') {
            weekdays.push(this.getWeekdays(index))
          }
          index++
        }
        return weekdays
      },
      getWeekdays(index: number) {
        const weekdayMap = {
          0: this.$t('events.monday_short'),
          1: this.$t('events.tuesday_short'),
          2: this.$t('events.wednesday_short'),
          3: this.$t('events.thursday_short'),
          4: this.$t('events.friday_short'),
          5: this.$t('events.saturday_short'),
          6: this.$t('events.sunday_short'),
        }
        return weekdayMap[index] || null
      }
    }
  }
</script>

<style scoped>
.event-page {
  min-height: 100vh;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

.event-hero-gradient {
  background: linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%);
  position: relative;
}

.sticky-sidebar {
  position: sticky;
  top: 20px;
}

/* Smooth transitions */
.v-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
}

/* Better text hierarchy */
.text-h2, .text-h3 {
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.text-h6 {
  letter-spacing: 0.01em;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .sticky-sidebar {
    position: relative;
    top: 0;
  }
  .hero-title {
    font-size: 1.375rem; /* ~22px */
  }
  .hero-meta {
    font-size: 0.9rem;
  }
  .hero-meta-icon {
    font-size: 18px;
  }
  .hero-chip {
    transform: scale(0.92);
  }
  .hero-time-chip {
    transform: scale(0.92);
  }
  .hero-actions .v-btn.hero-action {
    min-height: 30px;
    padding: 0 10px;
  }
  .hero-location-btn {
    min-height: 30px;
    padding: 0 8px;
  }
  .hero-location-address {
    font-size: 0.9rem;
  }
}

/* Custom scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.3);
}
</style>
