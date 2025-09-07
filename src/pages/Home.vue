<template>
  <!-- Confetti trigger element at top of page -->
  <div id="confetti-trigger" style="position: fixed; top: 0; left: 50%; transform: translateX(-50%); width: 1px; height: 1px; z-index: 9999;" />

  <v-container>
    <div class="d-flex text-h4 text-md-h3 text-sm-h4 text-xs-h4 mt-4">
      {{ greeting }}, {{ userStore.firstName }}!
      <BigEmoji />
      <!-- {{ userStore.getUser }} -->
    </div>

    <v-row>
      <!-- Tulevat tapahtumat
      Menneet tapahtumat?
      Lisää harjoitus / tapahtuma
      Raportti
      Ohjeita käyttöön
      Tehtävät -->
    </v-row>
  </v-container>

  <Loading v-if="isLoading" />
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'Home',
    setup() {
      const { user } = useAuth0()
      const userStore = useUserStore()
      return { user, userStore }
    },
    data() {
      return {
        isLoading: false
      }
    },
    computed: {
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


</style>
