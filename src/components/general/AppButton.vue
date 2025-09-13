<template>
  <v-btn
    :class="buttonClass"
    :color="color"
    :disabled="disabled"
    :elevation="elevation"
    :loading="loading"
    :size="size"
    :variant="variant as any"
    @click="handleClick"
  >
    <div class="app-button-content">
      <v-icon
        :class="iconClass"
        :size="iconSize"
      >
        {{ icon }}
      </v-icon>
      <span :class="textClass">
        {{ text }}
      </span>
    </div>
  </v-btn>
</template>

<script lang="ts">
  export default {
    name: 'AppButton',
    props: {
      text: {
        type: String,
        required: true
      },
      icon: {
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
        default: 'large'
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
        default: 4
      },
      iconSize: {
        type: [String, Number],
        default: 32
      }
    },
    emits: ['click'],
    computed: {
      buttonClass() {
        const classes = ['app-button']

        if (this.disabled) {
          classes.push('disabled')
        }

        return classes.join(' ')
      },
      textClass() {
        return 'app-button-text'
      },
      iconClass() {
        return 'app-button-icon'
      }
    },
    methods: {
      handleClick(event: Event) {
        this.$emit('click', event)
      }
    }
  }
</script>

<style scoped>
.app-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  letter-spacing: 0.25px;
  text-transform: none;
  min-width: 120px;
  min-height: 120px;
  padding: 16px;
  border-radius: 12px;
  opacity: 0.85;
}

.app-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  opacity: 1;
}

.app-button:active {
  transform: translateY(0) !important;
  transition: all 0.1s ease;
}

.app-button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
}

.app-button-icon {
  transition: transform 0.3s ease;
}

.app-button:hover .app-button-icon {
  transform: scale(1.1);
}

.app-button-text {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  word-wrap: break-word;
}

.app-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.app-button.disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

.app-button.disabled .app-button-icon {
  transform: none !important;
}

/* Damped color overrides */
.app-button.v-btn--primary {
  background-color: rgba(25, 118, 210, 0.7) !important;
}

.app-button.v-btn--secondary {
  background-color: rgba(103, 58, 183, 0.7) !important;
}

.app-button.v-btn--success {
  background-color: rgba(76, 175, 80, 0.7) !important;
}

.app-button.v-btn--info {
  background-color: rgba(0, 188, 212, 0.7) !important;
}

.app-button.v-btn--warning {
  background-color: rgba(255, 152, 0, 0.7) !important;
}

.app-button.v-btn--error {
  background-color: rgba(244, 67, 54, 0.7) !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .app-button {
    min-width: 100px;
    min-height: 100px;
    padding: 12px;
  }

  .app-button-text {
    font-size: 0.8rem;
  }
}
</style>
