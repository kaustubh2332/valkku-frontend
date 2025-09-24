<template>
  <Loading v-if="loading" />
  <div v-else-if="error">
    <!-- SHOW ERROR -->
    <v-alert
      color="error"
      variant="tonal"
    >
      <div class="text-h6">
        {{ $t('join.errors.title') }}
      </div>
      <div class="text-body-2">
        {{ errorText || $t('join.errors.description') }}
      </div>
    </v-alert>
  </div>
  <div v-else>
    <!-- SHOW SUCCESS -->
     DATAA
  </div>
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
    data() {
      return {
        loading: true,
        token: null,
        errorText: null,
        error: false
      }
    },
    async created() {
      const token = this.$route.query.token
      this.token = token
      // this.$router.replace('/join')

      if(!token) {
        this.notificationStore.error(this.$t('join.errors.token_required'))
        return
      }

      try {
        const res = await api.post('/team/get-join', { token })
        const teamUser = res.data.data.team_user

        if(teamUser.validUntil && new Date(teamUser.validUntil) < new Date()) this.errorText = this.$t('join.errors.expired')
        if(this.userStore.token && teamUser.userId !== this.userStore.user.id) {
          this.errorText = this.$t('join.errors.wrong_user', { email: this.userStore.user.email })
          this.error = true
        }
      } catch (error) {
        this.notificationStore.handleBackendError(error)
        this.error = true
      }

      this.loading = false
      // if(this.userStore.token) {
      //   // case 1 logged in -> try joining and go to /callback
      //   api.post('/team/join', {
      //     token
      //   })
      //     .then(() => {
      //       this.$router.push('/callback?first=true')
      //       this.notificationStore.success(this.$t('join.success'))
      //     })
      //     .catch((error) => {
      //       this.$router.push('/callback')
      //       this.notificationStore.handleBackendError(error)
      //     })
      // } else {
      //   // case 2 not logged in -> signup?token=123
      //   api.post('/team/join', {
      //     token
      //   })
      //     .then(() => {
      //       this.$router.push('/callback?first=true')
      //       this.notificationStore.success(this.$t('join.success'))
      //     })
      //     .catch((error) => {
      //       this.$router.push('/callback')
      //       this.notificationStore.handleBackendError(error)
      //     })
      // }
    }
  }
</script>
