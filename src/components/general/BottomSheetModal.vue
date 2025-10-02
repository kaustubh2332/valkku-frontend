<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="modal-overlay"
      v-bind="$attrs"
      :class="{
        'modal-overlay--mobile': $vuetify.display.mobile,
        'modal-overlay--closing': isClosing,
        'modal-overlay--nested': nested
      }"
      :data-modal-id="modalId"
      :style="{ zIndex: modalZIndex, '--dropdown-z-index': dropdownZIndex }"
      @click="handleOverlayClick"
    >
      <div
        ref="modalContainer"
        class="bottom-sheet-modal"
        :class="{ 'bottom-sheet-modal--mobile': $vuetify.display.mobile }"
      >
        <!-- Mobile: Bottom sheet (freeze mode at open to avoid remount on resize) -->
        <div
          v-if="frozenIsMobile"
          class="bottom-sheet-mobile"
          :class="{
            'bottom-sheet-mobile--dragging': isDragging,
            'bottom-sheet-mobile--open': isOpen && !isDragging && isAnimating
          }"
          :style="{
            height: height,
            zIndex: contentZIndex,
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
              :style="{ zIndex: closeButtonZIndex }"
              variant="text"
              @click.stop="close"
              @touchend.stop
              @touchmove.stop
              @touchstart.stop
            />
          </div>

          <!-- Scrollable Content -->
          <div
            ref="contentArea"
            class="bottom-sheet-content"
            @touchend="handleContentTouchEnd"
            @touchmove="handleContentTouchMove"
            @touchstart="handleContentTouchStart"
          >
            <slot />
          </div>

          <!-- Actions (always visible) -->
          <div v-if="$slots.actions" class="bottom-sheet-actions">
            <slot name="actions" />
          </div>
        </div>

        <!-- Desktop: Centered dialog -->
        <v-card
          v-else
          class="bottom-sheet-desktop"
          max-height="90vh"
          :max-width="normalizedMaxWidth"
          :style="{ width: '90vw !important', zIndex: contentZIndex, display: 'flex', flexDirection: 'column' }"
          width="auto"
        >
          <!-- Desktop title -->
          <v-card-title v-if="title" class="desktop-title">
            <slot name="title">
              <span>{{ title }}</span>
            </slot>
          </v-card-title>

          <!-- Fixed close button -->
          <v-tooltip v-if="!$vuetify.display.mobile" location="bottom" :z-index="dropdownZIndex">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                class="desktop-close-button"
                icon="mdi-close"
                variant="text"
                @click="close"
              />
            </template>
            <div class="d-flex align-center">
              <v-hotkey :keys="'esc'" />
            </div>
          </v-tooltip>
          <v-btn
            v-else
            class="desktop-close-button"
            icon="mdi-close"
            variant="text"
            @click="close"
          />

          <v-card-text class="desktop-modal-content" style="flex: 1; overflow-y: auto;">
            <slot />
          </v-card-text>

          <!-- Desktop Actions (always visible) -->
          <v-card-actions v-if="$slots.actions" class="desktop-modal-actions">
            <slot name="actions" />
          </v-card-actions>
        </v-card>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
  export default {
    name: 'BottomSheetModal',
    inheritAttrs: false,
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
      },
      nestingLevel: {
        type: Number,
        default: 0
      },
      maxWidth: {
        type: [String, Number],
        default: '800'
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
        isClosing: false,
        frozenIsMobile: false,
        modalId: Math.random().toString(36).slice(2, 11)
      }
    },
    computed: {
      modalZIndex() {
        const baseZIndex = 25_000
        const nestingIncrement = 10_000
        return baseZIndex + (this.nestingLevel * nestingIncrement)
      },
      contentZIndex() {
        return this.modalZIndex + 1
      },
      closeButtonZIndex() {
        return this.modalZIndex + 10
      },
      dropdownZIndex() {
        return this.modalZIndex + 1000
      },
      normalizedMaxWidth() {
        const value = this.maxWidth
        if (typeof value === 'number') return `${value}px`
        const trimmed = String(value).trim()
        if (/\d(px|%|rem|em|vw|vh)$/i.test(trimmed)) return trimmed
        return `${Number.parseInt(trimmed, 10)}px`
      },
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
          // Freeze the mobile/desktop mode at the time of opening to avoid remount on resize
          this.frozenIsMobile = !!this.$vuetify.display.mobile
          this.$nextTick(() => {
            this.setupMobileModal()
          })
          this.preventBodyScroll()
          this.registerEscapeHandler()
        } else {
          this.resetPosition()
          this.restoreBodyScroll()
          this.unregisterEscapeHandler()
          // Reset frozen mode after close
          this.frozenIsMobile = !!this.$vuetify.display.mobile
        }
      }
    },
    beforeUnmount() {
      this.unregisterEscapeHandler()
    },
    methods: {
      setupMobileModal() {
        if (!this.$vuetify.display.mobile) return
        const screenHeight = window.innerHeight
        let modalHeight
        if (this.height.includes('vh')) {
          const vhValue = Number.parseFloat(this.height.replace('vh', ''))
          modalHeight = screenHeight * (vhValue / 100)
        } else if (this.height.includes('px')) {
          modalHeight = Number.parseFloat(this.height.replace('px', ''))
        } else {
          modalHeight = screenHeight * 0.8
        }
        this.maxTranslateY = screenHeight - modalHeight
        this.minTranslateY = screenHeight * 0.2
        this.translateY = 0
        this.$nextTick(() => {
          this.$el.offsetHeight
          setTimeout(() => { this.isAnimating = true }, 10)
        })
      },

      animateToPosition(targetY) {
        // Use CSS transition for smoother animation
        this.translateY = targetY
      },

      handleTouchStart(event) {
        if (!this.$vuetify.display.mobile) return

        this.isDragging = true
        this.startY = event.touches[0].clientY
        this.lastTouchY = this.startY

        // We don't need initialTranslateY since we're just tracking delta from start
        this.initialTranslateY = 0

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
        const deltaY = currentY - this.startY

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

        const threshold = window.innerHeight * 0.2 // 20% of screen height
        const touchDuration = Date.now() - this.touchStartTime
        const velocity = actualDragDistance / touchDuration

        // Only close if we've actually dragged down significantly
        const shouldClose = actualDragDistance > threshold || velocity > 0.5

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
        // Prevent body scroll when modal is open; support nested modals
        const lockCount = Number.parseInt(document.body.dataset.scrollLock || '0') + 1
        document.body.dataset.scrollLock = String(lockCount)
        if (lockCount > 1) return

        const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0
        document.body.dataset.scrollY = String(scrollY)
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
        document.body.style.top = `-${scrollY}px`
      },

      restoreBodyScroll() {
        // Restore body scroll when modal is closed; support nested modals
        const lockCount = Math.max(0, Number.parseInt(document.body.dataset.scrollLock || '0') - 1)
        document.body.dataset.scrollLock = String(lockCount)
        if (lockCount > 0) return

        const scrollYAttr = document.body.dataset.scrollY
        const scrollY = Number.parseInt(scrollYAttr || '0')
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.top = ''
        // Restore after styles are cleared
        window.scrollTo(0, scrollY)
        delete document.body.dataset.scrollY
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
      },

      setupGlobalEscapeListener() {
        if (!(window as any).modalGlobalEscapeHandler) {
          (window as any).modalGlobalEscapeHandler = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return

            // Prevent rapid repeat from closing multiple modals
            if ((window as any).modalEscLocked) {
              event.preventDefault()
              event.stopPropagation()
              return
            }

            const overlays = Array.from(document.querySelectorAll('.modal-overlay')) as HTMLElement[]
            if (overlays.length === 0) return

            // Find overlay with highest z-index
            let topOverlay: HTMLElement | null = null
            let maxZ = -Infinity
            for (const el of overlays) {
              const z = Number.parseInt(window.getComputedStyle(el).zIndex || '0') || 0
              if (z >= maxZ) {
                maxZ = z
                topOverlay = el
              }
            }

            if (!topOverlay) return
            const modalId = (topOverlay as any).dataset && (topOverlay as any).dataset.modalId
            const registry = (window as any).openModalsRegistry || {}
            const instance = modalId ? registry[modalId] : null
            if (instance && instance.isOpen) {
              ;(window as any).modalEscLocked = true
              setTimeout(() => { (window as any).modalEscLocked = false }, 300)
              event.preventDefault()
              event.stopPropagation()
              instance.close()
            }
          }
          document.addEventListener('keydown', (window as any).modalGlobalEscapeHandler)
        }
      },

      cleanupGlobalEscapeListener() {
        if ((window as any).openModalsRegistry) {
          const ids = Object.keys((window as any).openModalsRegistry)
          if (ids.length === 0 && (window as any).modalGlobalEscapeHandler) {
            document.removeEventListener('keydown', (window as any).modalGlobalEscapeHandler)
            ;(window as any).modalGlobalEscapeHandler = null
          }
        }
      },

      registerEscapeHandler() {
        if (!(window as any).openModalsRegistry) {
          (window as any).openModalsRegistry = {}
        }
        ;(window as any).openModalsRegistry[this.modalId] = this
        this.setupGlobalEscapeListener()
      },

      unregisterEscapeHandler() {
        if ((window as any).openModalsRegistry) {
          delete (window as any).openModalsRegistry[this.modalId]
        }
        this.cleanupGlobalEscapeListener()
      },

      isTopmostModal() {
        // Get all modal overlays
        const allModals = document.querySelectorAll('.modal-overlay')
        if (allModals.length === 0) return true
        if (allModals.length === 1) return true

        // Get this modal's overlay
        const thisModalOverlay = this.$el && this.$el.closest ? this.$el.closest('.modal-overlay') : null
        if (!thisModalOverlay) return false

        // Get this modal's z-index
        const thisZIndex = Number.parseInt(window.getComputedStyle(thisModalOverlay).zIndex) || 0

        // Check if any other modal has a higher z-index
        for (const modal of Array.from(allModals)) {
          if (modal === thisModalOverlay) continue

          const modalZIndex = Number.parseInt(window.getComputedStyle(modal).zIndex) || 0
          if (modalZIndex > thisZIndex) {
            return false
          }
        }

        return true
      },

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
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  transition: background-color 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-overlay--nested {
  background-color: transparent;
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
  will-change: transform;
  transform: translateY(100%);
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.modal-overlay--nested .bottom-sheet-mobile {
  z-index: 30_001;
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
  pointer-events: auto;
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
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  padding: 0 16px 16px;
  touch-action: auto;
  user-select: auto;
  min-height: 0; /* Allow flex item to shrink */
}

.bottom-sheet-actions {
  flex-shrink: 0;
  padding: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
}

.bottom-sheet-desktop {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
  position: relative;
}

.desktop-close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.desktop-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  padding: 20px 24px 16px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.desktop-modal-content {
  max-height: calc(90vh - 80px); /* Account for actions height */
  overflow-y: auto;
  overflow-x: visible;
  padding-top: 16px;
}

.desktop-modal-actions {
  flex-shrink: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
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

/* Dynamic z-index for v-select dropdowns based on nesting level */
:deep(.v-select .v-list) {
  z-index: var(--dropdown-z-index) !important;
}

:deep(.v-select .v-overlay) {
  z-index: var(--dropdown-z-index) !important;
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

/* Ensure dropdowns appear above modal content */
:deep(.v-menu .v-overlay__content) {
  z-index: 30000 !important;
}

:deep(.v-select .v-field__overlay) {
  z-index: 30000 !important;
}

:deep(.v-list) {
  z-index: 30000 !important;
}

/* Additional Vuetify dropdown overrides */
:deep(.v-overlay) {
  z-index: 30000 !important;
}

:deep(.v-overlay__content) {
  z-index: 30000 !important;
}

:deep(.v-menu__content) {
  z-index: 30000 !important;
}
</style>
