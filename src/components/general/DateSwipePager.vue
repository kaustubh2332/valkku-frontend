<template>
  <div
    ref="container"
    class="date-swipe-pager"
    @pointerdown.capture="onPointerDown"
    @pointermove.capture="onPointerMove"
    @pointerup.capture="onPointerUp"
    @pointercancel.capture="onPointerUp"
    @touchstart.capture="onTouchStart"
    @touchmove.capture="onTouchMove"
    @touchend.capture="onTouchEnd"
    @touchcancel.capture="onTouchEnd"
  >
    <div
      class="date-swipe-track"
      :style="trackStyle"
    >
      <!-- Previous day -->
      <div class="date-swipe-page">
        <slot
          name="page"
          :date="prevDate"
          :events="getEventsForDate(prevDate)"
          :loading="getLoadingForDate(prevDate)"
        />
      </div>
      <!-- Current day -->
      <div class="date-swipe-page">
        <slot
          name="page"
          :date="currentDate"
          :events="getEventsForDate(currentDate)"
          :loading="getLoadingForDate(currentDate)"
        />
      </div>
      <!-- Next day -->
      <div class="date-swipe-page">
        <slot
          name="page"
          :date="nextDate"
          :events="getEventsForDate(nextDate)"
          :loading="getLoadingForDate(nextDate)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'DateSwipePager',
  emits: ['date-change'],
  props: {
    currentDate: {
      type: Date,
      required: true
    },
    prefetchedData: {
      type: Object,
      default: () => ({})
    },
    threshold: {
      type: Number,
      default: 0.25
    },
    flickVelocity: {
      type: Number,
      default: 0.5
    },
    edgeResistance: {
      type: Number,
      default: 0.35
    },
    settleDuration: {
      type: Number,
      default: 260
    },
    easing: {
      type: String,
      default: 'cubic-bezier(0.22, 0.61, 0.36, 1)'
    }
  },
  data() {
    return {
      width: 0 as number,
      isDragging: false as boolean,
      activePointerId: null as number | null,
      startX: 0 as number,
      startY: 0 as number,
      lastX: 0 as number,
      lastY: 0 as number,
      deltaX: 0 as number,
      directionLocked: '' as '' | 'horizontal' | 'vertical',
      moves: [] as Array<{ x: number; t: number }>,
      animating: false as boolean,
      ro: null as ResizeObserver | null,
      // For managing the transition - always center at -100%
      offset: -100 as number,
      pendingDateChange: null as Date | null,
      useTransition: true as boolean
    }
  },
  computed: {
    prevDate(): Date {
      const d = new Date(this.currentDate)
      d.setDate(d.getDate() - 1)
      return d
    },
    nextDate(): Date {
      const d = new Date(this.currentDate)
      d.setDate(d.getDate() + 1)
      return d
    },
    trackOffset(): number {
      const base = this.offset * (this.width / 100)
      if (this.isDragging) {
        let dx = this.deltaX
        if (this.edgeResistance > 0) {
          // Apply edge resistance
          const atEdge = Math.abs(this.offset + 100) < 0.01 // Are we at center?
          if (!atEdge) {
            dx = dx * (1 - this.edgeResistance / (1 + Math.abs(dx) / this.width))
          }
        }
        return base + dx
      }
      return base
    },
    trackStyle(): Record<string, string> {
      const offset = Math.round(this.trackOffset)
      const transform = `translate3d(${offset}px, 0, 0)`
      const transition = (this.isDragging || !this.useTransition)
        ? 'none'
        : `transform ${this.settleDuration}ms ${this.easing}`
      return {
        transform,
        transition,
        willChange: 'transform',
        width: '300%'
      }
    }
  },
  watch: {
    currentDate(newVal, oldVal) {
      if (!oldVal || newVal.getTime() === oldVal.getTime()) return

      // If this is our expected change from a swipe, just clear the flag
      if (this.pendingDateChange && newVal.getTime() === this.pendingDateChange.getTime()) {
        this.pendingDateChange = null
        return
      }

      // External date change (e.g. clicking calendar), reset to center instantly
      if (!this.pendingDateChange) {
        this.useTransition = false
        const el = this.$refs.container as HTMLElement | undefined
        if (el) void el.offsetHeight
        this.offset = -100
        requestAnimationFrame(() => {
          this.useTransition = true
        })
      }
    }
  },
  mounted() {
    this.measure()
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => this.measure())
      const el = this.$refs.container as HTMLElement | undefined
      if (el) this.ro.observe(el)
    } else {
      window.addEventListener('resize', this.measure as any, { passive: true } as any)
    }

    // Add keyboard navigation
    window.addEventListener('keydown', this.onKeyDown)
  },
  beforeUnmount() {
    if (this.ro) {
      const el = this.$refs.container as HTMLElement | undefined
      if (el) this.ro.unobserve(el)
      this.ro = null
    } else {
      window.removeEventListener('resize', this.measure as any)
    }

    // Remove keyboard navigation
    window.removeEventListener('keydown', this.onKeyDown)
  },
  methods: {
    measure() {
      const el = this.$refs.container as HTMLElement | undefined
      this.width = Math.max(1, el?.clientWidth || 1)
    },
    toIso(date: Date): string {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    getEventsForDate(date: Date): any[] {
      const iso = this.toIso(date)
      return this.prefetchedData[iso] || []
    },
    getLoadingForDate(date: Date): boolean {
      const iso = this.toIso(date)
      return !this.prefetchedData[iso]
    },
    onKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ignore if already animating
      if (this.animating) return

      let newDate: Date | null = null
      let targetOffset = -100

      if (e.key === 'ArrowLeft') {
        // Left arrow = previous day
        newDate = this.prevDate
        targetOffset = 0
        e.preventDefault()
      } else if (e.key === 'ArrowRight') {
        // Right arrow = next day
        newDate = this.nextDate
        targetOffset = -200
        e.preventDefault()
      }

      if (newDate) {
        this.pendingDateChange = newDate
        this.animating = true
        this.useTransition = true
        this.offset = targetOffset

        // At end of animation, reset position and emit change
        window.setTimeout(() => {
          // Step 1: Disable transitions and reset position instantly
          this.useTransition = false
          const el = this.$refs.container as HTMLElement | undefined
          if (el) void el.offsetHeight
          this.offset = -100

          // Step 2: Update content in next frame (after position is reset)
          requestAnimationFrame(() => {
            this.$emit('date-change', newDate!)

            // Step 3: Re-enable transitions after content updates
            requestAnimationFrame(() => {
              this.useTransition = true
              this.animating = false
            })
          })
        }, this.settleDuration)
      }
    },
    onTouchStart(e: TouchEvent) {
      if (this.animating) return
      const t = e.touches[0]
      this.isDragging = true
      this.directionLocked = ''
      this.startX = this.lastX = t.clientX
      this.startY = this.lastY = t.clientY
      this.deltaX = 0
      this.moves = [{ x: this.startX, t: performance.now() }]
    },
    onPointerDown(e: PointerEvent) {
      if (this.animating) return
      if (typeof e.button === 'number' && e.button !== 0) return
      this.activePointerId = e.pointerId
      const container = this.$refs.container as HTMLElement | undefined
      if (container && container.setPointerCapture) {
        try {
          container.setPointerCapture(e.pointerId)
        } catch {}
      }
      this.isDragging = true
      this.directionLocked = ''
      this.startX = this.lastX = e.clientX
      this.startY = this.lastY = e.clientY
      this.deltaX = 0
      this.moves = [{ x: this.startX, t: performance.now() }]
    },
    onPointerMove(e: PointerEvent) {
      if (!this.isDragging || this.activePointerId !== e.pointerId) return
      const dx = e.clientX - this.startX
      const dy = e.clientY - this.startY

      if (!this.directionLocked) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) {
          this.directionLocked = 'horizontal'
        } else if (Math.abs(dy) > 8) {
          this.directionLocked = 'vertical'
        } else {
          return
        }
      }

      if (this.directionLocked === 'vertical') {
        return
      }

      if (this.directionLocked === 'horizontal') {
        e.preventDefault()
        e.stopPropagation()
      }

      this.lastX = e.clientX
      this.lastY = e.clientY
      this.deltaX = dx

      const now = performance.now()
      this.moves.push({ x: this.lastX, t: now })
      if (this.moves.length > 5) this.moves.shift()
    },
    onPointerUp(e: PointerEvent) {
      if (!this.isDragging || (this.activePointerId !== null && this.activePointerId !== e.pointerId)) return
      this.isDragging = false
      this.activePointerId = null

      const totalDx = this.lastX - this.startX
      const width = this.width || 1

      let vx = 0
      if (this.moves.length >= 2) {
        const first = this.moves[0]
        const last = this.moves[this.moves.length - 1]
        const dt = Math.max(1, last.t - first.t)
        vx = (last.x - first.x) / dt
      }

      const passedDistance = Math.abs(totalDx) > width * this.threshold
      const flicked = Math.abs(vx) > this.flickVelocity

      let newDate = this.currentDate
      let targetOffset = -100 // Stay at center

      if (passedDistance || flicked) {
        if (totalDx < 0) {
          // Swiped left = next day
          newDate = this.nextDate
          targetOffset = -200 // Move to show next
        } else if (totalDx > 0) {
          // Swiped right = prev day
          newDate = this.prevDate
          targetOffset = 0 // Move to show prev
        }
      }

      this.animating = true
      this.deltaX = 0
      this.useTransition = true
      this.offset = targetOffset

      if (newDate !== this.currentDate) {
        this.pendingDateChange = newDate
        // At end of animation, reset position and emit change
        window.setTimeout(() => {
          // Step 1: Disable transitions and reset position instantly
          this.useTransition = false
          const el = this.$refs.container as HTMLElement | undefined
          if (el) void el.offsetHeight
          this.offset = -100

          // Step 2: Update content in next frame (after position is reset)
          requestAnimationFrame(() => {
            this.$emit('date-change', newDate)

            // Step 3: Re-enable transitions after content updates
            requestAnimationFrame(() => {
              this.useTransition = true
              this.animating = false
            })
          })
        }, this.settleDuration)
      } else {
        // No date change, just animate back to center
        window.setTimeout(() => {
          this.animating = false
        }, this.settleDuration)
      }
    },
    onTouchMove(e: TouchEvent) {
      if (!this.isDragging) return
      const t = e.touches[0]
      const dx = t.clientX - this.startX
      const dy = t.clientY - this.startY

      if (!this.directionLocked) {
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) {
          this.directionLocked = 'horizontal'
        } else if (Math.abs(dy) > 8) {
          this.directionLocked = 'vertical'
        } else {
          return
        }
      }

      if (this.directionLocked === 'vertical') {
        return
      }

      if (this.directionLocked === 'horizontal') {
        e.preventDefault()
        e.stopPropagation()
      }

      this.lastX = t.clientX
      this.lastY = t.clientY
      this.deltaX = dx

      const now = performance.now()
      this.moves.push({ x: this.lastX, t: now })
      if (this.moves.length > 5) this.moves.shift()
    },
    onTouchEnd(e: TouchEvent) {
      if (!this.isDragging) return
      this.isDragging = false

      const totalDx = this.lastX - this.startX
      const width = this.width || 1

      let vx = 0
      if (this.moves.length >= 2) {
        const first = this.moves[0]
        const last = this.moves[this.moves.length - 1]
        const dt = Math.max(1, last.t - first.t)
        vx = (last.x - first.x) / dt
      }

      const passedDistance = Math.abs(totalDx) > width * this.threshold
      const flicked = Math.abs(vx) > this.flickVelocity

      let newDate = this.currentDate
      let targetOffset = -100 // Stay at center

      if (passedDistance || flicked) {
        if (totalDx < 0) {
          // Swiped left = next day
          newDate = this.nextDate
          targetOffset = -200 // Move to show next
        } else if (totalDx > 0) {
          // Swiped right = prev day
          newDate = this.prevDate
          targetOffset = 0 // Move to show prev
        }
      }

      this.animating = true
      this.deltaX = 0
      this.useTransition = true
      this.offset = targetOffset

      if (newDate !== this.currentDate) {
        this.pendingDateChange = newDate
        // At end of animation, reset position and emit change
        window.setTimeout(() => {
          // Step 1: Disable transitions and reset position instantly
          this.useTransition = false
          const el = this.$refs.container as HTMLElement | undefined
          if (el) void el.offsetHeight
          this.offset = -100

          // Step 2: Update content in next frame (after position is reset)
          requestAnimationFrame(() => {
            this.$emit('date-change', newDate)

            // Step 3: Re-enable transitions after content updates
            requestAnimationFrame(() => {
              this.useTransition = true
              this.animating = false
            })
          })
        }, this.settleDuration)
      } else {
        // No date change, just animate back to center
        window.setTimeout(() => {
          this.animating = false
        }, this.settleDuration)
      }
    }
  }
}
</script>

<style scoped>
.date-swipe-pager {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: auto;
  min-height: 1px;
  touch-action: pan-y pinch-zoom;
}

.date-swipe-track {
  display: flex;
}

.date-swipe-page {
  width: 33.333%;
  flex-shrink: 0;
  contain: layout paint style;
  touch-action: pan-y pinch-zoom;
}
</style>
