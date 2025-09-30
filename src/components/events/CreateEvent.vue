<template>
  <div class="pa-2">
    <v-form ref="form" v-model="formValid" class="mb-4" @submit.prevent="save">
      <v-row>
        <v-col cols="12" md="6">
          <!-- Event Type -->
          <v-select
            v-model="eventType"
            density="compact"
            hide-details="auto"
            item-title="title"
            item-value="value"
            :items="eventTypes"
            :label="$t('events.event_type')"
            :menu-props="{ zIndex: dropdownZIndex }"
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
        <v-col v-if="showMe('date')" cols="12" md="6">
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
                variant="outlined"
              />
            </template>
            <v-date-picker
              v-model="pickerDate"
              :first-day-of-week="dateFirstDayOfWeek"
              hide-header
              :locale="dateLocale"
              @update:model-value="onPickDate"
            />
          </v-menu>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="title"
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
            v-model="startTime"
            density="compact"
            hide-details="auto"
            :label="$t('events.start_time')"
            type="time"
            variant="outlined"
          />
        </v-col>
        <v-col v-if="showMe('endTime')" cols="6" md="3">
          <v-text-field
            v-model="endTime"
            density="compact"
            hide-details="auto"
            :label="$t('events.end_time')"
            type="time"
            variant="outlined"
          />
        </v-col>
        <v-col v-if="showMe('durationMins')" cols="12" md="6">
          <v-text-field
            v-model="durationMins"
            density="compact"
            hide-details="auto"
            :label="$t('events.duration_minutes')"
            variant="outlined"
          />
        </v-col>
      </v-row>

      <!-- Notes Row -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-textarea
            v-model="notes"
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
            v-model="coachNotes"
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
            v-model="ownNotes"
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

      <div class="d-flex align-center mb-4">
        <div class="text-h6">
          {{ $t('events.event_plan') }}
        </div>
        <v-spacer />
        <v-tooltip v-if="!editing" location="bottom" :z-index="dropdownZIndex">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
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
              icon="mdi-check"
              size="small"
              variant="text"
              @click="toggleEdit"
            />
          </template>
          {{ $t('events.stop_editing_event_plan') }}
        </v-tooltip>
      </div>

      <CreatePlan :editing="editing" />

    </v-form>
    <div class="d-flex justify-end ga-2 mt-4">
      <v-btn variant="text" @click="cancel">{{ $t('cancel') }}</v-btn>
      <v-spacer />
      <v-btn color="primary" :disabled="!formValid" @click="save">{{ $t('events.create_event') }}</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
  import { useZIndex } from '@/composables/useZIndex'
  import { useEventStore } from '@/stores/event'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'CreateEvent',
    emits: ['close', 'saved'],
    setup() {
      const eventStore = useEventStore()
      const userStore = useUserStore()
      const currentRoleId = userStore.currentRoleId
      return { eventStore, userStore, currentRoleId }
    },
    data() {
      return {
        formValid: false,
        title: '',
        eventType: '',
        eventDate: '',
        pickerDate: '',
        dateMenu: false,
        startTime: '',
        endTime: '',
        durationMins: null,
        notes: '',
        coachNotes: '',
        ownNotes: '',
        editing: true
      }
    },
    computed: {
      dropdownZIndex() {
        const { calculateZIndex } = useZIndex()
        return calculateZIndex(10_000)
      },
      dateLocale() {
        // Map app locales to date-fns or Intl locales if needed
        // Vuetify v-date-picker accepts BCP 47 language tags
        return this.$i18n?.locale || 'en'
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
          { title: this.$t('events.self_directed_training'), value: 'self_training', color: '#43a047' },
          { title: this.$t('events.other_event'), value: 'other_event', color: 'grey' }
        ]
      },
      formattedEventDate() {
        if (!this.eventDate) return ''
        const ms = Number(this.eventDate) * 1000
        if (!Number.isFinite(ms) || ms <= 0) return ''
        const d = new Date(ms)
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}.${mm}.${yyyy}`
      }
    },
    async mounted() {
      await this.eventStore.initCreateEventData()
    },
    methods: {
      showMe(key: string) {
        const showMap = {
          // practise, match, meeting, self_training, other_event
          startTime: ['practise', 'match', 'meeting', 'other_event'],
          endTime: ['practise', 'match', 'meeting', 'other_event'],
          durationMins: ['self_training'],
          date: ['all']
        }
        return this.eventType && (showMap[key]?.includes(this.eventType) || showMap[key]?.includes('all'))
      },
      cancel() {
        this.$emit('close')
      },
      save() {
        if (!this.formValid) return
        const payload = {
          title: this.title.trim(),
          eventType: this.eventType,
          eventDate: this.eventDate,
          startTime: this.startTime,
          endTime: this.endTime,
          notes: this.notes.trim(),
          coachNotes: this.coachNotes.trim()
        }
        this.$emit('saved', payload)
        this.$emit('close')
      },
      onPickDate(val) {
        // Accept Date | string (YYYY-MM-DD) | Date[] | string[]
        if (!val) {
          this.eventDate = ''
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
        this.eventDate = Math.floor(atLocalMidnight.getTime() / 1000).toString()
        this.pickerDate = `${yyyy}-${mm}-${dd}`
        this.dateMenu = false
      },
      toggleEdit() {
        this.editing = !this.editing
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
</style>
