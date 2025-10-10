<template>
  <div class="pa-2">
    <v-form ref="form" v-model="formValid" class="mb-4" @submit.prevent="save">
      <v-row>
        <v-col cols="12" md="6">
          <!-- Event Type -->
          <v-select
            v-model="event.eventType"
            density="compact"
            hide-details="auto"
            item-title="title"
            item-value="value"
            :items="eventTypes"
            :label="$t('events.event_type')"
            :menu-props="{ zIndex: dropdownZIndex }"
            :rules="eventTypeRules"
            variant="outlined"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <span class="color-dot mr-2" :style="{ backgroundColor: item?.raw?.color }" />
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <div class="d-flex align-center ga-2">
                <span class="color-dot" :style="{ backgroundColor: item?.raw?.color }" />
                <span>{{ item?.raw?.title }}</span>
              </div>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            content-class="date-menu-content"
            location="bottom"
            style="width: 200px;"
            :z-index="dropdownZIndex"
            @click:outside="dateMenu = false"
          >
            <template #activator="{ props }">
              <v-text-field
                append-inner-icon="mdi-calendar"
                autocomplete="off"
                density="compact"
                hide-details="auto"
                :label="$t('events.date')"
                v-bind="props"
                :model-value="formattedEventDate"
                readonly
                :rules="eventDateRules"
                variant="outlined"
              />
            </template>
            <v-date-picker
              v-model="pickerDate"
              :first-day-of-week="dateFirstDayOfWeek"
              hide-header
              :locale="dateLocale"
              show-adjacent-months
              @update:model-value="onPickDate"
            />
          </v-menu>
        </v-col>
        <v-col v-if="showMe('title')" cols="12" md="6">
          <v-text-field
            v-model="event.title"
            autocomplete="off"
            density="compact"
            hide-details="auto"
            :label="$t('events.title')"
            :rules="titleRules"
            variant="outlined"
          />
        </v-col>

        <!-- Date and Time Row -->
        <v-col v-if="showMe('startTime')" cols="6" md="3">
          <v-text-field
            v-model="event.startTime"
            density="compact"
            hide-details="auto"
            :label="$t('events.start_time')"
            :rules="startTimeRules"
            type="time"
            variant="outlined"
          />
        </v-col>
        <v-col v-if="showMe('endTime')" cols="6" md="3">
          <v-text-field
            v-model="event.endTime"
            density="compact"
            hide-details="auto"
            :label="$t('events.end_time')"
            :rules="endTimeRules"
            type="time"
            variant="outlined"
          />
        </v-col>
        <v-col v-if="showMe('durationInMinutes')" cols="12" md="6">
          <v-text-field
            v-model="event.durationInMinutes"
            autocomplete="off"
            density="compact"
            hide-details="auto"
            :label="$t('events.duration_minutes')"
            :rules="durationInMinutesRules"
            type="number"
            variant="outlined"
          />
        </v-col>
      </v-row>

      <!-- Location Row -->
      <v-row v-if="showMe('locationId') && userStore.isStaff" class="mb-4">
        <v-col cols="12" md="6">
          <v-autocomplete
            ref="locationAutocomplete"
            v-model="event.locationId"
            v-model:menu="locationMenuOpen"
            autocomplete="off"
            clearable
            density="compact"
            hide-details="auto"
            item-title="name"
            item-value="id"
            :items="teamLocations"
            :label="$t('events.location')"
            :loading="loadingLocations"
            :menu-props="{ zIndex: dropdownZIndex }"
            variant="outlined"
          >
            <template #prepend-item>
              <v-list-item>
                <div class="d-flex align-center justify-space-between">
                  <v-btn color="primary" size="small" variant="tonal" @click="openCreateLocation">
                    <v-icon class="mr-2">mdi-plus</v-icon>
                    {{ $t('events.add_location') || 'Add location' }}
                  </v-btn>
                  <!-- <v-btn size="small" variant="tonal" @click="implementMe">
                    <v-icon class="mr-2">mdi-pencil</v-icon>
                    {{ $t('events.edit_locations') || 'Add location' }}
                  </v-btn> -->
                </div>
              </v-list-item>
              <v-divider class="my-1" />
            </template>
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #title>
                  {{ item.raw?.name }}
                </template>
                <template #subtitle>
                  {{ item.raw?.formattedAddress || item.raw?.city }}
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>

      <!-- Repeats Row -->
      <v-row v-if="showMe('repeats')" class="mb-4">
        <v-col cols="12" md="6">
          <v-select
            v-model="event.repeats"
            density="compact"
            hide-details="auto"
            item-title="title"
            item-value="value"
            :items="repeatOptions"
            :label="$t('events.repeats')"
            :menu-props="{ zIndex: dropdownZIndex }"
            variant="outlined"
          />
        </v-col>

        <!-- Daily: Weekday selection -->
        <v-col v-if="event.repeats === 'daily' && showMe('weekdays')" cols="12" md="3">
          <v-select
            v-model="event.weekdays"
            chips
            closable-chips
            density="compact"
            hide-details="auto"
            item-title="chipTitle"
            item-value="value"
            :items="weekdayOptions"
            :label="$t('events.repeat_on_weekdays')"
            :menu-props="{ zIndex: dropdownZIndex }"
            multiple
            :rules="weekdaysRules"
            variant="outlined"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="event.weekdays.includes(item.raw.value)"
                    @update:model-value="toggleWeekday(item.raw.value)"
                  />
                </template>
                <template #title>
                  {{ item.raw.title }}
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <!-- End date for recurring events -->
        <v-col v-if="event.repeats && event.repeats !== 'never' && showMe('repeatsUntilDate')" cols="12" :md="event.repeats === 'daily' ? 3 : 6">
          <v-menu
            v-model="endDateMenu"
            :close-on-content-click="false"
            content-class="date-menu-content"
            location="bottom"
            style="width: 200px;"
            :z-index="dropdownZIndex"
            @click:outside="endDateMenu = false"
          >
            <template #activator="{ props }">
              <v-text-field
                append-inner-icon="mdi-calendar"
                autocomplete="off"
                density="compact"
                hide-details="auto"
                :hint="repeatUntilHint"
                :label="$t('events.repeat_until')"
                :model-value="formattedEndDate"
                :persistent-hint="!!repeatUntilHint"
                v-bind="props"
                readonly
                :rules="repeatsUntilRules"
                variant="outlined"
              />
            </template>
            <v-date-picker
              v-model="endPickerDate"
              :first-day-of-week="dateFirstDayOfWeek"
              hide-header
              :locale="dateLocale"
              show-adjacent-months
              @update:model-value="onPickEndDate"
            >
              <template #day="slotProps">
                <v-btn
                  v-bind="slotProps.props"
                  :class="[
                    'day-button',
                    {
                      'recurring-day': isRecurringDate(slotProps.item),
                      'recurring-selected': isRecurringDate(slotProps.item) && slotProps.item.isSelected,
                      'event-day': isEventDay(slotProps.item)
                    }
                  ]"
                  @click="slotProps.props.onClick"
                >
                  <span class="day-number">{{ slotProps.item.localized }}</span>
                </v-btn>
              </template>
            </v-date-picker>
          </v-menu>
        </v-col>
      </v-row>

      <!-- Notes Row -->
      <v-row v-if="showMe('notes')">
        <v-col cols="12" md="6">
          <v-textarea
            v-model="event.notes"
            auto-grow
            autocomplete="off"
            density="compact"
            hide-details="auto"
            :hint="$t('events.notes_hint')"
            :label="$t('events.notes')"
            rows="3"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-textarea
            v-if="userStore.isStaff"
            v-model="event.coachesNotes"
            auto-grow
            autocomplete="off"
            density="compact"
            hide-details="auto"
            :hint="$t('events.coach_notes_hint')"
            :label="$t('events.coach_notes')"
            rows="3"
            variant="outlined"
          />
          <v-textarea
            v-else
            v-model="event.ownNotes"
            auto-grow
            autocomplete="off"
            density="compact"
            hide-details="auto"
            :hint="$t('events.own_notes_hint')"
            :label="$t('events.own_notes')"
            rows="3"
            variant="outlined"
          />
        </v-col>
      </v-row>

    </v-form>

    <!-- Plan Section -->
    <div v-if="showMe('plan')" class="d-flex align-center mb-4">
      <div>
        <div class="text-h6">
          {{ $t('events.event_plan') }}
        </div>
        <div class="text-subtitle-2" style="color: grey">
          {{ $t('events.can_modify_later') }}
        </div>
      </div>
      <v-spacer />
      <v-tooltip v-if="!editing" location="bottom" :z-index="dropdownZIndex">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            color="primary"
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="toggleEdit"
          />
        </template>
        {{ $t('events.edit_event_plan') }}
      </v-tooltip>
      <v-tooltip v-else location="bottom" :z-index="dropdownZIndex">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            color="error"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="toggleEdit"
          />
        </template>
        {{ $t('events.stop_editing_event_plan') }}
      </v-tooltip>
    </div>
    <CreatePlan v-if="showMe('plan')" ref="createPlanRef" :editing="editing" />

    <div class="d-flex justify-end ga-2 mt-4">
      <v-btn variant="text" @click="cancel">{{ $t('cancel') }}</v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        :disabled="!formValid || saving"
        :loading="saving"
        style="cursor: pointer;"
        @click="save"
      >{{ isEditing ? $t('events.update_event') : $t('events.create_event') }}</v-btn>
    </div>
  </div>

  <!-- Create Location Modal -->
  <BottomSheetModal
    v-model="showCreateLocation"
    :title="$t('events.add_location') || 'Add location'"
  >
    <CreateLocation
      :team-id="userStore.currentTeamId"
      @close="showCreateLocation = false"
      @created="handleLocationCreated"
    />
  </BottomSheetModal>
