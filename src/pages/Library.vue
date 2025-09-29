<template>
  <div class="text-h4 my-4">
    {{ $t('library.title') }}
  </div>
  <v-tabs v-model="activeTab" :touch="false">
    <v-tab :value="0">
      <v-icon class="mr-2">mdi-notebook-outline</v-icon>
      {{ $t('library.practise_plans') }}
    </v-tab>
    <v-tab :value="1">
      <v-icon class="mr-2">mdi-vector-intersection</v-icon>
      {{ $t('library.plan_parts') }}
    </v-tab>
    <!-- <v-tab :value="2">
      <v-icon class="mr-2">mdi-file-outline</v-icon>
      {{ $t('library.files') }}
    </v-tab> -->
    <v-tab :value="3">
      <v-icon class="mr-2">mdi-file-outline</v-icon>
      {{ $t('library.plan_types') }}
    </v-tab>
  </v-tabs>
  <v-tabs v-model="chosenScope" class="mt-4" density="compact">
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
  <v-window v-model="activeTab" :touch="false">
    <v-window-item :value="0">
      <EventsTable />
    </v-window-item>
    <v-window-item :value="1">
      <ExercisesTable />
    </v-window-item>
    <!-- <v-window-item :value="2">
      <FilesTable />
    </v-window-item> -->
    <v-window-item :value="3">
      <PlanPartsTable />
    </v-window-item>
  </v-window>
</template>

<script lang="ts">
  export default {
    data() {
      return {
        activeTab: 0,
        chosenScope: 'global'
      }
    }
  }
</script>
