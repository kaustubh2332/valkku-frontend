<template>
  <v-container>
    <div class="text-h3 mt-4">{{ greeting }}! {{ currentEmoji }}</div>
  </v-container>
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'

  export default {
    name: 'Home',
    setup() {
      const { user } = useAuth0()
      return { user }
    },
    data() {
      return {
        positiveEmojis: [
          '💪', '🔥', '⚡', '🚀', '🎯', '🏆', '💎', '⭐',
          '🌲', '🦅', '🐺', '🦁', '🐻', '🦊', '🎸'
        ]
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
      },
      currentEmoji() {
        const hour = new Date().getHours()
        const emojiIndex = hour % this.positiveEmojis.length
        return this.positiveEmojis[emojiIndex]
      }
    }
  }
</script>
