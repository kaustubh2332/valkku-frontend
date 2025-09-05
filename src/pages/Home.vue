<template>
  <v-container>
    <div class="text-h4 text-md-h3 text-sm-h4 text-xs-h4 mt-4">
      {{ greeting }}!
      <span
        id="emoji-trigger"
        class="ml-2 text-center"
      >
        <span
          class="emoji-clickable"
          @click="shootEmoji"
        >
          {{ currentEmoji }}
        </span>
      </span>
    </div>
  </v-container>

  <Loading v-if="isLoading" />
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
        ],
        clickCount: 0,
        currentEmojiIndex: 0,
        isCustomEmoji: false,
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
      },
      currentEmoji() {
        // If we're in custom emoji mode, use the custom index, otherwise use hour-based
        if (this.isCustomEmoji) {
          return this.positiveEmojis[this.currentEmojiIndex]
        } else {
          const hour = new Date().getHours()
          const emojiIndex = hour % this.positiveEmojis.length
          return this.positiveEmojis[emojiIndex]
        }
      }
    },
    methods: {
      shootEmoji() {
        // Increment click counter
        this.clickCount++

        // If we've reached 20 clicks, switch to custom emoji mode
        if (this.clickCount >= 2 && !this.isCustomEmoji) {
          this.isCustomEmoji = true
          this.clickCount = 0
          console.log('Switched to custom emoji mode')
        }

        // If we're in custom emoji mode and reached 5 clicks, change to next emoji
        if (this.isCustomEmoji && this.clickCount >= 5) {
          this.currentEmojiIndex = (this.currentEmojiIndex + 1) % this.positiveEmojis.length
          this.clickCount = 0
          console.log('Changed to emoji index:', this.currentEmojiIndex)
        }

        // Generate random angle from 60° to -90°
        // 60° = down-right, -90° = straight up
        const randomAngle = Math.random() * 150 - 90 // Range: -90 to +60 degrees

        const config = {
          angle: randomAngle, // Random angle from 60° to -90°
          spread: 50,
          startVelocity: 20,
          elementCount: 15,
          elementSize: 30,
          emoji: [this.currentEmoji], // Use the current emoji
          lifetime: 200,
          position: 'fixed',
          zIndex: 9999
        }

        const { reward } = this.$reward('emoji-trigger', 'emoji', config)
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

.emoji-clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.emoji-clickable:hover {
  transform: scale(1.2);
}

.top-trigger {
  position: fixed;
  top: 0;
  left: 50%;
  width: 1px;
  height: 1px;
  pointer-events: none;
  z-index: -1;
}
</style>
