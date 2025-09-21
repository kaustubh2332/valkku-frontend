<template>
  <Loading />
</template>

<script lang="ts">
  import { useNotificationStore } from '@/stores/notification'
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'Join',
    setup() {
      const notificationStore = useNotificationStore()
      const userStore = useUserStore()
      return { notificationStore, userStore }
    },
    created() {
      const token = this.$route.query.token
      if(!token) {
        this.$router.push('/signin')
        return
      }

      if(this.userStore.token) {
        // case 1 logged in -> try joining and go to /callback
        api.post('/team/join', {
          token
        })
          .then(() => {
            this.$router.push('/callback?first=true')
            this.notificationStore.success(this.$t('join.success'))
          })
          .catch((error) => {
            this.$router.push('/callback')
            this.notificationStore.handleBackendError(error)
          })
      } else {
        // case 2 not logged in -> signup?token=123
        this.$router.push('/signup?token=' + token)
      }
    }
  }
</script>
