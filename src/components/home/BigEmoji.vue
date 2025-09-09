<template>
  <!-- Emoji Click Count Display - Top Center of Page -->
  <div
    v-show="chipVisible && userStore.getUser?.emojiClickedCount"
    :class="['emoji-count-display', { show: chipVisible, hide: !chipVisible }]"
  >
    <v-icon class="me-1">mdi-cursor-pointer</v-icon>
    {{ userStore.getUser?.emojiClickedCount }}
  </div>

  <div
    class="ml-2 text-center"
    style="width: 50px;"
  >
    <div style="position: relative;">
      <div
        :class="['emoji-clickable', 'ml-2', { bounce: isBouncing }]"
        style="position: relative;"
        @click="shootEmoji"
      >
        {{ currentEmoji }}
      </div>
      <div id="emoji-trigger" style="position: absolute; bottom: -10px; left: 0; height: 10px; width: 10px; transform: translate(-50%, -50%);" />
    </div>
  </div>
</template>

<script lang="ts">
  import { useUserStore } from '@/stores/user'

  export default {
    name: 'BigEmoji',
    setup() {
      const userStore = useUserStore()
      return { userStore }
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
        isBouncing: false,
        justClicked: false,
        justClickedTimeout: null,
        chipVisible: false,
        clickTimestamps: []
      }
    },
    computed: {
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
      randomBetween(min: number, max: number): number {
        return Math.random() * (max - min) + min
      },
      checkRecentClicks() {
        const now = Date.now()
        const timeAgo = now - 3000

        // Filter clicks from the last 3 seconds
        this.clickTimestamps = this.clickTimestamps.filter(timestamp => timestamp > timeAgo)

        // Show chip if we have 5 or more clicks in the last 3 seconds
        if (this.clickTimestamps.length >= 5) {
          this.chipVisible = true
          // Set timeout to hide chip after 3 seconds of no activity
          if (this.justClickedTimeout) {
            clearTimeout(this.justClickedTimeout)
          }
          this.justClickedTimeout = setTimeout(() => {
            this.chipVisible = false
          }, 2000)
        } else {
          this.chipVisible = false
        }
      },
      shootEmoji() {
        // Record this click timestamp
        this.clickTimestamps.push(Date.now())

        // Check if we should show the chip based on recent clicks
        this.checkRecentClicks()

        // Trigger bounce animation
        this.justClicked = true
        this.isBouncing = true
        setTimeout(() => {
          this.isBouncing = false
        }, 300)

        // Increment emoji click count in user store
        this.userStore.incrementEmojiClickCount()

        // Increment click counter
        this.clickCount++

        // If we've reached 20 clicks, switch to custom emoji mode
        if (this.clickCount >= 2 && !this.isCustomEmoji) {
          this.isCustomEmoji = true
          this.clickCount = 0
        }

        // If we're in custom emoji mode and reached 5 clicks, change to next emoji
        if (this.isCustomEmoji && this.clickCount >= 5) {
          this.currentEmojiIndex = (this.currentEmojiIndex + 1) % this.positiveEmojis.length
          this.clickCount = 0
        }

        // Generate random angle from -200° to 20°

        const config = {
          angle: this.randomBetween(-200, 20),
          spread: this.randomBetween(30, 60),
          startVelocity: this.randomBetween(5, 30),
          elementCount: this.randomBetween(5, 30),
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
.emoji-clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.emoji-clickable.bounce {
  animation: bounce 0.01s ease-in-out;
}

@keyframes bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1.0); }
}

.emoji-count-display {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 9999;
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out, width 0.3s ease-in-out;

  /* Custom styling */
  background: linear-gradient(135deg, #01B0D8, #1976d2, #1565c0);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 40px;
  white-space: nowrap;
}

.emoji-count-display.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0px) scale(1);
  animation: chipBounce 0.5s ease-out;
}

.emoji-count-display.hide {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px) scale(0.9);
}

@keyframes chipBounce {
  0% {
    transform: translateX(-50%) translateY(-10px) scale(0.8);
  }
  50% {
    transform: translateX(-50%) translateY(5px) scale(1.1);
  }
  100% {
    transform: translateX(-50%) translateY(0px) scale(1);
  }
}
</style>
