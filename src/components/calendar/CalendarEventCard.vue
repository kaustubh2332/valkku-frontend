<template>
  <div class="event-card" :style="styleVars">
    <div class="top-row">
      <span v-if="durationText" class="pill duration">{{ durationText }}</span>
      <span v-if="typeLabel" class="pill type">{{ typeLabel }}</span>
    </div>

    <div class="title" :title="title">{{ title }}</div>

    <div v-if="locationName" class="meta" :title="locationName">
      <span class="dot" />
      <span class="meta-text text-truncate">{{ locationName }}</span>
    </div>

    <div class="reactions">
      <span class="like">
        <span class="icon like">👍</span>
        <span class="count">{{ likes }}</span>
      </span>
      <span class="dislike">
        <span class="icon dislike">👎</span>
        <span class="count">{{ dislikes }}</span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'CalendarEventCard',
    props: {
      event: {
        type: Object,
        required: true
      }
    },
    data() {
      return {}
    },
    computed: {
      title() {
        return this.event?.title || ''
      },
      likes() {
        const v = (this.event?.extendedProps && this.event.extendedProps.likes) || 0
        return Number.isFinite(Number(v)) ? Number(v) : 0
      },
      dislikes() {
        const v = (this.event?.extendedProps && this.event.extendedProps.dislikes) || 0
        return Number.isFinite(Number(v)) ? Number(v) : 0
      },
      locationName() {
        const ext = this.event?.extendedProps || {}
        return ext.locationName || ext.location || ''
      },
      typeLabel() {
        const ext = this.event?.extendedProps || {}
        return ext.typeLabel || ext.type || ''
      },
      durationText() {
        const ext = this.event?.extendedProps || {}
        const ownDuration = Number(ext.durationInMins)
        if (Number.isFinite(ownDuration) && ownDuration > 0) {
          return `${ownDuration} min`
        }

        const start = this.event?.start
        const end = this.event?.end
        if (start && end) {
          const fmt = (d) => {
            const hh = String(new Date(d).getHours()).padStart(2, '0')
            const mm = String(new Date(d).getMinutes()).padStart(2, '0')
            return `${hh}:${mm}`
          }
          return `${fmt(start)}-${fmt(end)}`
        }
        return ''
      },
      baseColor() {
        const c = (this.event && (this.event.backgroundColor || this.event.color)) || ''
        if (typeof c === 'string' && c.trim()) return c
        const t = String((this.event?.extendedProps && this.event.extendedProps.type) || '').toLowerCase()
        const map = {
          practise: '#2563eb',
          match: '#ef4444',
          meeting: '#8b5cf6',
          self_training: '#10b981',
          other_event: '#64748b'
        }
        return map[t] || '#0ea5e9'
      },
      styleVars() {
        const base = this.baseColor
        const lighter = this.shadeColor(base, 10)
        const darker = this.shadeColor(base, -8)
        const border = this.shadeColor(base, -14)
        const glow = this.shadeColor(base, 12)
        return {
          '--evt-base': base,
          '--evt-light': lighter,
          '--evt-dark': darker,
          '--evt-border': border,
          '--evt-glow': glow
        }
      }
    },
    methods: {
      shadeColor(hex, percent) {
        try {
          const h = hex.replace('#', '')
          const num = Number.parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16)
          let r = (num >> 16) & 0xff
          let g = (num >> 8) & 0xff
          let b = num & 0xff
          const amt = Math.round(2.55 * percent)
          r = Math.min(255, Math.max(0, r + amt))
          g = Math.min(255, Math.max(0, g + amt))
          b = Math.min(255, Math.max(0, b + amt))
          return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
        } catch {
          return hex
        }
      }
    }
  }
</script>

<style scoped>
.event-card {
  position: relative;
  background: linear-gradient(135deg, var(--evt-dark), var(--evt-base) 60%, var(--evt-light));
  color: #f5fbff;
  border-radius: 10px;
  border: 1px solid var(--evt-border);
  padding: 8px 10px;
  line-height: 1.25;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.02) inset;
  width: 100%;
  height: 100%;
}
.event-card::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 10px;
  box-shadow: 0 0 22px 0 var(--evt-glow);
  opacity: 0.18;
  pointer-events: none;
}
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.pill {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(2px);
}
.pill.type { text-transform: capitalize; }
.title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}
.meta {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #eaf4ff;
  opacity: 0.9;
  font-size: 11px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.8);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.12);
}
.reactions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.like, .dislike {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.icon.like { color: #86efac; }
.icon.dislike { color: #f87171; }
.count { color: #ffffff; }
</style>
