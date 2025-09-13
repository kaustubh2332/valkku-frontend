<template>
  <div class="app-toolbar">
    <div :class="toolbarContentClass">
      <!-- Default slot (left) -->
      <div class="app-toolbar-default">
        <slot />
      </div>

      <!-- Append slot (right) -->
      <div class="app-toolbar-append">
        <slot name="append" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'AppToolbar',
    props: {
      inline: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      toolbarContentClass() {
        const classes = ['app-toolbar-content']
        if (this.inline) {
          classes.push('app-toolbar-inline')
        }
        return classes.join(' ')
      }
    }
  }
</script>

<style scoped>
.app-toolbar {
  width: 100%;
  background-color: transparent;
}

.app-toolbar-content {
  display: flex;
  width: 100%;
  gap: 16px;
}

.app-toolbar-default {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.app-toolbar-append {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Mobile layout - slots stacked vertically (unless inline) */
@media (max-width: 960px) {
  .app-toolbar-content:not(.app-toolbar-inline) {
    flex-direction: column;
    gap: 12px;
  }

  .app-toolbar-content:not(.app-toolbar-inline) .app-toolbar-default {
    width: 100%;
    justify-content: center;
  }

  .app-toolbar-content:not(.app-toolbar-inline) .app-toolbar-append {
    width: 100%;
    justify-content: center;
  }
}

/* Desktop layout - slots side by side */
@media (min-width: 961px) {
  .app-toolbar-content {
    flex-direction: row;
    align-items: center;
  }

  .app-toolbar-default {
    justify-content: flex-start;
  }

  .app-toolbar-append {
    justify-content: flex-end;
  }
}
</style>
