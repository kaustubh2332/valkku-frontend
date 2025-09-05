<template>
  <Loading v-if="isLoading" />
</template>

<script lang="ts">
  import { useAuth0 } from '@auth0/auth0-vue'
  import api from '@/utils/axios'

  export default {
    name: 'Callback',
    setup() {
      const { user, isAuthenticated } = useAuth0()
      return { user, isAuthenticated }
    },
    data() {
      return {
        isLoading: true
      }
    },
    async mounted() {
      try {
        // Call /bootstrap endpoint when component is mounted
        api.put('/bootstrap')
          .then(response => {
            this.$router.push('/')
            console.log('Bootstrap response:', response.data)
          })
          .catch(error => {
            console.error('Bootstrap call failed:', error)
          })
      } catch (error) {
        console.error('Bootstrap call failed:', error)
      } finally {
        this.isLoading = false
      }
    }
  }
</script>
