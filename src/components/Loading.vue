<template>
  <div class="loading-overlay">
    <div class="loading-content">
      <div class="skeleton-container">
        <v-skeleton-loader
          class="mb-4"
          type="heading"
        />

        <v-skeleton-loader
          class="mb-2"
          type="text"
        />

        <v-skeleton-loader
          class="mb-4"
          type="text"
        />

        <v-skeleton-loader
          class="mb-4"
          type="card"
        />

        <v-skeleton-loader
          class="mb-2"
          type="list-item-two-line"
        />

        <v-skeleton-loader
          type="list-item-two-line"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  export default {
    name: 'Loading'
  }
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: fadeIn 0.3s ease-in-out;
}

.loading-content {
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.skeleton-container {
  width: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
