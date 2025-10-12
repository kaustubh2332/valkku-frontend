<template>
  <div class="program-day px-1">
    <div class="py-4 py-md-8">
      <v-row justify="center">
        <v-col
          cols="12"
          lg="10"
          xl="8"
        >
          <!-- No date selected state -->
          <v-card
            v-if="!date"
            class="mb-6"
            elevation="2"
            rounded="xl"
          >
            <div class="pa-8 text-center">
              <v-icon
                class="mb-3"
                color="medium-emphasis"
                size="48"
              >
                mdi-calendar-cursor
              </v-icon>
              <div class="text-h6 text-medium-emphasis">
                {{ $t('events.select_a_day') }}
              </div>
            </div>
          </v-card>

          <!-- Loading State -->
          <div v-else-if="loading">
            <v-card
              class="mb-6"
              elevation="2"
              rounded="xl"
            >
              <v-skeleton-loader type="article, article" />
            </v-card>
          </div>

          <!-- Events List -->
          <div v-else-if="events && events.length > 0">
            <ProgramEvent
              v-for="event in events"
              :key="event.id"
              :event="event"
            />
          </div>

          <!-- No events state -->
          <v-card
            v-else
            class="mb-6"
            elevation="2"
            rounded="xl"
          >
            <div class="pa-8 text-center">
              <v-icon
                class="mb-3"
                color="medium-emphasis"
                size="48"
              >
                mdi-calendar-blank
              </v-icon>
              <div class="text-h6 text-medium-emphasis">
                {{ $t('events.no_events') }}
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'ProgramDay',
    props: {
      date: {
        type: Date,
        default: null
      },
      events: {
        type: Array,
        default: () => []
      },
      loading: {
        type: Boolean,
        default: false
      }
    }
  }
</script>

<style scoped>
.program-day {
  /* Allow content to define height */
  display: block;
}
</style>
