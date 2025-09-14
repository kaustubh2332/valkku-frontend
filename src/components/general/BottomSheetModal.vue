<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="modal-overlay"
      :class="{
        'modal-overlay--mobile': $vuetify.display.mobile,
        'modal-overlay--closing': isClosing,
        'modal-overlay--nested': nested
      }"
      @click="handleOverlayClick"
    >
      <div
        ref="modalContainer"
        class="bottom-sheet-modal"
        :class="{ 'bottom-sheet-modal--mobile': $vuetify.display.mobile }"
      >
        <!-- Mobile: Bottom sheet -->
        <div
          v-if="$vuetify.display.mobile"
          class="bottom-sheet-mobile"
          :class="{
            'bottom-sheet-mobile--dragging': isDragging,
            'bottom-sheet-mobile--open': isOpen && !isDragging && isAnimating
          }"
          :style="{
            height: height,
            ...(isDragging || translateY !== 0 ? { transform: `translateY(${translateY}px)` } : {})
          }"
        >
          <!-- Drag area (top 60px for dragging) -->
          <div
            class="drag-area"
            @touchend="handleTouchEnd"
            @touchmove="handleTouchMove"
            @touchstart="handleTouchStart"
          >
            <!-- Drag handle -->
            <!-- <div class="drag-handle" /> -->

            <!-- Title for mobile -->
            <div v-if="title" class="mobile-title">
              <slot name="title">
                <span>{{ title }}</span>
              </slot>
            </div>

            <!-- Close button for mobile -->
            <v-btn
              class="close-button-mobile"
              icon="mdi-close"
              size="small"
              variant="text"
              @click.stop="close"
              @touchend.stop
              @touchmove.stop
              @touchstart.stop
            />
          </div>

          <!-- Content -->
          <div
            ref="contentArea"
            class="bottom-sheet-content"
            @touchend="handleContentTouchEnd"
            @touchmove="handleContentTouchMove"
            @touchstart="handleContentTouchStart"
          >
            <slot />
          </div>
        </div>

        <!-- Desktop: Centered dialog -->
        <v-card
          v-else
          class="bottom-sheet-desktop"
          max-height="90vh"
          max-width="100vw"
          min-width="800"
          style="width: 90% !important;"
          width="90%"
        >
          <v-card-title class="d-flex align-center justify-space-between">
            <slot name="title">
              <span>{{ title }}</span>
            </slot>
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="close"
            />
          </v-card-title>

          <v-card-text class="desktop-modal-content">
            <slot />
          </v-card-text>
        </v-card>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
  export default {
    name: 'BottomSheetModal',
    props: {
      modelValue: {
        type: Boolean,
        default: false
      },
      title: {
        type: String,
        default: ''
      },
      closeOnOutsideClick: {
        type: Boolean,
        default: true
      },
      height: {
        type: String,
        default: '80vh'
      },
      nested: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue', 'close'],
    data() {
      return {
        translateY: 0,
        startY: 0,
        isDragging: false,
        initialTranslateY: 0,
        maxTranslateY: 0,
        minTranslateY: 0,
        lastTouchY: 0,
        touchStartTime: 0,
        isAnimating: false,
        contentStartY: null,
        contentDragStarted: false,
        isClosing: false
      }
    },
    computed: {
      isOpen: {
        get() {
          return this.modelValue
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      }
    },
    watch: {
      isOpen(newValue) {
        if (newValue) {
          this.$nextTick(() => {
            this.setupMobileModal()
          })
          this.preventBodyScroll()
        } else {
          this.resetPosition()
          this.restoreBodyScroll()
        }
      }
    },
    methods: {
      setupMobileModal() {
        if (!this.$vuetify.display.mobile) return

        // Calculate modal height from prop
        const screenHeight = window.innerHeight
        let modalHeight

        if (this.height.includes('vh')) {
          // Handle viewport height (e.g., '80vh')
          const vhValue = Number.parseFloat(this.height.replace('vh', ''))
          modalHeight = screenHeight * (vhValue / 100)
        } else if (this.height.includes('px')) {
          // Handle pixel values (e.g., '100px')
          modalHeight = Number.parseFloat(this.height.replace('px', ''))
        } else {
          // Default to 80vh if format not recognized
          modalHeight = screenHeight * 0.8
        }

        // Set bounds for dragging
        this.maxTranslateY = screenHeight - modalHeight
        this.minTranslateY = screenHeight * 0.2 // Can be dragged up to 20% from top

        // Reset translateY to 0 for CSS-based animation
        this.translateY = 0

        // Start animation after a small delay to ensure initial state is rendered
        this.$nextTick(() => {
          // Force a reflow to ensure the modal is in hidden state
          this.$el.offsetHeight

          // Now trigger the animation
          setTimeout(() => {
            this.isAnimating = true
          }, 10)
        })
      },

      animateToPosition(targetY) {
        // Use CSS transition for smoother animation
        this.translateY = targetY
      },

      handleTouchStart(event) {
        if (!this.$vuetify.display.mobile) return
        console.log('touch start')

        this.isDragging = true
        this.startY = event.touches[0].clientY
        console.log('startY', this.startY)
        this.lastTouchY = this.startY
        console.log('lastTouchY', this.lastTouchY)

        // We don't need initialTranslateY since we're just tracking delta from start
        this.initialTranslateY = 0
        console.log('initialTranslateY:', this.initialTranslateY)

        this.touchStartTime = Date.now()

        // Prevent default to avoid scrolling
        event.preventDefault()
        event.stopPropagation()
      },

      handleTouchMove(event) {
        if (!this.isDragging || !this.$vuetify.display.mobile) return

        event.preventDefault()
        event.stopPropagation()

        const currentY = event.touches[0].clientY
        console.log('currentY:', currentY)
        const deltaY = currentY - this.startY
        console.log('deltaY:', deltaY)

        // translateY should be the delta from the starting position
        this.translateY = deltaY
        this.lastTouchY = currentY
      },

      handleTouchEnd(event) {
        if (!this.isDragging || !this.$vuetify.display.mobile) return

        this.isDragging = false

        // Calculate the actual drag distance from start to end
        const endY = event.changedTouches[0].clientY
        const actualDragDistance = endY - this.startY

        console.log('Touch end - startY:', this.startY, 'endY:', endY, 'dragDistance:', actualDragDistance)

        const threshold = window.innerHeight * 0.2 // 20% of screen height
        const touchDuration = Date.now() - this.touchStartTime
        const velocity = actualDragDistance / touchDuration

        console.log('Threshold:', threshold, 'Velocity:', velocity)

        // Only close if we've actually dragged down significantly
        const shouldClose = actualDragDistance > threshold || velocity > 0.5

        console.log('Should close:', shouldClose)

        if (shouldClose) {
          // Continue the drag motion smoothly to the bottom
          // First, stop dragging to re-enable CSS transitions
          this.isDragging = false
          this.isClosing = true

          // Continue the drag motion to move the modal completely off screen
          // Calculate how much more we need to move to get off screen
          const currentDragDistance = this.translateY
          const modalHeight = this.getModalHeight()
          const remainingDistance = modalHeight - currentDragDistance

          // Set the final position to continue the drag motion
          this.translateY = currentDragDistance + remainingDistance

          setTimeout(() => {
            this.isOpen = false
          }, 250) // Match the CSS transition duration
        } else {
          // Reset translateY to let CSS handle the animation back to open
          this.translateY = 0
        }
      },

      calculateVelocity() {
        // Simple velocity calculation based on recent movement
        // In a real implementation, you'd track velocity over time
        return 0 // Placeholder - would need touch history tracking
      },

      getModalHeight() {
        const screenHeight = window.innerHeight
        let modalHeight

        if (this.height.includes('vh')) {
          // Handle viewport height (e.g., '80vh')
          const vhValue = Number.parseFloat(this.height.replace('vh', ''))
          modalHeight = screenHeight * (vhValue / 100)
        } else if (this.height.includes('px')) {
          // Handle pixel values (e.g., '100px')
          modalHeight = Number.parseFloat(this.height.replace('px', ''))
        } else {
          // Default to 80vh if format not recognized
          modalHeight = screenHeight * 0.8
        }

        return modalHeight
      },



      close() {
        this.isClosing = true
        if (this.$vuetify.display.mobile) {
          // Animate down and close
          this.animateToPosition(window.innerHeight)
          setTimeout(() => {
            this.isOpen = false
          }, 300)
        } else {
          this.isOpen = false
        }
      },

      resetPosition() {
        this.translateY = 0
        this.isDragging = false
        this.isAnimating = false
        this.isClosing = false
      },

      preventBodyScroll() {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
        document.body.style.top = `-${window.scrollY}px`
      },

      restoreBodyScroll() {
        // Restore body scroll when modal is closed
        const scrollY = document.body.style.top
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.top = ''
        window.scrollTo(0, Number.parseInt(scrollY || '0') * -1)
      },

      handleContentTouchStart(event) {
        if (!this.$vuetify.display.mobile) return

        // Check if content is scrolled to the top
        const contentElement = this.$refs.contentArea
        if (contentElement && contentElement.scrollTop > 0) {
          return // Don't handle drag if not at top
        }

        // Store initial touch position for content drag detection
        this.contentStartY = event.touches[0].clientY
        this.contentDragStarted = false
      },

      handleContentTouchMove(event) {
        if (!this.$vuetify.display.mobile) return

        // Check if content is scrolled to the top
        const contentElement = this.$refs.contentArea
        if (contentElement && contentElement.scrollTop > 0) {
          return // Don't handle drag if not at top
        }

        const currentY = event.touches[0].clientY
        const deltaY = currentY - this.contentStartY

        // Only start drag if moving down significantly (more than 10px)
        if (deltaY > 10 && !this.contentDragStarted) {
          this.contentDragStarted = true
          // Start the drag
          this.handleTouchStart(event)
        }

        // Continue drag if already started
        if (this.contentDragStarted && this.isDragging) {
          this.handleTouchMove(event)
        }
      },

      handleContentTouchEnd(event) {
        if (!this.$vuetify.display.mobile) return

        if (this.contentDragStarted && this.isDragging) {
          this.handleTouchEnd(event)
        }

        // Reset content drag state
        this.contentDragStarted = false
        this.contentStartY = null
      },

      handleOverlayClick(event) {
        // Only close if clicking on the overlay itself, not on the modal content
        if (event.target === event.currentTarget) {
          this.close()
        }
      }
    }
  }
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  transition: background-color 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-overlay--nested {
  background-color: transparent;
  z-index: 40000;
}

.modal-overlay--mobile {
  align-items: flex-end;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-overlay--mobile.modal-overlay--nested {
  background-color: transparent;
}

.modal-overlay--closing {
  background-color: rgba(0, 0, 0, 0);
}

.bottom-sheet-modal {
  position: relative;
}

.bottom-sheet-modal--mobile {
  background: transparent;
}

.bottom-sheet-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10001;
  will-change: transform;
  transform: translateY(100%);
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: visible;
}

.modal-overlay--nested .bottom-sheet-mobile {
  z-index: 40001;
}

.bottom-sheet-mobile--open {
  transform: translateY(0);
}

.drag-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  position: relative;
}

.mobile-title {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  text-align: center;
  max-width: calc(100% - 120px); /* Leave space for close button */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none; /* Don't interfere with drag gestures */
}

.drag-handle {
  width: 40px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.close-button-mobile {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  color: #666;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  touch-action: manipulation;
  z-index: 10;
  pointer-events: auto;
}

.modal-overlay--nested .close-button-mobile {
  z-index: 40010;
}

.close-button-mobile:hover {
  opacity: 1;
  color: #333;
}

.close-button-mobile:active {
  opacity: 0.8;
}

/* Dark mode support for close button */
.v-theme--dark .close-button-mobile {
  color: #aaa;
}

.v-theme--dark .close-button-mobile:hover {
  color: #fff;
}

.bottom-sheet-content {
  height: calc(100% - 60px);
  overflow-y: auto;
  overflow-x: visible;
  padding: 0 16px 16px;
  touch-action: auto;
  user-select: auto;
}

.bottom-sheet-desktop {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
  z-index: 10001;
}

.modal-overlay--nested .bottom-sheet-desktop {
  z-index: 40001;
}

.desktop-modal-content {
  max-height: calc(90vh - 120px); /* Subtract space for title and padding */
  overflow-y: auto;
  overflow-x: visible;
}

/* Custom scrollbar for desktop modal content */
.desktop-modal-content::-webkit-scrollbar {
  width: 6px;
}

.desktop-modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.desktop-modal-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.desktop-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Smooth transitions */
.bottom-sheet-mobile {
  will-change: transform;
}

.bottom-sheet-mobile--dragging {
  transition: none !important;
}

/* Prevent body scroll when modal is open on mobile */
:deep(.v-overlay__content) {
  overflow: visible;
}

/* Custom scrollbar for mobile content */
.bottom-sheet-content::-webkit-scrollbar {
  width: 4px;
}

.bottom-sheet-content::-webkit-scrollbar-track {
  background: transparent;
}

.bottom-sheet-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.bottom-sheet-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Ensure v-select dropdowns can extend beyond modal boundaries */
:deep(.v-select .v-field__overlay) {
  overflow: visible !important;
}

:deep(.v-select .v-list) {
  overflow: visible !important;
}

/* Nested modal v-select dropdowns need higher z-index */
.modal-overlay--nested :deep(.v-select .v-list) {
  z-index: 40002 !important;
}

.modal-overlay--nested :deep(.v-select .v-overlay) {
  z-index: 40002 !important;
}


/* Ensure desktop dialog is centered */
:deep(.v-dialog .v-overlay__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

:deep(.v-dialog .v-overlay__content > .v-card) {
  margin: 0;
}
</style>