</template>

<script lang="ts">
  import BottomSheetModal from '@/components/general/BottomSheetModal.vue'
  import { useZIndex } from '@/composables/useZIndex'
  import { useEventStore } from '@/stores/event'
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'
  import CreatePlan from './CreatePlan.vue'

  export default {
    name: 'CreateEvent',
    components: { BottomSheetModal, CreatePlan },
    props: {
      edit: {
        type: Object,
        default: null
      }
    },
    emits: ['close', 'saved'],
    setup() {
      const eventStore = useEventStore()
      const userStore = useUserStore()
      const currentRoleId = userStore.currentRoleId
      const notificationStore = useNotificationStore()
      return { eventStore, userStore, currentRoleId, notificationStore }
    },
    data() {
      return {
        formValid: false,
        saving: false,
        event: {
          title: '',
          eventType: '',
          eventDate: '',
          startTime: '',
          endTime: '',
          durationInMinutes: null,
          notes: '',
          coachesNotes: '',
          ownNotes: '',
          repeats: 'never', // never, daily, weekly, monthly
          weekdays: [],
          repeatsUntilDate: '',
          locationId: null,
        },
        pickerDate: '',
        endPickerDate: '',
        dateMenu: false,
        endDateMenu: false,
        teamLocations: [],
        loadingLocations: false,
        showCreateLocation: false,
        locationMenuOpen: false,
        editing: true
      }
    },
    computed: {
      isEditing() {
        return !!(this.edit && this.edit.id)
      },
      // --- Field validation rules ---
      eventTypeRules() {
        return [
          (v) => !!v || this.$t('events.type_required')
        ]
      },
      eventDateRules() {
        return [
          () => !!this.event.eventDate || this.$t('required')
        ]
      },
      startTimeRules() {
        return [
          (v) => !!v || this.$t('required')
        ]
      },
      endTimeRules() {
        return [
          (v) => !!v || this.$t('required'),
          () => {
            // Backend: startTimeUnixSec < endTimeUnixSec and both > 0
            const s = Number(this.startTimeUnixSec)
            const e = Number(this.endTimeUnixSec)
            if (!Number.isFinite(s) || !Number.isFinite(e)) return true // other rules will flag empties
            if (s >= e) return this.$t('events.end_time_must_be_after_start')
            return true
          }
        ]
      },
      weekdaysRules() {
        return [
          () => (this.event.repeats !== 'daily' || (Array.isArray(this.event.weekdays) && this.event.weekdays.length > 0)) || this.$t('required')
        ]
      },
      repeatsUntilRules() {
        return [
          () => (!this.event.repeats || this.event.repeats === 'never' || !!this.event.repeatsUntilDate) || this.$t('required')
        ]
      },
      durationInMinutesRules() {
        return [
          (v) => {
            if (!this.currentEventTypeHasNoStartAndEnd) return true
            const num = Number(v)
            return (Number.isFinite(num) && num > 0) || this.$t('events.duration_required')
          }
        ]
      },
      currentEventTypeHasNoStartAndEnd() {
        const selectedType = this.eventTypes.find(t => t.value === this.event.eventType)
        return selectedType?.noStartAndEnd === true
      },
      startTimeUnixSec() {
        return this.combineDateAndTimeToUnix(this.event.eventDate, this.event.startTime)
      },
      endTimeUnixSec() {
        return this.combineDateAndTimeToUnix(this.event.eventDate, this.event.endTime)
      },
      repeatOptions() {
        return [
          { title: this.$t('events.never'), value: 'never' },
          { title: this.$t('events.daily'), value: 'daily' },
          { title: this.$t('events.weekly'), value: 'weekly' },
          { title: this.$t('events.monthly'), value: 'monthly' }
        ]
      },
      weekdayOptions() {
        return [
          { title: this.$t('events.monday'), value: 1, chipTitle: this.$t('events.monday_short') },
          { title: this.$t('events.tuesday'), value: 2, chipTitle: this.$t('events.tuesday_short') },
          { title: this.$t('events.wednesday'), value: 3, chipTitle: this.$t('events.wednesday_short') },
          { title: this.$t('events.thursday'), value: 4, chipTitle: this.$t('events.thursday_short') },
          { title: this.$t('events.friday'), value: 5, chipTitle: this.$t('events.friday_short') },
          { title: this.$t('events.saturday'), value: 6, chipTitle: this.$t('events.saturday_short') },
          { title: this.$t('events.sunday'), value: 0, chipTitle: this.$t('events.sunday_short') }
        ]
      },
      formattedEndDate() {
        if (!this.event.repeatsUntilDate) return ''

        const date = new Date(this.event.repeatsUntilDate)
        if (Number.isNaN(date.getTime())) return ''

        // Use locale-specific formatting
        const locale = this.dateLocale
        const formatter = new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })

        return formatter.format(date)
      },
      repeatsUntilUnixSec() {
        // Convert YYYY-MM-DD to Unix seconds at GMT+0 midnight of the NEXT day
        // (so the selected day is fully included regardless of local timezone)
        const v = this.event.repeatsUntilDate
        if (!v || typeof v !== 'string') return ''
        const parts = v.split('-')
        if (parts.length !== 3) return ''
        const [yStr, mStr, dStr] = parts
        const y = Number(yStr)
        const m = Number(mStr)
        const d = Number(dStr)
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
        // UTC midnight of next day
        const ms = Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0)
        const sec = Math.floor(ms / 1000)
        return Number.isFinite(sec) ? sec : ''
      },
      weekdaysBinary() {
        // Convert weekday array to 7-digit binary string (Monday=0, Sunday=6)
        // Example: [1, 3, 5] (Tue, Thu, Sat) becomes "0101010"
        if (!this.event.weekdays || this.event.weekdays.length === 0) {
          return '0000000'
        }

        const binary = Array.from({ length: 7 }, () => '0')
        for (const weekday of this.event.weekdays) {
          // Convert Sunday=0 to position 6, others to weekday-1
          const position = weekday === 0 ? 6 : weekday - 1
          if (position >= 0 && position < 7) {
            binary[position] = '1'
          }
        }

        return binary.join('')
      },
      repeatUntilHint() {
        if (!this.event.repeatsUntilDate || !this.event.eventDate || this.event.repeats === 'never') {
          return ''
        }

        const startDate = new Date(Number(this.event.eventDate) * 1000)
        const endDate = new Date(this.event.repeatsUntilDate)

        if (endDate <= startDate) {
          return ''
        }

        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        let totalOccurrences = 0
        let timePeriod = ''

        switch (this.event.repeats) {
          case 'daily': {
            if (this.event.weekdays && this.event.weekdays.length > 0) {
              // Count only selected weekdays within the date range
              let currentDate = new Date(startDate)
              while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay()
                if (this.event.weekdays.includes(dayOfWeek)) {
                  totalOccurrences++
                }
                currentDate.setDate(currentDate.getDate() + 1)
              }
            } else {
              // If no weekdays selected, count all days (inclusive)
              totalOccurrences = totalDays + 1
            }
            timePeriod = totalDays >= 7 ? `${Math.ceil(totalDays / 7)} ${this.$t('events.weeks')}` : `${totalDays + 1} ${this.$t('events.days')}`
            break
          }
          case 'weekly': {
            // Count actual weeks from start date
            let currentDate = new Date(startDate)
            while (currentDate <= endDate) {
              totalOccurrences++
              currentDate.setDate(currentDate.getDate() + 7)
            }
            const weeks = Math.ceil(totalDays / 7)
            timePeriod = `${weeks} ${this.$t('events.weeks')}`
            break
          }
          case 'monthly': {
            // Count actual months from start date
            let currentDate = new Date(startDate)
            while (currentDate <= endDate) {
              totalOccurrences++
              currentDate.setMonth(currentDate.getMonth() + 1)
            }
            const months = Math.ceil(totalDays / 30)
            timePeriod = `${months} ${this.$t('events.months')}`
            break
          }
        }

        if (totalOccurrences > 0) {
          return this.$t('events.repeat_hint', {
            count: totalOccurrences,
            period: timePeriod
          })
        }

        return ''
      },
      recurringDates() {
        if (!this.event.eventDate || !this.event.repeats || this.event.repeats === 'never') {
          return []
        }

        const startDate = new Date(Number(this.event.eventDate) * 1000)
        const endDate = this.event.repeatsUntilDate ? new Date(this.event.repeatsUntilDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default to 1 year ahead
        const dates = []

        // Generate dates based on repeat pattern
        let currentDate = new Date(startDate)

        while (currentDate <= endDate) {
          let shouldInclude = false

          switch (this.event.repeats) {
            case 'daily': {
              if (this.event.weekdays && this.event.weekdays.length > 0) {
                const dayOfWeek = currentDate.getDay()
                shouldInclude = this.event.weekdays.includes(dayOfWeek)
              } else {
                shouldInclude = true
              }
              break
            }
            case 'weekly': {
              const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              shouldInclude = daysDiff % 7 === 0
              break
            }
            case 'monthly': {
              shouldInclude = currentDate.getDate() === startDate.getDate()
              break
            }
          }

          if (shouldInclude) {
            const year = currentDate.getFullYear()
            const month = String(currentDate.getMonth() + 1).padStart(2, '0')
            const day = String(currentDate.getDate()).padStart(2, '0')
            dates.push(`${year}-${month}-${day}`)
          }

          // Move to next occurrence
          switch (this.event.repeats) {
            case 'daily': {
              currentDate.setDate(currentDate.getDate() + 1)
              break
            }
            case 'weekly': {
              currentDate.setDate(currentDate.getDate() + 7)
              break
            }
            case 'monthly': {
              currentDate.setMonth(currentDate.getMonth() + 1)
              break
            }
          }
        }

        return dates
      },
      dropdownZIndex() {
        const { calculateZIndex } = useZIndex()
        return calculateZIndex(10_000)
      },
      dateLocale() {
        // Map app locales to BCP 47 language tags for Vuetify v-date-picker
        const appLocale = this.$i18n?.locale || 'en'
        const localeMap = {
          'en': 'en-US',
          'fi': 'fi-FI'
        }
        return localeMap[appLocale] || 'en-US'
      },
      dateFirstDayOfWeek() {
        // Start week on Monday for Finnish, Sunday otherwise by default
        return this.$i18n?.locale === 'fi' ? 1 : 0
      },
      titleRules() {
        return [
          (v: string) => !!(v && v.trim().length > 0) || this.$t('events.titleRequired')
        ]
      },
      eventTypes() {
        return [
          { title: this.$t('events.practise'), value: 'practise', color: '#1e88e5' },
          { title: this.$t('events.match'), value: 'match', color: '#e53935' },
          { title: this.$t('events.meeting'), value: 'meeting', color: '#8e24aa' },
          { title: this.$t('events.self_directed_training'), value: 'self_training', color: '#43a047', noStartAndEnd: true },
          { title: this.$t('events.other_event'), value: 'other_event', color: 'grey' }
        ]
      },
      formattedEventDate() {
        // Prefer pickerDate (YYYY-MM-DD) to avoid any TZ conversion
        if (this.pickerDate) {
          const parts = this.pickerDate.split('-')
          if (parts.length === 3) {
            const [y, m, d] = parts.map(Number)
            const dateObj = new Date(y, m - 1, d)
            const locale = this.dateLocale
            const formatter = new Intl.DateTimeFormat(locale, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })
            return formatter.format(dateObj)
          }
        }
        if (!this.event.eventDate) return ''
        const ms = Number(this.event.eventDate) * 1000
        if (!Number.isFinite(ms) || ms <= 0) return ''
        const d = new Date(ms)

        // Use locale-specific formatting
        const locale = this.dateLocale
        const formatter = new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })

        return formatter.format(d)
      },
      finalEvent() {
        // Single source of truth for the payload saved to backend
        const eventDateStr = this.pickerDate || (() => {
          const sec = Number(this.event.eventDate)
          if (!Number.isFinite(sec) || sec <= 0) return ''
          const d = new Date(sec * 1000)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        })()
        // Map to backend schema
        const payload = {
          title: (this.event.title || '').trim(),
          // Send as YYYY-MM-DD to backend
          eventDate: eventDateStr,
          type: this.event.eventType,
          startTime: this.event.startTime,
          endTime: this.event.endTime,
          // start/end unix conditionally added below
          notes: (this.event.notes || '').trim() || null,
          coachesNotes: (this.event.coachesNotes || '').trim() || null,
          ownNotes: (this.event.ownNotes || '').trim() || null,
          repeats: this.event.repeats === 'never' ? undefined : this.event.repeats,
          repeatsOn: this.event.repeats === 'daily' ? this.weekdaysBinary : null,
          repeatsUntilUnixSec: (this.event.repeats && this.event.repeats !== 'never') ? this.repeatsUntilUnixSec : undefined,
          locationId: this.event.locationId,
        }

        // For noStartAndEnd events (like self_training), only send durationInMinutes
        if (this.currentEventTypeHasNoStartAndEnd) {
          const durationInMinsNum = Number(this.event.durationInMinutes)
          if (Number.isFinite(durationInMinsNum) && durationInMinsNum > 0) {
            payload['durationInMinutes'] = durationInMinsNum
          }
        } else {
          // For other events, include unix times
          const s = Number(this.startTimeUnixSec)
          const e = Number(this.endTimeUnixSec)
          if (Number.isFinite(s)) payload['startTimeUnixSec'] = s
          if (Number.isFinite(e)) payload['endTimeUnixSec'] = e
        }
        return payload
      }
    },
    watch: {
      edit: {
        handler(newVal) {
          if (newVal) {
            this.initializeEventData()
          }
        },
        immediate: false
      }
    },
    async mounted() {
      await this.eventStore.initCreatePlanData()
      await this.fetchTeamLocations()

      // Initialize event data if editing
      if (this.isEditing && this.edit) {
        this.initializeEventData()
      }
    },
    methods: {
      showMe(key: string) {
        const showMap = {
          // practise, match, meeting, self_training, other_event
          startTime: ['practise', 'match', 'meeting', 'other_event'],
          endTime: ['practise', 'match', 'meeting', 'other_event'],
          durationInMinutes: ['self_training'],
          date: ['all'],
          repeats: ['all'],
          weekdays: ['all'],
          repeatsUntilDate: ['all'],
          notes: ['all'],
          title: ['all'],
          locationId: ['practise', 'match', 'meeting', 'other_event'],
          plan: ['all']
        }
        return this.event.eventType && (showMap[key]?.includes(this.event.eventType) || showMap[key]?.includes('all'))
      },
      initializeEventData() {
        if (!this.edit) return

        // Derive event date values. Prefer startTimeUnixSec if present
        let yyyyMmDd = ''
        if (this.edit.startTimeUnixSec && Number(this.edit.startTimeUnixSec) > 0) {
          yyyyMmDd = this.formatDateFromUnixSec(this.edit.startTimeUnixSec)
        } else {
          // Normalize various eventDate formats to YYYY-MM-DD in LOCAL time
          const raw = this.edit.eventDate
          if (typeof raw === 'string') {
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
              yyyyMmDd = raw
            } else if (raw.includes('T')) {
              const d = new Date(raw)
              if (Number.isNaN(d.getTime())) {
                yyyyMmDd = raw.slice(0, 10)
              } else {
                const y = d.getFullYear()
                const m = String(d.getMonth() + 1).padStart(2, '0')
                const da = String(d.getDate()).padStart(2, '0')
                yyyyMmDd = `${y}-${m}-${da}`
              }
            } else {
              // Fallback try Date parsing
              const d = new Date(raw)
              if (Number.isNaN(d.getTime())) {
                yyyyMmDd = ''
              } else {
                const y = d.getFullYear()
                const m = String(d.getMonth() + 1).padStart(2, '0')
                const da = String(d.getDate()).padStart(2, '0')
                yyyyMmDd = `${y}-${m}-${da}`
              }
            }
          } else if (typeof raw === 'number') {
            // Heuristic: if it's seconds, it's around 10 digits; if ms, 13 digits
            const n = Number(raw)
            const ms = n > 1e12 ? n : n * 1000
            const d = new Date(ms)
            if (Number.isNaN(d.getTime())) {
              // leave as empty
            } else {
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const da = String(d.getDate()).padStart(2, '0')
              yyyyMmDd = `${y}-${m}-${da}`
            }
          } else {
            yyyyMmDd = ''
          }
        }
        const eventDateUnix = yyyyMmDd ? this.yyyyMmDdToLocalMidnightUnixSec(yyyyMmDd) : ''

        // Decode repeatsOn binary to weekday numbers (Mon=1..Sun=0)
        let decodedWeekdays = []
        if (typeof this.edit.repeatsOn === 'string' && this.edit.repeatsOn.length === 7) {
          decodedWeekdays = this.decodeWeekdaysFromBinary(this.edit.repeatsOn)
        } else if (Array.isArray(this.edit.repeatsOn)) {
          decodedWeekdays = this.edit.repeatsOn
        }

        // Derive repeatsUntilDate as YYYY-MM-DD from unix seconds (if provided)
        const repeatsUntilDateStr = (this.edit.repeatsUntilUnixSec && Number(this.edit.repeatsUntilUnixSec) > 0)
          ? this.formatDateFromUnixSec(this.edit.repeatsUntilUnixSec)
          : ''

        // Map the edit event data to our form structure
        this.event = {
          title: this.edit.title || '',
          eventType: this.edit.type || '',
          // Store unix seconds (string) for eventDate
          eventDate: eventDateUnix ? String(eventDateUnix) : '',
          startTime: this.edit.startTimeUnixSec ? this.formatTimeFromUnix(this.edit.startTimeUnixSec) : '',
          endTime: this.edit.endTimeUnixSec ? this.formatTimeFromUnix(this.edit.endTimeUnixSec) : '',
          durationInMinutes: this.edit.durationInMinutes || null,
          notes: this.edit.notes || '',
          coachesNotes: this.edit.coachesNotes || '',
          ownNotes: this.edit.ownNotes || '',
          repeats: this.edit.repeats || 'never',
          weekdays: decodedWeekdays,
          repeatsUntilDate: repeatsUntilDateStr,
          locationId: this.edit.locationId || null,
        }

        // Set picker dates
        this.pickerDate = yyyyMmDd || ''
        this.endPickerDate = repeatsUntilDateStr
      },
      yyyyMmDdToLocalMidnightUnixSec(v) {
        if (!v || typeof v !== 'string') return ''
        const parts = v.split('-')
        if (parts.length !== 3) return ''
        const [yStr, mStr, dStr] = parts
        const y = Number(yStr)
        const m = Number(mStr)
        const d = Number(dStr)
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
        const local = new Date(y, m - 1, d)
        const sec = Math.floor(local.getTime() / 1000)
        return Number.isFinite(sec) ? sec : ''
      },
      formatDateFromUnixSec(unixSec) {
        const n = Number(unixSec)
        if (!Number.isFinite(n) || n <= 0) return ''
        const d = new Date(n * 1000)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      },
      decodeWeekdaysFromBinary(binaryStr) {
        // binaryStr: 7 chars, Monday-first. '1' means included.
        // Returns array of JS weekday numbers: Sun=0, Mon=1, ... Sat=6
        if (!binaryStr || binaryStr.length !== 7) return []
        const result = []
        for (let i = 0; i < 7; i++) {
          const char = binaryStr[i]
          if (char === '1') {
            // Map position to weekday value
            // positions 0..5 -> 1..6 (Mon..Sat), position 6 -> 0 (Sun)
            const value = i === 6 ? 0 : i + 1
            result.push(value)
          }
        }
        return result
      },
      formatDateForPicker(dateString) {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
      },
      formatTimeFromUnix(unixSec) {
        if (!unixSec) return ''
        const date = new Date(unixSec * 1000)
        return date.toTimeString().slice(0, 5) // HH:MM format
      },
      toggleEdit() {
        this.editing = !this.editing
      },
      cancel() {
        this.$emit('close')
      },
      save() {
        if (!this.formValid) return

        // Extra guard validations mirroring backend schema
        // For noStartAndEnd events (like self_training), durationInMinutes is required
        if (this.currentEventTypeHasNoStartAndEnd) {
          const duration = Number(this.event.durationInMinutes)
          if (!Number.isFinite(duration) || duration <= 0) {
            return
          }
        } else {
          // For other events, start and end times are required
          const s = Number(this.startTimeUnixSec)
          const e = Number(this.endTimeUnixSec)
          if (Number.isFinite(s) && Number.isFinite(e)) {
            if (s <= 0 || e <= 0) {
              // Let field rules surface the error; stop submit
              return
            }
            if (s >= e) {
              return
            }
          }
        }

        if (this.finalEvent.repeats === 'weekly' && (!Array.isArray(this.event.weekdays) || this.event.weekdays.length === 0)) {
          return
        }
        if (this.finalEvent.repeats && this.finalEvent.repeats !== 'never' && !this.event.repeatsUntilDate) {
          return
        }

        this.saving = true

        // Choose the appropriate save method based on edit mode
        const savePromise = this.isEditing
          ? this.eventStore.updateEvent(this.edit.id, this.finalEvent)
          : this.eventStore.saveEvent(this.finalEvent)

        savePromise
          .then(async (res) => {
            if (res?.success) {
              // Save plan if it exists and has content
              if (this.showMe('plan') && this.$refs.createPlanRef) {
                try {
                  const eventId = this.isEditing ? this.edit.id : (res.data?.id || res.data?.eventId)
                  await this.savePlan(eventId)
                } catch (planError) {
                  console.warn('Failed to save plan:', planError)
                  // Don't fail the entire save if plan saving fails
                }
              }

              const successMessage = this.isEditing
                ? this.$t('events.event_updated') || 'Event updated'
                : this.$t('events.event_saved') || 'Event created'
              this.notificationStore.success(successMessage)
              this.$emit('saved', res?.data || this.finalEvent)
              this.$emit('close')
            } else {
              const message = res?.message || this.$t('something_went_wrong')
              this.notificationStore.error(message)
            }
          })
          .catch((error) => {
            this.notificationStore.handleBackendError(error)
          })
          .finally(() => {
            this.saving = false
          })
      },
      savePlan(eventId) {
        if (!this.$refs.createPlanRef) {
          console.warn('CreatePlan component not found')
          return Promise.resolve()
        }

        // Call the savePlan method on CreatePlan component
        // This will handle the API call to POST /plan
        return this.$refs.createPlanRef.savePlan(eventId)
      },
      async fetchTeamLocations() {
        try {
          this.loadingLocations = true
          const teamId = this.userStore.currentTeamId
          if (!teamId) return
          const res = await api.get(`/location/team/${teamId}`)
          const list = res?.data?.data?.locations || []
          this.teamLocations = Array.isArray(list) ? list : []
        } catch (error) {
          console.error('Failed to fetch team locations', error)
        } finally {
          this.loadingLocations = false
        }
      },
      openCreateLocation() {
        this.locationMenuOpen = false
        this.showCreateLocation = true
        // Blur the autocomplete input to unfocus it
        this.$nextTick(() => {
          const autocomplete = this.$refs.locationAutocomplete as any
          const input = autocomplete?.$el?.querySelector('input')
          if (input && typeof input.blur === 'function') {
            input.blur()
          }
        })
      },
      async handleLocationCreated(payload) {
        this.showCreateLocation = false
        await this.fetchTeamLocations()
        // Try to select the newly created location by providerPlaceId if we have it
        if (payload && payload.providerPlaceId) {
          const created = (this.teamLocations || []).find((l: any) => l.providerPlaceId === payload.providerPlaceId)
          if (created && created.id) {
            this.event.locationId = created.id
            this.locationMenuOpen = false
            return
          }
        }
        // Fallback: if only one new item was added, pick the last one
        if (Array.isArray(this.teamLocations) && this.teamLocations.length > 0) {
          // Pick last item
          const last = (this.teamLocations as any[]).at(-1)
          this.event.locationId = (last && (last as any).id) || this.event.locationId
        }
        this.locationMenuOpen = false
      },
      combineDateAndTimeToUnix(eventDateSec, timeStr) {
        // Expect eventDateSec as Unix seconds (string or number) and timeStr as 'HH:mm'
        const dateSecNum = Number(eventDateSec)
        if (!dateSecNum || !Number.isFinite(dateSecNum)) return ''
        if (!timeStr || typeof timeStr !== 'string') return ''
        const [hhStr, mmStr] = timeStr.split(':')
        const hours = Number(hhStr)
        const minutes = Number(mmStr)
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return ''
        const base = new Date(dateSecNum * 1000)
        base.setHours(hours, minutes, 0, 0)
        const sec = Math.floor(base.getTime() / 1000)
        return Number.isFinite(sec) ? sec : ''
      },
      onPickDate(val) {
        // Accept Date | string (YYYY-MM-DD) | Date[] | string[]
        if (!val) {
          this.event.eventDate = ''
          this.pickerDate = ''
          return
        }

        let dateObj
        if (Array.isArray(val)) {
          const first = val[0]
          if (!first) return
          dateObj = first instanceof Date ? first : (typeof first === 'string' ? new Date(first) : null)
        } else if (val instanceof Date) {
          dateObj = val
        } else if (typeof val === 'string') {
          // Prefer parsing as YYYY-MM-DD to avoid TZ shifts
          const parts = val.split('-')
          if (parts.length === 3) {
            const [y, m, d] = parts.map(Number)
            dateObj = new Date(y, m - 1, d)
          } else {
            dateObj = new Date(val)
          }
        }

        if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return

        const yyyy = dateObj.getFullYear()
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
        const dd = String(dateObj.getDate()).padStart(2, '0')

        // Normalize to local midnight to avoid TZ issues, store as unix seconds
        const atLocalMidnight = new Date(yyyy, Number(mm) - 1, Number(dd))
        this.event.eventDate = Math.floor(atLocalMidnight.getTime() / 1000).toString()
        this.pickerDate = `${yyyy}-${mm}-${dd}`

        // Set default start and end times if not already set
        if (!this.event.startTime) {
          this.event.startTime = '18:00'
        }
        if (!this.event.endTime) {
          this.event.endTime = '20:00'
        }

        this.dateMenu = false
      },
      onPickEndDate(val) {
        // Accept Date | string (YYYY-MM-DD) | Date[] | string[]
        if (!val) {
          this.event.repeatUntil = ''
          this.endPickerDate = ''
          return
        }

        let dateObj
        if (Array.isArray(val)) {
          const first = val[0]
          if (!first) return
          dateObj = first instanceof Date ? first : (typeof first === 'string' ? new Date(first) : null)
        } else if (val instanceof Date) {
          dateObj = val
        } else if (typeof val === 'string') {
          // Prefer parsing as YYYY-MM-DD to avoid TZ shifts
          const parts = val.split('-')
          if (parts.length === 3) {
            const [y, m, d] = parts.map(Number)
            dateObj = new Date(y, m - 1, d)
          } else {
            dateObj = new Date(val)
          }
        }

        if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return

        const yyyy = dateObj.getFullYear()
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
        const dd = String(dateObj.getDate()).padStart(2, '0')

        // Store as YYYY-MM-DD format
        this.event.repeatsUntilDate = `${yyyy}-${mm}-${dd}`
        this.endPickerDate = `${yyyy}-${mm}-${dd}`
        this.endDateMenu = false
      },
      isRecurringDate(date) {
        if (!this.recurringDates || this.recurringDates.length === 0) {
          return false
        }

        // Use the isoDate property which is already in YYYY-MM-DD format
        return this.recurringDates.includes(date.isoDate)
      },
      isEventDay(date) {
        if (!this.event.eventDate) {
          return false
        }

        // Convert event date from Unix seconds to YYYY-MM-DD format
        const eventDate = new Date(Number(this.event.eventDate) * 1000)
        const year = eventDate.getFullYear()
        const month = String(eventDate.getMonth() + 1).padStart(2, '0')
        const day = String(eventDate.getDate()).padStart(2, '0')
        const eventDateString = `${year}-${month}-${day}`

        return date.isoDate === eventDateString
      },
      removeWeekday(value) {
        this.event.weekdays = this.event.weekdays.filter(day => day !== value)
      },
      toggleWeekday(value) {
        if (this.event.weekdays.includes(value)) {
          this.event.weekdays = this.event.weekdays.filter(day => day !== value)
        } else {
          this.event.weekdays.push(value)
        }
      }
    }
  }
</script>

<style scoped>
  :deep(.date-menu-content) {
    padding: 0;
  }
  .color-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .day-button {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 40px;
    min-height: 40px;
    border-radius: 50%;
  }

  .day-number {
    font-size: 14px;
    font-weight: 500;
  }

  .recurring-day {
    background-color: #e3f2fd !important;
    color: #1976d2 !important;
  }

  .recurring-day:hover {
    background-color: #bbdefb !important;
  }

  .recurring-selected {
    border: 2px solid #000000 !important;
    box-shadow: 0 0 0 1px #000000 !important;
  }

  .event-day {
    border: 2px solid #1565c0 !important;
    box-shadow: 0 0 0 1px #1565c0 !important;
  }


</style>
