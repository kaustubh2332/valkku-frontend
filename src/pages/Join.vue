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
    <v-btn class="ma-2" color="primary" variant="tonal" @click="$router.push('/')">
      <v-icon class="me-2">mdi-arrow-left</v-icon>
      {{ $t('join.errors.back') }}
    </v-btn>
    <div />
    <v-btn class="mx-2" variant="tonal" @click="userStore.logout()">
      <v-icon class="me-2">mdi-logout</v-icon>
      {{ $t('logout') }}
    </v-btn>
  </div>
  <div v-else>
    <!-- SHOW SUCCESS -->

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
        this.error = true
        return
      }

      try {
        const res = await api.post('/team/get-join', { token })
        const teamUser = res.data.data.team_user
        var user = res.data.data.user

        if(teamUser.validUntil && new Date(teamUser.validUntil) < new Date()) this.errorText = this.$t('join.errors.expired')
        if(this.userStore.token && teamUser.userId !== this.userStore.user.id) {
          this.errorText = this.$t('join.errors.wrong_user', { email: this.userStore.user.email })
          this.error = true
        }
      } catch (error) {
        this.notificationStore.handleBackendError(error)
        this.error = true
      } finally {
        this.loading = false
      }

      if(this.error) {
        return
      }
      // WE FETCHED INFO ABOUT THE TOKEN AND IF SOMETHING WAS WRONG WE SHOWED AN ERROR
      if(this.userStore.token) {
        // USER LOGGEN IN WITH CORRECT EMAIL ALREADY SO WE JOIN THE TEAM
        this.joinTeam(token, '/callback?first=true', undefined)
      } else {
        // USER NOT LOGGED IN
        if(user.forcePasswordChange || !user.firstName || !user.lastName) {
          // CASE 1 INFO NEEDED - forcePasswordChange or firstName and lastName missing or both
          this.$router.push(`/add-details?token=${token}&pw=${user.forcePasswordChange ? 'true' : 'false'}&name=${!user.firstName || !user.lastName ? 'true' : 'false'}&email=${user.email}&preferredLanguage=${user.preferredLanguage}`)
        } else {
          // CASE 2 EVERYTHING GUCCI - JUST JOIN THE DAMN TEAM
          this.joinTeam(token, '/sign-in', undefined)
          this.notificationStore.success(this.$t('join.success') + '! ' + this.$t('join.success_description')) + '.'
        }
      }
    },
    methods: {
      joinTeam(token, goTo, errorGoTo) {
        api.post('/team/join', {
          token
        })
          .then(() => {
            if(goTo) this.$router.push(goTo)
            this.notificationStore.success(this.$t('join.success'))
          })
          .catch((error) => {
            if(errorGoTo) this.$router.push(errorGoTo)
            this.notificationStore.handleBackendError(error)
          })
      }
    }
  }
</script>
