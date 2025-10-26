<template>
  <div>
    <div class="text-h4 mt-4 mb-2">
      {{ calendarTitle }}
    </div>
    <CalendarToolbar
      :current-view="currentView"
      :title="calendarTitle"
      @export-calendar="openExportModal"
      @next="goToNext"
      @prev="goToPrev"
      @today="goToToday"
      @view-change="changeView"
    />
    <div>
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
        :style="{ '--event-cursor': eventCursorStyle }"
      >
        <template #eventContent="data">
          <CalendarEventCard
            :data="data"
            :event="data.event"
            :view="data.view.type"
          />
        </template>
      </FullCalendar>

      <BottomSheetModal
        v-model="exportEventsModal"
        :title="$t('calendar.export_events')"
      >
        <ExportEvents />
      </BottomSheetModal>

      <!-- Mobile Event Details Modal -->
      <BottomSheetModal
        v-model="eventDetailsModal"
        :title="$t('events.event')"
        @close="handleCloseEventModal"
      >
        <Event
          v-if="eventDetailsModal && openedEventId"
          :embedded="true"
          :event-id="openedEventId"
          :recurrence-date="openedRecurrenceDate"
          @close="handleCloseEventModal"
        />
      </BottomSheetModal>

      <!-- Loading overlay -->
      <v-overlay
        class="align-center justify-center"
        contained
        :model-value="showLoading"
        persistent
      >
        <v-progress-circular
          color="primary"
          indeterminate
          size="32"
          width="3"
        />
      </v-overlay>

      <!-- Context Menu -->
      <v-menu
        v-model="contextMenu.show"
        :activator="contextMenu.activator"
        :close-on-content-click="false"
        location="bottom start"
        :z-index="9999"
      >
        <v-list
          density="compact"
          min-width="200"
        >
          <v-list-item
            prepend-icon="mdi-eye"
            @click="viewEvent"
          >
            <v-list-item-title>{{ $t('calendar.view_event') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-pencil"
            @click="editEvent"
          >
            <v-list-item-title>{{ $t('calendar.edit_event') }}</v-list-item-title>
          </v-list-item>
          <!-- Temporarily hidden - will be re-enabled later -->
          <!-- <v-list-item
            prepend-icon="mdi-content-duplicate"
            @click="duplicateEvent"
          >
            <v-list-item-title>{{ $t('calendar.duplicate_event') }}</v-list-item-title>
          </v-list-item> -->
          <v-divider />
          <v-list-item
            class="text-error"
            prepend-icon="mdi-delete"
            @click="deleteEvent"
          >
            <v-list-item-title>{{ $t('calendar.delete_event') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Empty Space Context Menu -->
      <v-menu
        v-model="emptySpaceMenu.show"
        :activator="emptySpaceMenu.activator"
        :close-on-content-click="false"
        location="bottom start"
        :z-index="9999"
      >
        <v-list
          density="compact"
          min-width="200"
        >
          <v-list-item
            prepend-icon="mdi-plus"
            @click="addEvent"
          >
            <v-list-item-title>{{ $t('calendar.add_event') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-calendar-plus"
            @click="addQuickEvent"
          >
            <v-list-item-title>{{ $t('calendar.add_quick_event') }}</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item
            prepend-icon="mdi-calendar-today"
            @click="goToToday"
          >
            <v-list-item-title>{{ $t('calendar.go_to_today') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Edit Event Modal -->
      <BottomSheetModal
        v-model="editEventModal"
        :title="$t('events.edit_event')"
        @close="editEventModal = false"
      >
        <CreateEvent
          v-if="editEventModal"
          :edit="selectedEvent"
          :go-to-event="false"
          @close="editEventModal = false"
          @saved="handleEventSaved"
        />
      </BottomSheetModal>
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
  import Event from '@/components/events/Event.vue'
  import { useEventStore } from '@/stores/event'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Calendar',
    components: { FullCalendar, Event },
    setup() {
      const { locale } = useI18n()
      const eventStore = useEventStore()
      const userStore = useUserStore()
      return { locale, eventStore, userStore }
    },
    data() {
      return {
        events: [],
        loading: false,
        showLoading: false,
        loadingTimeout: null,
        isUpdatingUrl: false,
        urlUpdateTimeout: null,
        contextMenu: {
          show: false,
          activator: null,
          event: null
        },
        emptySpaceMenu: {
          show: false,
          activator: null,
          date: null
        },
        fabMenu: {
          show: false
        },
        editEventModal: false,
        selectedEvent: null,
        exportEventsModal: false,
        // Event details bottom sheet
        eventDetailsModal: false,
        openedEventId: null as any,
        openedRecurrenceDate: '' as string,
        currentCalendarTs: Date.now(),
        currentViewType: '',
        // Calendar interaction settings - easily configurable
        // Set to true to enable dragging and resizing of events
        allowEventDragResize: false
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
      },
      calendarTitle() {
        const apiCal = this.$refs.calendarRef?.getApi?.()
        const currentView = this.currentViewType || (apiCal ? apiCal.view.type : this.urlView)
        const baseDate = Number.isFinite(this.currentCalendarTs) ? new Date(this.currentCalendarTs) : new Date()

        // For year view, show just the year
        if (currentView === 'multiMonthYear') {
          const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
          const year = new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(baseDate)
          return year
        }

        // For other views, show localized month and year
        const locale = this.$i18n?.locale === 'fi' ? 'fi-FI' : 'en-US'
        const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(baseDate)
        return this.$t('calendar.title', { monthYear })
      },
      currentView() {
        if (this.currentViewType) return this.currentViewType
        const apiCal = this.$refs.calendarRef?.getApi?.()
        if (apiCal) return apiCal.view.type
        return this.urlView
      },
      eventCursorStyle() {
        return this.allowEventDragResize ? 'move' : 'pointer'
      },
      // URL query parameters for calendar state
      urlView() {
        return this.$route.query.view || 'dayGridMonth'
      },
      urlDate() {
        return this.$route.query.date || new Date().toISOString().split('T')[0]
      },
      calendarOptions() {
        return {
          plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, multimonthPlugin],
          initialView: this.urlView,
          initialDate: this.urlDate,
          headerToolbar: false as const,
          locale: (this.locale && typeof this.locale === 'string' && this.locale === 'fi') ? fiLocale : null,
          firstDay: (this.locale && typeof this.locale === 'string' && this.locale === 'fi') ? 1 : 0,
          events: [],
          height: 'auto',
          slotMinTime: '06:00:00',
          slotMaxTime: '23:00:00',
          // Force UTC timezone to prevent double conversion
          timeZone: 'UTC',
          // MultiMonthYear specific options
          multiMonthMaxColumns: 3,
          multiMonthMinWidth: 300,
          // Ensure events are shown in year view
          displayEventTime: true,
          displayEventEnd: true,
          // Event handlers
          datesSet: (info) => {
            this.onDatesSet(info)
            this.updateUrlFromCalendar()
            this.currentViewType = info.view.type
            try {
              const start = info.view?.currentStart
              if (start && Number.isFinite(start.getTime?.() || Number.NaN)) {
                this.currentCalendarTs = start.getTime()
              } else {
                const api = (this.$refs.calendarRef as any)?.getApi?.()
                const d = api?.getDate?.()
                if (d && Number.isFinite(d.getTime())) this.currentCalendarTs = d.getTime()
              }
            } catch {}
          },
          eventClick: (clickInfo) => this.onEventClick(clickInfo),
          viewDidMount: (view) => {
            console.log('viewDidMount event fired', view.view.type) // Debug log
            this.updateUrlFromCalendar()
            this.currentViewType = view.view.type
            try {
              const start = view.view?.currentStart
              if (start && Number.isFinite(start.getTime?.() || Number.NaN)) {
                this.currentCalendarTs = start.getTime()
              } else {
                const api = (this.$refs.calendarRef as any)?.getApi?.()
                const d = api?.getDate?.()
                if (d && Number.isFinite(d.getTime())) this.currentCalendarTs = d.getTime()
              }
            } catch {}
          },
          // Right-click context menu
          eventMouseEnter: (info) => this.onEventMouseEnter(info),
          eventMouseLeave: (info) => this.onEventMouseLeave(info),
          // Empty space right-click
          dateClick: (info) => this.onDateClick(info),
          // Drag and drop handlers
          eventDrop: (info) => this.onEventDrop(info),
          eventResize: (info) => this.onEventResize(info),
          eventDragStart: (info) => this.onEventDragStart(info),
          eventDragStop: (info) => this.onEventDragStop(info),
          // Enable/disable drag and drop based on configuration
          editable: this.allowEventDragResize,
          eventResizableFromStart: this.allowEventDragResize,
          eventStartEditable: this.allowEventDragResize,
          eventDurationEditable: this.allowEventDragResize
        }
      }
    },
    watch: {
      // Watch for URL changes and update calendar
      '$route.query': {
        handler(newQuery) {
          if (!this.isUpdatingUrl) {
            this.updateCalendarFromUrl()
          }
          this.syncEventModalFromRoute()
        },
        deep: true
      },
      // Watch for calendar date changes to update title
      currentCalendarDate: {
        handler() {
          // Force reactivity by accessing the computed property
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        }
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
          // Event handlers are now defined in calendarOptions computed property

          // Ensure calendar is initialized with URL parameters
          setTimeout(() => {
            this.updateCalendarFromUrl()
          }, 100)
        } catch {}
      })

      // Add right-click listener for empty space
      this.$nextTick(() => {
        const calendarEl = this.$refs.calendarRef?.$el
        if (calendarEl) {
          calendarEl.addEventListener('contextmenu', (e) => {
            // Check if clicking on empty space (not on an event)
            if (!e.target.closest('.fc-event')) {
              this.onEmptySpaceRightClick(e, null)
            }
          })
        }
      })

      // Open event modal from URL on initial load
      this.syncEventModalFromRoute()
    },
    beforeUnmount() {
      if (this.urlUpdateTimeout) {
        clearTimeout(this.urlUpdateTimeout)
      }
    },
    methods: {
      updateCalendarFromUrl() {
        this.$nextTick(() => {
          try {
            const apiCal = (this.$refs.calendarRef as any)?.getApi?.()
            if (!apiCal) return

            const newView = this.urlView
            const newDate = this.urlDate

            if (apiCal.view.type !== newView) {
              apiCal.changeView(newView)
            }

            // Change date if different
            const currentDate = apiCal.getDate()
            // Parse date string as local date to avoid timezone issues
            const [year, month, day] = newDate.split('-').map(Number)
            const targetDate = new Date(year, month - 1, day) // month is 0-indexed

            // Compare dates using local formatting
            const currentYear = currentDate.getFullYear()
            const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0')
            const currentDay = String(currentDate.getDate()).padStart(2, '0')
            const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`

            const targetYear = targetDate.getFullYear()
            const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0')
            const targetDay = String(targetDate.getDate()).padStart(2, '0')
            const targetDateStr = `${targetYear}-${targetMonth}-${targetDay}`

            if (currentDateStr !== targetDateStr) {
              console.log('Changing date from', currentDateStr, 'to', targetDateStr) // Debug log
              apiCal.gotoDate(targetDate)
            }
          } catch (error) {
            console.warn('Failed to update calendar from URL:', error)
          }
        })
      },
      updateUrlFromCalendar() {
        console.log('updateUrlFromCalendar called') // Debug log
        // Add a small delay to ensure calendar has fully updated
        this.$nextTick(() => {
          try {
            const apiCal = (this.$refs.calendarRef as any)?.getApi?.()
            if (!apiCal) {
              console.log('No calendar API available') // Debug log
              return
            }

            const currentView = apiCal.view.type
            const currentDate = apiCal.getDate()
            // Format date as YYYY-MM-DD in local timezone to avoid timezone shifts
            const year = currentDate.getFullYear()
            const month = String(currentDate.getMonth() + 1).padStart(2, '0')
            const day = String(currentDate.getDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${day}`

            const newQuery = {
              view: currentView,
              date: dateStr
            }

            // Only update URL if values have changed
            const currentQuery = this.$route.query
            if (currentQuery.view !== newQuery.view || currentQuery.date !== newQuery.date) {
              console.log('Updating URL:', newQuery) // Debug log
              this.isUpdatingUrl = true
              this.$router.replace({
                name: 'Calendar',
                query: newQuery
              }).finally(() => {
                this.isUpdatingUrl = false
              })
            } else {
              console.log('URL already up to date') // Debug log
            }
          } catch (error) {
            console.warn('Failed to update URL from calendar:', error)
            this.isUpdatingUrl = false
          }
        })
      },
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
        console.log('fetchEventsForRange called', startDate, endDate)
        if (!this.userStore.currentTeamId) return

        // Clear any existing timeout
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout)
          this.loadingTimeout = null
        }

        this.loading = true
        // Only show loading spinner if request takes longer than 500ms
        this.loadingTimeout = setTimeout(() => {
          if (this.loading) {
            this.showLoading = true
          }
        }, 500)

        const startDateStr = this.formatYMD(startDate)
        const endDateStr = this.formatYMD(endDate)

        api.get(`/event/team/${this.userStore.currentTeamId}`, {
          params: { startDate: startDateStr, endDate: endDateStr }
        })
          .then((res) => {
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
            // Clear timeout and hide loading
            if (this.loadingTimeout) {
              clearTimeout(this.loadingTimeout)
              this.loadingTimeout = null
            }
            this.loading = false
            this.showLoading = false
          })
      },
      onEventClick(clickInfo) {
        try {
          // Get backend event data from extendedProps
          const backendEvent = clickInfo?.event?.extendedProps?.backendEvent
          const isMobile = !!this.$vuetify.display.mobile
          if (isMobile) {
            // Open bottom sheet and sync URL query
            const eventId = String(backendEvent?.id || clickInfo?.event?.id)
            const recurrenceDate = backendEvent?.eventDate ? String((backendEvent?.eventDate as any).toString().split('T')[0]) : undefined
            const newQuery: any = { ...this.$route.query, openEvent: eventId }
            if (recurrenceDate) newQuery.recurrenceDate = recurrenceDate
            this.$router.replace({ name: 'Calendar', query: newQuery }).catch(() => {})
            this.openedEventId = eventId
            this.openedRecurrenceDate = recurrenceDate || ''
            this.eventDetailsModal = true
          } else {
            if (backendEvent) {
              const route = this.eventStore.buildEventRoute(backendEvent)
              this.$router.push(route)
            } else {
              // Fallback to simple navigation if event data not available
              const id = clickInfo?.event?.id
              if (id) {
                this.$router.push({ name: 'EventInfo', params: { eventId: id } })
              }
            }
          }
        } catch (error) {
          console.error('Error opening event:', error)
        }
      },
      onEventMouseEnter(info) {
        // Add right-click listener to the event element
        const element = info.el
        if (element) {
          const rightClickHandler = (e) => this.onEventRightClick(e, info)
          element._rightClickHandler = rightClickHandler
          element.addEventListener('contextmenu', rightClickHandler)
        }
      },
      onEventMouseLeave(info) {
        // Remove right-click listener when mouse leaves
        const element = info.el
        if (element && element._rightClickHandler) {
          element.removeEventListener('contextmenu', element._rightClickHandler)
          delete element._rightClickHandler
        }
      },
      onEventRightClick(event, info) {
        event.preventDefault()
        event.stopPropagation()

        // Store the event data and show context menu
        this.contextMenu.event = info.event
        this.contextMenu.activator = event.target
        this.contextMenu.show = true
      },
      onEventDrop(info) {
        console.log('Event dropped:', info)
        this.updateEventDates(info.event)
      },
      onEventResize(info) {
        console.log('Event resized:', info)
        this.updateEventDates(info.event)
      },
      onEventDragStart(info) {
        console.log('Event drag started:', info)
        // Add visual feedback if needed
        info.el.style.opacity = '0.5'
      },
      onEventDragStop(info) {
        console.log('Event drag stopped:', info)
        // Remove visual feedback
        info.el.style.opacity = '1'
      },
      async updateEventDates(event) {
        try {
          const eventId = event.id
          const start = event.start
          const end = event.end

          if (!eventId || !start) {
            console.warn('Missing event ID or start time')
            return
          }

          // Convert to Unix timestamps
          const startTimeUnixSec = Math.floor(start.getTime() / 1000)
          const endTimeUnixSec = end ? Math.floor(end.getTime() / 1000) : null

          // Update the event on the backend
          const updateData = {
            startTimeUnixSec,
            ...(endTimeUnixSec && { endTimeUnixSec })
          }

          console.log('Updating event:', eventId, updateData)

          await api.put(`/events/${eventId}`, updateData)

          // Show success notification
          console.log('Event updated successfully')

        } catch (error) {
          console.error('Failed to update event:', error)

          // Revert the event position on error
          event.revert()
        }
      },
      // Context menu actions
      viewEvent() {
        if (this.contextMenu.event) {
          // Get backend event data from extendedProps
          const backendEvent = this.contextMenu.event.extendedProps?.backendEvent
          if (backendEvent) {
            const route = this.eventStore.buildEventRoute(backendEvent)
            this.$router.push(route)
          } else {
            // Fallback to simple navigation if event data not available
            const eventId = this.contextMenu.event.id
            this.$router.push({ name: 'EventInfo', params: { eventId } })
          }
        }
        this.contextMenu.show = false
      },
      editEvent() {
        if (this.contextMenu.event) {
          const eventId = this.contextMenu.event.id
          // Get the full event data and open edit modal
          this.fetchEventForEdit(eventId)
        }
        this.contextMenu.show = false
      },
      async duplicateEvent() {
        if (this.contextMenu.event) {
          const eventId = this.contextMenu.event.id
          await this.copyEvent(eventId)
        }
        this.contextMenu.show = false
      },
      async deleteEvent() {
        if (this.contextMenu.event) {
          const eventId = this.contextMenu.event.id
          const eventTitle = this.contextMenu.event.title

          // Show confirmation dialog
          const confirmed = confirm(`Are you sure you want to delete "${eventTitle}"?`)
          if (confirmed) {
            try {
              await api.delete(`/events/${eventId}`)
              console.log('Event deleted successfully')

              // Remove from calendar
              this.contextMenu.event.remove()

              // Refresh events
              this.fetchEventsForRange(
                this.$refs.calendarRef?.getApi?.()?.view?.currentStart,
                this.$refs.calendarRef?.getApi?.()?.view?.currentEnd
              )
            } catch (error) {
              console.error('Failed to delete event:', error)
            }
          }
        }
        this.contextMenu.show = false
      },
      async fetchEventForEdit(eventId) {
        try {
          this.showLoading = true

          // Extract recurrence date from the event data if available
          const backendEvent = this.contextMenu.event?.extendedProps?.backendEvent
          const recurrenceDate = backendEvent?.eventDate

          // Pass recurrence date as query parameter
          const options = recurrenceDate ? { recurrenceDate } : {}
          this.selectedEvent = await this.eventStore.getEvent(eventId, this.userStore.currentTeamId, options)
          this.editEventModal = true
        } catch (error) {
          console.error('Error fetching event for edit:', error)
        } finally {
          this.showLoading = false
        }
      },
      async copyEvent(eventId) {
        try {
          this.showLoading = true

          // Extract recurrence date from the event data if available
          const backendEvent = this.contextMenu.event?.extendedProps?.backendEvent
          const recurrenceDate = backendEvent?.eventDate

          // Pass recurrence date as query parameter
          const options = recurrenceDate ? { recurrenceDate } : {}
          const originalEvent = await this.eventStore.getEvent(eventId, this.userStore.currentTeamId, options)

          // Create a copy of the event with modified title
          const copyEventData = {
            ...originalEvent,
            title: `${originalEvent.title} ${this.$t('copy')}`,
            // Remove fields that shouldn't be copied
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            createdById: undefined
          }

          // Save the copied event
          const savedEvent = await this.eventStore.saveEvent(copyEventData)

          // Optimistically show the copied event
          this.handleEventSaved(savedEvent)

          console.log('Event copied successfully:', savedEvent)
        } catch (error) {
          console.error('Error copying event:', error)
        } finally {
          this.showLoading = false
        }
      },
      handleEventSaved(updatedEvent) {
        // Close the modal
        this.editEventModal = false
        this.selectedEvent = null

        // Try to update the event in the current calendar view immediately
        this.updateCalendarEvent(updatedEvent)

        // Sync local events array so later renders don't revert the change
        this.updateLocalEventsArray(updatedEvent)

        // As a fallback, refresh events from server
        // (kept to ensure consistency if the event isn't currently rendered)
        this.refreshCalendar()

        console.log('Event updated:', updatedEvent)
      },
      updateCalendarEvent(updatedEvent) {
        try {
          if (!updatedEvent || !updatedEvent.id) return
          const api = this.$refs.calendarRef?.getApi?.()
          if (!api) return
          const fcEvent = api.getEventById(String(updatedEvent.id))
          if (!fcEvent) return

          // Update basic fields
          if (updatedEvent.title) fcEvent.setProp('title', updatedEvent.title)
          // Update extended props
          const extended = Object.assign({}, fcEvent.extendedProps, updatedEvent)
          fcEvent.setExtendedProp('type', updatedEvent.type)
          fcEvent.setExtendedProp('status', updatedEvent.status)
          fcEvent.setExtendedProp('teamId', updatedEvent.teamId)
          fcEvent.setExtendedProp('durationInMinutes', updatedEvent.durationInMinutes)
          fcEvent.setExtendedProp('repeats', updatedEvent.repeats)
          fcEvent.setExtendedProp('repeatsOn', updatedEvent.repeatsOn)
          fcEvent.setExtendedProp('repeatsUntilUnixSec', updatedEvent.repeatsUntilUnixSec)
          fcEvent.setExtendedProp('locationId', updatedEvent.locationId)
          fcEvent.setExtendedProp('eventDate', updatedEvent.eventDate)
          fcEvent.setExtendedProp('notes', updatedEvent.notes)
          fcEvent.setExtendedProp('ownNotes', updatedEvent.ownNotes)
          fcEvent.setExtendedProp('coachesNotes', updatedEvent.coachesNotes)
          fcEvent.setExtendedProp('raw', extended)

          // Update start/end when available
          if (Number(updatedEvent.startTimeUnixSec) > 0) {
            const start = new Date(Number(updatedEvent.startTimeUnixSec) * 1000)
            fcEvent.setStart(start)
          }
          if (Number(updatedEvent.endTimeUnixSec) > 0) {
            const end = new Date(Number(updatedEvent.endTimeUnixSec) * 1000)
            fcEvent.setEnd(end)
          }
        } catch (error) {
          console.warn('Failed to update calendar event in-place; will refetch', error)
        }
      },
      updateLocalEventsArray(updatedEvent) {
        try {
          if (!updatedEvent || !updatedEvent.id) return
          const idStr = String(updatedEvent.id)
          const idx = this.events.findIndex(e => String(e.id) === idStr)
          const mapped = this.mapBackendEventToCalendar(updatedEvent)
          const exists = idx !== -1
          if (exists) {
            this.events.splice(idx, 1, mapped)
          } else {
            // If not found in current window but still visible, add it
            this.events.push(mapped)
          }
        } catch {}
      },
      refreshCalendar() {
        // Re-fetch events for current visible range and re-inject into calendar
        try {
          const api = this.$refs.calendarRef?.getApi?.()
          const start = api?.view?.currentStart
          const end = api?.view?.currentEnd
          if (start && end) {
            this.fetchEventsForRange(start, end)
          }
        } catch {}
      },
      // Empty space context menu
      onDateClick(info) {
        // Only show menu on right-click (contextmenu event)
        // This will be handled by the calendar's built-in dateClick for left clicks
        // We'll add a separate right-click handler for empty space
      },
      onEmptySpaceRightClick(event, date) {
        event.preventDefault()
        event.stopPropagation()

        // Store the date and show empty space menu
        this.emptySpaceMenu.date = date
        this.emptySpaceMenu.activator = event.target
        this.emptySpaceMenu.show = true
      },
      // Empty space menu actions
      addEvent() {
        if (this.emptySpaceMenu.date) {
          console.log('Add event on date:', this.emptySpaceMenu.date)
          // TODO: Open create event dialog with pre-filled date
        }
        this.emptySpaceMenu.show = false
      },
      addQuickEvent() {
        if (this.emptySpaceMenu.date) {
          console.log('Add quick event on date:', this.emptySpaceMenu.date)
          // TODO: Open quick event creation
        }
        this.emptySpaceMenu.show = false
      },
      goToToday() {
        const apiCal = this.$refs.calendarRef?.getApi?.()
        if (apiCal) {
          apiCal.today()
          this.updateUrlFromCalendar()
          this.updateCalendarDate()
        }
        this.emptySpaceMenu.show = false
      },
      openExportModal() {
        this.exportEventsModal = true
        this.fabMenu.show = false
      },
      syncEventModalFromRoute() {
        try {
          if (!this.$vuetify.display.mobile) return
          const id = this.$route?.query?.openEvent as any
          if (id) {
            this.openedEventId = String(id)
            const rec = this.$route?.query?.recurrenceDate as any
            this.openedRecurrenceDate = rec ? String(rec) : ''
            this.eventDetailsModal = true
          } else if (this.eventDetailsModal) {
            // Close if query was cleared externally
            this.eventDetailsModal = false
          }
        } catch {}
      },
      handleCloseEventModal() {
        this.eventDetailsModal = false
        const { openEvent, recurrenceDate, ...rest } = this.$route.query as any
        this.$router.replace({ name: 'Calendar', query: { ...rest } }).catch(() => {})
      },
      updateCalendarDate() {
        try {
          const api = (this.$refs.calendarRef as any)?.getApi?.()
          const d = api?.getDate?.()
          const t = d && Number.isFinite(d.getTime()) ? d.getTime() : Date.now()
          this.currentCalendarTs = t
          this.currentViewType = api?.view?.type || this.currentViewType
        } catch {}
      },
      goToPrev() {
        const apiCal = this.$refs.calendarRef?.getApi?.()
        if (apiCal) {
          apiCal.prev()
          this.updateUrlFromCalendar()
          this.updateCalendarDate()
        }
      },
      goToNext() {
        const apiCal = this.$refs.calendarRef?.getApi?.()
        if (apiCal) {
          apiCal.next()
          this.updateUrlFromCalendar()
          this.updateCalendarDate()
        }
      },
      changeView(viewType) {
        const apiCal = this.$refs.calendarRef?.getApi?.()
        if (apiCal) {
          apiCal.changeView(viewType)
          this.updateUrlFromCalendar()
          this.updateCalendarDate()
        }
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
          // Use toISOString() which correctly handles UTC conversion
          startIso = new Date(startSec * 1000).toISOString()
          endIso = new Date(endSec * 1000).toISOString()
          allDay = false
        } else if (ev.eventDate) {
          // All-day event: use date-only strings (YYYY-MM-DD) without timezone shifts
          const raw = String(ev.eventDate)
          let ymd = ''
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            // Already plain YYYY-MM-DD, use as-is
            ymd = raw
          } else if (raw.includes('T')) {
            // ISO date string -> convert to local date to avoid timezone shifts
            const d = new Date(raw)
            if (Number.isFinite(d.getTime())) {
              const yy = d.getFullYear()
              const mm = String(d.getMonth() + 1).padStart(2, '0')
              const dd2 = String(d.getDate()).padStart(2, '0')
              ymd = `${yy}-${mm}-${dd2}`
            } else {
              ymd = raw.slice(0, 10)
            }
          } else {
            // Fallback to formatting via Date only if necessary
            ymd = this.formatYMD(raw)
          }
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
          classNames: ['custom-event'],
          extendedProps: {
            type: ev.type,
            typeLabel: ev.type,
            locationName: ev.locationName || ev.location?.name,
            likes: ev.likes,
            dislikes: ev.dislikes,
            durationInMins: ev.durationInMinutes ?? ev.durationInMins,
            eventColor: colorMap[ev.type] || undefined,
            // Store the complete backend event data for navigation
            backendEvent: ev
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

<style scoped>
/* Ensure events are visible in multiMonthYear view */
:deep(.fc-multimonth .fc-event) {
  display: block !important;
  visibility: visible !important;
}

:deep(.fc-multimonth .fc-event-title) {
  display: block !important;
}

:deep(.fc-multimonth .fc-event-time) {
  display: block !important;
}

/* Mobile calendar button improvements */
:deep(.fc-toolbar) {
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.fc-toolbar-chunk) {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Removed custom outline and hover effects for FullCalendar buttons to use defaults */

:deep(.fc-button-primary) {
  background: #1976d2 !important;
  border-color: #1976d2 !important;
}

:deep(.fc-button-primary:hover) {
  background: #1565c0 !important;
  border-color: #1565c0 !important;
}

:deep(.fc-button-group) {
  display: flex;
  gap: 4px;
}

:deep(.fc-button-group .fc-button) {
  margin: 0 !important;
}

/* Specific styling for navigation buttons */
:deep(.fc-prev-button),
:deep(.fc-next-button) {
  width: 36px !important;
  height: 36px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 16px !important;
  line-height: 1 !important;
}

:deep(.fc-prev-button::before),
:deep(.fc-next-button::before) {
  content: '' !important;
}

:deep(.fc-prev-button .fc-icon),
:deep(.fc-next-button .fc-icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
}

/* Drag and drop improvements - cursor controlled by allowEventDragResize */
:deep(.fc-event) {
  user-select: none;
  cursor: var(--event-cursor, pointer);
}

:deep(.fc-event:hover) {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

:deep(.fc-event-dragging) {
  opacity: 0.8;
  transform: rotate(2deg);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

:deep(.fc-event-resizing) {
  opacity: 0.8;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  :deep(.fc-toolbar) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  :deep(.fc-toolbar-chunk) {
    justify-content: center;
    flex-wrap: wrap;
  }

  :deep(.fc-button) {
    font-size: 12px !important;
    padding: 6px 10px !important;
    min-height: 32px !important;
  }

  :deep(.fc-prev-button),
  :deep(.fc-next-button) {
    width: 32px !important;
    height: 32px !important;
    font-size: 14px !important;
  }

  :deep(.fc-toolbar-title) {
    font-size: 18px !important;
    text-align: center;
    margin: 8px 0;
  }
}

@media (max-width: 480px) {
  :deep(.fc-button) {
    font-size: 11px !important;
    padding: 4px 8px !important;
    min-height: 28px !important;
  }

  :deep(.fc-prev-button),
  :deep(.fc-next-button) {
    width: 28px !important;
    height: 28px !important;
    font-size: 12px !important;
  }

  :deep(.fc-toolbar-title) {
    font-size: 16px !important;
  }

  :deep(.fc-button-group) {
    gap: 2px;
  }
}

/* Calendar Menu Button */
.calendar-menu-btn {
  color: rgba(0, 0, 0, 0.6) !important;
}

.calendar-menu-btn:hover {
  color: rgba(0, 0, 0, 0.8) !important;
  background: rgba(0, 0, 0, 0.04) !important;
}

/* Override FullCalendar default event styling to prevent double backgrounds */
:deep(.fc-event.custom-event) {
  background: transparent !important;
  border: none !important;
  color: inherit !important;
}

:deep(.fc-event.custom-event .fc-event-main) {
  background: transparent !important;
  border: none !important;
}

:deep(.fc-event.custom-event .fc-event-main-frame) {
  background: transparent !important;
  border: none !important;
}
</style>
