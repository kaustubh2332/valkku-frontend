<template>
  <div v-if="showLoading">
    <!-- Custom skeleton content via slot -->
    <slot v-if="$slots.default" />

    <!-- Default spinner if no slot provided -->
    <div v-else class="d-flex justify-center align-center py-8">
      <v-progress-circular
        color="primary"
        indeterminate
        size="48"
      />
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'LoadingWrapper',
    props: {
      delay: {
        type: Number,
        default: 300 // 1 second delay
      }
    },
    data() {
      return {
        showLoading: false,
        timeoutId: null as number | null
      }
    },
    mounted() {
      // Start the delay timer when component is mounted
      this.timeoutId = window.setTimeout(() => {
        this.showLoading = true
      }, this.delay)
    },
    beforeUnmount() {
      // Clean up timer on component destruction
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
      }
    }
  }
</script>
