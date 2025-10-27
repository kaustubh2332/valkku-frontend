<template>
  <div class="calendar-toolbar">
    <div class="toolbar-left">
      <v-btn
        icon="mdi-chevron-left"
        size="small"
        variant="text"
        @click="$emit('prev')"
      />
      <v-btn
        color="primary"
        prepend-icon="mdi-calendar-today"
        size="small"
        variant="text"
        @click="$emit('today')"
      >
        {{ $t('calendar.today') }}
      </v-btn>
      <v-btn
        icon="mdi-chevron-right"
        size="small"
        variant="text"
        @click="$emit('next')"
      />
    </div>

    <div class="toolbar-right">
      <v-btn-toggle
        v-model="selectedView"
        color="primary"
        density="compact"
        mandatory
        variant="outlined"
        @update:model-value="$emit('view-change', $event)"
      >
        <v-btn
          size="small"
          value="multiMonthYear"
        >
          {{ $t('calendar.year') }}
        </v-btn>
        <v-btn
          size="small"
          value="dayGridMonth"
        >
          {{ $t('calendar.month') }}
        </v-btn>
        <v-btn
          size="small"
          value="timeGridWeek"
        >
          {{ $t('calendar.week') }}
        </v-btn>
        <v-btn
          size="small"
          value="timeGridDay"
        >
          {{ $t('calendar.day') }}
        </v-btn>
      </v-btn-toggle>

      <v-menu
        v-model="menu.show"
        class="ml-2"
        location="bottom end"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-dots-vertical"
            size="small"
            variant="text"
          />
        </template>
        <v-list
          density="compact"
          min-width="200"
        >
          <v-list-item
            prepend-icon="mdi-calendar-export"
            @click="$emit('export-calendar')"
          >
            <v-list-item-title>{{ $t('calendar.export_events') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'CalendarToolbar',
    props: {
      title: {
        type: String,
        required: true
      },
      currentView: {
        type: String,
        default: 'dayGridMonth'
      }
    },
    emits: ['prev', 'next', 'today', 'view-change', 'export-calendar'],
    data() {
      return {
        selectedView: this.currentView,
        menu: {
          show: false
        }
      }
    },
    watch: {
      currentView(newView) {
        this.selectedView = newView
      }
    }
  }
</script>

<style scoped>
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.toolbar-title {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0;
  color: rgba(0, 0, 0, 0.87);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .calendar-toolbar {
    flex-direction: column;
    gap: 16px;
    padding: 12px 0;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .toolbar-center {
    order: -1;
  }

  .toolbar-title {
    font-size: 1.25rem;
  }

  .toolbar-right {
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .toolbar-left {
    gap: 4px;
  }

  .toolbar-right {
    gap: 2px;
  }

  .toolbar-title {
    font-size: 1.125rem;
  }
}
</style>
