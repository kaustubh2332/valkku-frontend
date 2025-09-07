<template>

  <v-container>
    <div class="d-flex text-h4 text-md-h3 text-sm-h4 text-xs-h4 mt-4">
      {{ greeting }}, {{ userStore.firstName }}!
      <BigEmoji />
      <!-- {{ userStore.getUser }} -->
    </div>
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
    methods: {}
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
