<template>
  <!-- Confetti trigger element at top of page -->
  <div id="confetti-trigger" style="position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 1px; height: 1px; z-index: 20050;" />
  <div class="d-flex text-h4 text-md-h3 text-sm-h4 text-xs-h4 mt-4">
    {{ greeting }}, {{ userStore.firstName }}!
    <BigEmoji />
  </div>
  <!-- <TeamRoleDisplay v-if="userStore.user?.teams?.length > 0" /> -->

  <Loading v-if="isLoading" />
  <v-row
    v-else
    class="my-8"
  >
    <v-col>
      <!-- <StunningButton
        block
        color="primary"
        :glow="true"
        :gradient="true"
        icon="mdi-plus"
        :text="$t('home.addEvent')"
        @click="handleGetStarted"
      /> -->
      <v-btn
        block
        color="primary"
        size="x-large"
        :text="$t('home.addEvent')"
        variant="tonal"
        @click="openCreateEvent"
      >
        <v-icon class="mr-2">mdi-plus</v-icon>
        <span v-if="userStore.isStaff">
          {{ $t('home.addEvent') }}
        </span>
        <span v-else>
          {{ $t('home.addEventOwn') }}
        </span>
      </v-btn>
    </v-col>
    <v-col>
      <v-btn
        block
        size="x-large"
        variant="tonal"
      >
        <v-icon class="mr-2">mdi-compass</v-icon>
        Mene johkin!
        <v-icon class="ml-2">mdi-arrow-right</v-icon>
      </v-btn>
    </v-col>
  </v-row>

  <!-- Additional content placeholders -->
  <v-row>
    <v-col cols="12" sm="6">
      <div class="my-3" style="height: 200px; background-color: #f0f0f0;">Tulevat tapahtumat</div>
    </v-col>
    <v-col cols="12" sm="6">
      <div class="my-3" style="height: 200px; background-color: #f0f0f0;">Tehtävät</div>
    </v-col>
    <v-col cols="12" sm="12">
      <div class="my-3" style="height: 300px; background-color: #f0f0f0;">Oma viikkoni (athlete & parent)</div>
    </v-col>
  </v-row>

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
  import CreateEvent from '@/components/events/CreateEvent.vue'
  import BottomSheetModal from '@/components/general/BottomSheetModal.vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'Home',
    components: { BottomSheetModal, CreateEvent },
    setup() {
      const userStore = useUserStore()
      return { userStore }
    },
    data() {
      return {
        isLoading: false,
        createEventOpen: false
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
    },
    methods: {
      openCreateEvent() {
        this.createEventOpen = true
      },
      onEventSaved(payload) {
        // Placeholder: integrate API later
        console.log('Event saved:', payload)
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

<style scoped>
.text-h3 {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.home-content {
  padding: 20px 0;
}

.button-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.button-section .stunning-button {
  min-width: 280px;
}

@media (max-width: 600px) {
  .button-section .stunning-button {
    min-width: 240px;
  }
}

</style>
