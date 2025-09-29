# Z-Index Directive

A universal directive for automatically calculating and applying appropriate z-index values to tooltips and dropdowns based on modal depth.

## Usage

### Directive Usage

```vue
<!-- For tooltips -->
<v-tooltip v-z-index:tooltip>
  <template #activator="{ props }">
    <v-btn v-bind="props">Hover me</v-btn>
  </template>
  <span>Tooltip content</span>
</v-tooltip>

<!-- For dropdowns (v-select, v-menu, etc.) -->
<v-select v-z-index:dropdown v-model="value" :items="items" />

<!-- For general elements -->
<div v-z-index>Content that needs higher z-index</div>
```

### Composable Usage

```vue
<script>
import { useZIndex } from '@/composables/useZIndex'

export default {
  setup() {
    const { tooltipZIndex, dropdownZIndex, calculateZIndex } = useZIndex()

    return {
      tooltipZIndex,
      dropdownZIndex,
      calculateZIndex
    }
  }
}
</script>

<template>
  <v-select :menu-props="{ zIndex: dropdownZIndex }" />
  <v-tooltip :z-index="tooltipZIndex" />
</template>
```

## How It Works

1. **Modal Depth Detection**: The directive traverses up the DOM tree to count modal containers
2. **Z-Index Calculation**: `baseZIndex (30,000) + (modalDepth * 100) + offset (10,000)`
3. **Automatic Application**: Applies the calculated z-index to the appropriate element properties

## Supported Components

- **v-tooltip**: Uses `:tooltip` argument
- **v-select**: Uses `:dropdown` argument
- **v-menu**: Uses `:dropdown` argument
- **General elements**: No argument needed

## Benefits

- ✅ **Automatic**: No manual z-index calculations needed
- ✅ **Nested Modal Support**: Works with deeply nested modals
- ✅ **Universal**: Works with any Vue component
- ✅ **Reactive**: Updates automatically when modal depth changes
- ✅ **Type Safe**: Full TypeScript support with composable
