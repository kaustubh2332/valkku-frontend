<template>
  <v-btn
    :block="block"
    :class="buttonClass"
    :color="color"
    :disabled="disabled"
    :elevation="elevation"
    :loading="loading"
    :rounded="rounded"
    :size="size"
    :variant="variant as any"
    @click="handleClick"
  >
    <v-icon
      v-if="icon"
      :class="iconClass"
      :end="iconPosition === 'end'"
      :start="iconPosition === 'start'"
    >
      {{ icon }}
    </v-icon>

    <span :class="textClass">
      {{ text }}
    </span>

    <v-icon
      v-if="trailingIcon"
      :class="[iconClass, 'trailing-icon']"
      :end="true"
      :start="false"
    >
      {{ trailingIcon }}
    </v-icon>
  </v-btn>
</template>

<script lang="ts">
  export default {
    name: 'StunningButton',
    props: {
      text: {
        type: String,
        required: true
      },
      color: {
        type: String,
        default: 'primary'
      },
      variant: {
        type: String,
        default: 'elevated'
      },
      size: {
        type: String,
        default: 'x-large'
      },
      disabled: {
        type: Boolean,
        default: false
      },
      loading: {
        type: Boolean,
        default: false
      },
      elevation: {
        type: [String, Number],
        default: 8
      },
      rounded: {
        type: [String, Number],
        default: 'lg'
      },
      block: {
        type: Boolean,
        default: false
      },
      icon: {
        type: String,
        default: null
      },
      trailingIcon: {
        type: String,
        default: null
      },
      iconPosition: {
        type: String,
        default: 'start',
        validator: (value: string) => ['start', 'end'].includes(value)
      },
      gradient: {
        type: Boolean,
        default: false
      },
      glow: {
        type: Boolean,
        default: true
      }
    },
    emits: ['click'],
    computed: {
      buttonClass() {
        const classes = ['stunning-button']

        if (this.gradient) {
          classes.push('gradient-button')
        }

        if (this.glow) {
          classes.push('glow-button')
        }

        return classes.join(' ')
      },
      textClass() {
        return 'button-text'
      },
      iconClass() {
        return 'button-icon'
      }
    },
    methods: {
      handleClick(event: Event) {
        this.createRipple(event)
        this.$emit('click', event)
      },
      createRipple(event: Event) {
        const button = event.currentTarget as HTMLElement
        const rect = button.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const mouseEvent = event as MouseEvent
        const x = mouseEvent.clientX - rect.left - size / 2
        const y = mouseEvent.clientY - rect.top - size / 2

        const ripple = document.createElement('span')
        ripple.style.width = ripple.style.height = size + 'px'
        ripple.style.left = x + 'px'
        ripple.style.top = y + 'px'
        ripple.style.position = 'absolute'
        ripple.style.pointerEvents = 'none'
        ripple.classList.add('ripple')

        button.append(ripple)

        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.remove()
          }
        }, 600)
      }
    }
  }
</script>

<style scoped>
.stunning-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  min-height: 64px;
  padding: 0 32px;
}

.stunning-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.stunning-button:active {
  transform: translateY(0) !important;
  transition: all 0.1s ease;
}

.stunning-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.stunning-button:disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

.stunning-button:disabled .button-icon {
  transform: none !important;
}

.gradient-button {
  background: linear-gradient(30deg, #01B0D8 0%, #01B0D8 80%, #02A5C7 100%);
  border: none;
  position: relative;
  overflow: hidden;
}

.gradient-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gradient-button:hover {
  background: linear-gradient(30deg, #00A3CC 0%, #00A3CC 80%, #0199B8 100%);
}

.gradient-button:hover::before {
  opacity: 1;
}

.gradient-button:disabled {
  background: #e0e0e0 !important;
  color: #9e9e9e !important;
}

.gradient-button:disabled::before {
  opacity: 0 !important;
}

.glow-button {
  box-shadow:
    0 0 12px rgba(1, 176, 216, 0.25),
    0 2px 6px rgba(0, 0, 0, 0.08);
}

.glow-button:hover {
  box-shadow:
    0 0 18px rgba(1, 176, 216, 0.35),
    0 0 28px rgba(1, 176, 216, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.12);
}

.button-text {
  font-size: 1.1rem;
  font-weight: 600;
  position: relative;
}

.button-icon {
  transition: transform 0.3s ease;
  position: relative;
}

.stunning-button:hover .button-icon:not(.trailing-icon) {
  transform: scale(1.1) rotate(360deg);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.stunning-button:hover .button-icon.trailing-icon {
  transform: scale(1.3);
  transition: transform 0.3s ease;
}

/* Dynamic ripple effect */

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0);
  animation: ripple-animation 0.6s linear;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .stunning-button {
    min-height: 56px;
    padding: 0 24px;
  }

  .button-text {
    font-size: 1rem;
  }
}
</style>
