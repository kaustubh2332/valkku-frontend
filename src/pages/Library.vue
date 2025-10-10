<template>
  <div class="text-h4 my-4">
    {{ $t('library.title') }}
  </div>

  <v-tabs
    class="mb-4"
    :model-value="currentTab"
  >
    <v-tab
      :to="{ name: 'LibraryPracticePlans' }"
      value="practice-plans"
    >
      <v-icon class="mr-2">mdi-notebook-outline</v-icon>
      {{ $t('library.practise_plans') }}
    </v-tab>
    <v-tab
      :to="{ name: 'LibraryPlanParts' }"
      value="plan-parts"
    >
      <v-icon class="mr-2">mdi-vector-intersection</v-icon>
      {{ $t('library.plan_parts') }}
    </v-tab>
  </v-tabs>

  <v-tabs v-model="chosenScope" class="mb-4" density="compact">
    <v-tab value="global">
      <v-icon class="mr-2">mdi-border-all-variant</v-icon>
      {{ $t('library.global') }}
    </v-tab>
    <v-tab value="team">
      <v-icon class="mr-2">mdi-account-group-outline</v-icon>
      {{ $t('library.team') }}
    </v-tab>
    <v-tab value="user">
      <v-icon class="mr-2">mdi-account-outline</v-icon>
      {{ $t('library.own') }}
    </v-tab>
  </v-tabs>
  <!-- Practice Plans -->
  <div v-if="$route.name === 'LibraryPracticePlans'">
    <EventsTable />
  </div>

  <!-- Plan Parts -->
  <div v-if="$route.name === 'LibraryPlanParts'">
    <ExercisesTable />
  </div>
</template>

<script lang="ts">
  export default {
    data() {
      return {
        chosenScope: 'global'
      }
    },
    computed: {
      currentTab() {
        const routeMap = {
          'LibraryPracticePlans': 'practice-plans',
          'LibraryPlanParts': 'plan-parts'
        }
        return routeMap[this.$route.name] || 'practice-plans'
      }
    }
  }
</script>
