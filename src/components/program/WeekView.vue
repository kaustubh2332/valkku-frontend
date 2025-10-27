<template>
  <div class="week-view">
    <!-- Week Header with Navigation (optional) -->
    <div v-if="showNavigation" class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center ga-2">
        <v-btn
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          @click="$emit('prev-week')"
        />
        <v-btn
          color="primary"
          prepend-icon="mdi-calendar-today"
          size="small"
          variant="text"
          @click="$emit('go-today')"
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
        @click="$emit('next-week')"
      />
    </div>

    <!-- Week Days -->
    <div :class="containerClass">
      <v-hover
        v-for="d in weekDays"
        :key="d.iso"
        v-slot="{ isHovering, props }"
      >
        <div
          v-bind="props"
          :class="dayItemClass"
          @click="handleDateClick(d.date)"
          @mouseenter="$emit('day-hover', d.iso)"
        >
          <div class="text-caption text-medium-emphasis mb-2 font-weight-medium text-center">
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
              :class="avatarClasses(d, isHovering)"
              :color="isSelectedDay(d.date) ? 'primary' : undefined"
              :elevation="isHovering ? avatarHoverElevation : avatarElevation"
              :size="avatarSize"
              :variant="isSelectedDay(d.date) ? 'flat' : 'outlined'"
            >
              <span :class="avatarTextClass">{{ d.day }}</span>
            </v-avatar>
          </v-badge>
        </div>
      </v-hover>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'WeekView',
    props: {
      weekReferenceDate: {
        type: Date,
        required: true
      },
      selectedDate: {
        type: Date,
        default: null
      },
      weekEventsByIso: {
        type: Object,
        default: () => ({})
      },
      showNavigation: {
        type: Boolean,
        default: false
      },
      // Styling props for customization
      containerClass: {
        type: String,
        default: 'd-flex justify-space-between align-center'
      },
      dayItemClass: {
        type: String,
        default: 'text-center day-item'
      },
      avatarSize: {
        type: [Number, String],
        default: null
      },
      avatarElevation: {
        type: Number,
        default: 2
      },
      avatarHoverElevation: {
        type: Number,
        default: 8
      },
      avatarTextClass: {
        type: String,
        default: 'font-weight-bold'
      }
    },
    emits: ['date-selected', 'day-hover', 'prev-week', 'next-week', 'go-today'],
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
      },
      computedAvatarSize() {
        if (this.avatarSize) return this.avatarSize
        return this.$vuetify.display.xs ? 36 : 48
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
        const day = (d.getDay() + 6) % 7 // Monday = 0, Sunday = 6
        d.setDate(d.getDate() - day)
        d.setHours(0, 0, 0, 0)
        return d
      },
      isSameDay(a: Date, b: Date): boolean {
        if (!a || !b) return false
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
      },
      isSelectedDay(date: Date): boolean {
        return this.selectedDate && this.isSameDay(date, this.selectedDate)
      },
      handleDateClick(date: Date) {
        this.$emit('date-selected', date)
      },
      avatarClasses(d: any, isHovering: boolean) {
        const classes = ['day-avatar']
        if (d.isToday && !this.isSelectedDay(d.date)) {
          classes.push('today-highlight')
        }
        return classes.join(' ')
      }
    }
  }
</script>

<style scoped>
.day-item {
  flex: 1;
  cursor: pointer;
  transition: all 0.2s;
}

.day-avatar {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.today-highlight {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.15) !important;
}
</style>
