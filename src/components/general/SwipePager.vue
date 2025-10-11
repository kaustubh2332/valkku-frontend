<template>
  <div
    class="swipe-pager"
    ref="container"
    @pointerdown.capture="onPointerDown"
    @pointermove.capture="onPointerMove"
    @pointerup.capture="onPointerUp"
    @pointercancel.capture="onPointerUp"
    @mousedown.capture="onMouseDown"
    @mousemove.capture="onMouseMove"
    @mouseup.capture="onMouseUp"
    @touchstart.capture="onTouchStart"
    @touchmove.capture="onTouchMove"
    @touchend.capture="onTouchEnd"
    @touchcancel.capture="onTouchEnd"
  >
    <div
      class="swipe-track"
      :style="trackStyle"
    >
      <div
        v-for="idx in pageCount"
        :key="pageKey(idx - 1)"
        class="swipe-page"
        :style="{ width: pageWidthPercent }"
      >
        <slot
          v-if="shouldRenderPage(idx - 1)"
          name="page"
          :index="idx - 1"
          :is-active="current === (idx - 1)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">

export default {
  name: 'SwipePager',
  emits: ['update:modelValue', 'change'],
  props: {
    // Number of pages to render; content provided via slot
    count: {
      type: Number,
      default: 0
    },
    modelValue: {
      type: Number,
      default: 0
    },
    loop: {
      type: Boolean,
      default: false
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
    },
    // Debug: render without translate for visibility checks
    debugFreeze: {
      type: Boolean,
      default: false
    },
    // Number of pages to render before/after current (0 = only current, 1 = current ± 1, etc.)
    // Set to -1 to render all pages
    renderBuffer: {
      type: Number,
      default: -1
    }
  },
  data() {
    return {
      width: 0 as number,
      current: this.modelValue as number,
      isDragging: false as boolean,
      activePointerId: null as number | null,
      mouseActive: false as boolean,
      startX: 0 as number,
      startY: 0 as number,
      lastX: 0 as number,
      lastY: 0 as number,
      deltaX: 0 as number,
      directionLocked: '' as '' | 'horizontal' | 'vertical',
      moves: [] as Array<{ x: number; t: number }>,
      animating: false as boolean,
      ro: null as ResizeObserver | null
    }
  },
  computed: {
    pageCount(): number {
      return Math.max(0, Number(this.count) || 0)
    },
    maxIndex(): number {
      return Math.max(0, this.pageCount - 1)
    },
    trackOffset(): number {
      const base = -this.current * this.width
      if (this.isDragging) {
        let dx = this.deltaX
        const atFirst = this.current === 0
        const atLast = this.current === this.maxIndex
        if (!this.loop && this.edgeResistance > 0) {
          if (atFirst && dx > 0) dx = dx * (1 - this.edgeResistance / (1 + Math.abs(dx) / this.width))
          if (atLast && dx < 0) dx = dx * (1 - this.edgeResistance / (1 + Math.abs(dx) / this.width))
        }
        return base + dx
      }
      return base
    },
    trackStyle(): Record<string, string> {
      const offset = this.debugFreeze ? 0 : Math.round(this.trackOffset)
      const transform = `translate3d(${offset}px, 0, 0)`
      const transition = this.isDragging
        ? 'none'
        : `transform ${this.settleDuration}ms ${this.easing}`
      const style: Record<string, string> = {
        transform,
        transition,
        willChange: 'transform',
        width: this.pageCount ? `${this.pageCount * 100}%` : '100%'
      }
      return style
    },
    pageWidthPercent(): string {
      // Each page should be (100 / pageCount)% of track width = container width
      return this.pageCount ? `${100 / this.pageCount}%` : '100%'
    },
    shouldRenderPage(): (idx: number) => boolean {
      return (idx: number) => {
        if (this.renderBuffer < 0) return true // render all
        const distance = Math.abs(idx - this.current)
        return distance <= this.renderBuffer
      }
    }
  },
  watch: {
    modelValue(val: number) {
      if (val !== this.current) this.current = this.clampIndex(val)
    },
    current(val: number) {
      this.$emit('update:modelValue', val)
      this.$emit('change', val)
    },
    count() {
      this.current = this.clampIndex(this.current)
      this.$nextTick(this.measure)
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

    // Debug
    console.log('SwipePager mounted:', {
      count: this.count
    })
  },
  beforeUnmount() {
    if (this.ro) {
      const el = this.$refs.container as HTMLElement | undefined
      if (el) this.ro.unobserve(el)
      this.ro = null
    } else {
      window.removeEventListener('resize', this.measure as any)
    }
  },
  methods: {
    pageKey(idx: number): string {
      return String(idx)
    },
    measure() {
      const el = this.$refs.container as HTMLElement | undefined
      this.width = Math.max(1, el?.clientWidth || 1)
      try { console.log('[SwipePager] measure width', this.width) } catch {}
    },
    clampIndex(i: number): number {
      if (this.loop) {
        const len = this.pageCount || 1
        return ((i % len) + len) % len
      }
      return Math.min(this.maxIndex, Math.max(0, i))
    },
    onTouchStart(e: TouchEvent) {
      if (this.animating || this.pageCount === 0) return
      const t = e.touches[0]
      this.isDragging = true
      this.directionLocked = ''
      this.startX = this.lastX = t.clientX
      this.startY = this.lastY = t.clientY
      this.deltaX = 0
      this.moves = [{ x: this.startX, t: performance.now() }]
      try { console.log('[SwipePager] touchstart', { x: this.startX, y: this.startY, current: this.current, count: this.pageCount, width: this.width }) } catch {}
    },
    // Pointer Events support (more reliable on modern browsers)
    onPointerDown(e: PointerEvent) {
      if (this.animating || this.pageCount === 0) return
      // Only handle primary button/touch
      if (typeof e.button === 'number' && e.button !== 0) return
      // Treat touch pointers as primary
      if ((e as any).pointerType && (e as any).pointerType !== 'touch' && (typeof e.button === 'number' && e.button !== 0)) return
      this.activePointerId = e.pointerId
      const container = this.$refs.container as HTMLElement | undefined
      if (container && container.setPointerCapture) {
        try { container.setPointerCapture(e.pointerId) } catch {}
      }
      this.isDragging = true
      this.directionLocked = ''
      this.startX = this.lastX = e.clientX
      this.startY = this.lastY = e.clientY
      this.deltaX = 0
      this.moves = [{ x: this.startX, t: performance.now() }]
      try { console.log('[SwipePager] pointerdown', { x: this.startX, y: this.startY, id: e.pointerId, current: this.current, count: this.pageCount, width: this.width }) } catch {}
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

      // Only prevent defaults when we have locked horizontal to avoid blocking vertical scroll
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
      try { console.log('[SwipePager] pointermove', { dx, dy, lock: this.directionLocked, deltaX: this.deltaX }) } catch {}
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

      let target = this.current
      const passedDistance = Math.abs(totalDx) > width * this.threshold
      const flicked = Math.abs(vx) > this.flickVelocity

      if (passedDistance || flicked) {
        if (totalDx < 0) {
          target = this.current + 1
        } else if (totalDx > 0) {
          target = this.current - 1
        }
      }

      this.animating = true
      this.deltaX = 0

      const next = this.clampIndex(target)
      try { console.log('[SwipePager] pointerup', { totalDx, vx, passedDistance, flicked, target, next }) } catch {}
      this.current = next

      window.setTimeout(() => {
        this.animating = false
      }, this.settleDuration)
    },
    // Mouse fallback for desktop
    onMouseDown(e: MouseEvent) {
      // ignore right/middle clicks
      if (e.button !== 0) return
      this.mouseActive = true
      this.isDragging = true
      this.directionLocked = ''
      this.startX = this.lastX = e.clientX
      this.startY = this.lastY = e.clientY
      this.deltaX = 0
      this.moves = [{ x: this.startX, t: performance.now() }]
      try { console.log('[SwipePager] mousedown', { x: this.startX, y: this.startY, current: this.current, count: this.pageCount, width: this.width }) } catch {}
    },
    onMouseMove(e: MouseEvent) {
      if (!this.mouseActive || !this.isDragging) return
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
      if (this.directionLocked === 'vertical') return
      this.lastX = e.clientX
      this.lastY = e.clientY
      this.deltaX = dx
      const now = performance.now()
      this.moves.push({ x: this.lastX, t: now })
      if (this.moves.length > 5) this.moves.shift()
      try { console.log('[SwipePager] mousemove', { dx, dy, lock: this.directionLocked, deltaX: this.deltaX }) } catch {}
    },
    onMouseUp(e: MouseEvent) {
      if (!this.mouseActive) return
      this.mouseActive = false
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
      let target = this.current
      const passedDistance = Math.abs(totalDx) > width * this.threshold
      const flicked = Math.abs(vx) > this.flickVelocity
      if (passedDistance || flicked) {
        if (totalDx < 0) target = this.current + 1
        else if (totalDx > 0) target = this.current - 1
      }
      this.animating = true
      this.deltaX = 0
      const next = this.clampIndex(target)
      try { console.log('[SwipePager] mouseup', { totalDx, vx, passedDistance, flicked, target, next }) } catch {}
      this.current = next
      window.setTimeout(() => { this.animating = false }, this.settleDuration)
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

      // Only prevent defaults when we have locked horizontal to avoid blocking vertical scroll
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
      try { console.log('[SwipePager] touchmove', { dx, dy, lock: this.directionLocked, deltaX: this.deltaX }) } catch {}
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

      let target = this.current
      const passedDistance = Math.abs(totalDx) > width * this.threshold
      const flicked = Math.abs(vx) > this.flickVelocity

      if (passedDistance || flicked) {
        if (totalDx < 0) {
          target = this.current + 1
        } else if (totalDx > 0) {
          target = this.current - 1
        }
      }

      this.animating = true
      this.deltaX = 0

      const next = this.clampIndex(target)
      try { console.log('[SwipePager] touchend', { totalDx, vx, passedDistance, flicked, target, next }) } catch {}
      this.current = next

      window.setTimeout(() => {
        this.animating = false
      }, this.settleDuration)
    },
    next() {
      this.current = this.clampIndex(this.current + 1)
    },
    prev() {
      this.current = this.clampIndex(this.current - 1)
    },
    goTo(i: number) {
      this.current = this.clampIndex(i)
    }
  }
}
</script>

<style scoped>
.swipe-pager {
  position: relative;
  overflow: hidden;
  width: 100%;
  /* Allow content-driven height */
  height: auto;
  min-height: 1px;
  /* Allow horizontal panning; let vertical scroll pass */
  touch-action: pan-y pinch-zoom;
}

.swipe-track {
  display: flex;
  /* content-driven height */
}

.swipe-page {
  /* Each page width set dynamically via inline style */
  flex-shrink: 0;
  /* content-driven height */
  /* Avoid size containment so height can follow content */
  contain: layout paint style;
  /* Prevent children from hijacking horizontal pan */
  touch-action: pan-y pinch-zoom;
}
</style>
