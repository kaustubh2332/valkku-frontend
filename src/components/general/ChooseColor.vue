<template>
  <div class="choose-color">
    <v-menu
      v-model="menu"
      :close-on-content-click="true"
      location="bottom"
      offset="8"
      :z-index="zIndex"
    >
      <template #activator="{ props }">
        <div
          v-bind="props"
          :aria-label="$t ? $t('events.choose_color') : 'Choose color'"
          class="color-circle activator"
          role="button"
          :style="{ backgroundColor: currentColor, width: sizePx, height: sizePx }"
          tabindex="0"
        />
      </template>

      <v-sheet class="pa-2" elevation="4">
        <div class="color-grid">
          <button
            v-for="(c, idx) in palette"
            :key="idx"
            class="color-circle option"
            :class="{ selected: c === currentColor }"
            :style="{ backgroundColor: c, width: optionSizePx, height: optionSizePx }"
            type="button"
            @click="selectColor(c)"
          />
        </div>
      </v-sheet>
    </v-menu>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'ChooseColor',
    props: {
      modelValue: {
        type: String,
        default: '#E91E63'
      },
      colors: {
        type: Array,
        default: () => [
          '#E91E63',
          '#9C27B0',
          '#3F51B5',
          '#2196F3',
          '#03A9F4',
          '#00BCD4',
          '#009688',
          '#4CAF50',
          '#8BC34A',
          '#FFC107',
          '#FF9800',
          '#FF5722'
        ]
      },
      size: {
        type: [Number, String],
        default: 24
      },
      optionSize: {
        type: [Number, String],
        default: 28
      },
      zIndex: {
        type: Number,
        default: 30_050
      }
    },
    emits: ['update:modelValue', 'change'],
    data() {
      return {
        menu: false
      }
    },
    computed: {
      palette() {
        return (this.colors && this.colors.length > 0) ? this.colors : []
      },
      currentColor(): string {
        return this.modelValue || this.palette[0] || '#4CAF50'
      },
      sizePx(): string {
        return typeof this.size === 'number' ? `${this.size}px` : String(this.size)
      },
      optionSizePx(): string {
        return typeof this.optionSize === 'number' ? `${this.optionSize}px` : String(this.optionSize)
      }
    },
    methods: {
      selectColor(color: string) {
        this.$emit('update:modelValue', color)
        this.$emit('change', color)
        this.menu = false
      }
    }
  }
</script>

<style scoped>
.choose-color {
  display: inline-flex;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, auto);
  gap: 10px;
}

.color-circle {
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.color-circle.option:hover {
  outline: 2px solid rgba(0, 0, 0, 0.15);
}

.color-circle.selected {
  box-shadow: 0 0 0 2px white inset, 0 0 0 3px rgba(0, 0, 0, 0.3);
}

.activator {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
</style>
