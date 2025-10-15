<template>
  <div>
    <v-card class="pa-4">
      <v-card-title class="text-h6 mb-2 d-flex align-center">
        {{ $t('calendar.export_events_title') }}
      </v-card-title>

      <v-card-text class="text-body-2 text-medium-emphasis mb-4">
        {{ $t('calendar.export_events_description') }}
      </v-card-text>

      <v-text-field
        v-model="url"
        :append-inner-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        class="mb-4"
        :color="copied ? 'success' : 'primary'"
        readonly
        variant="outlined"
        @click:append-inner="copyToClipboard"
      />

      <!-- Instructions Toggle Button -->
      <v-btn
        class="mb-4"
        color="primary"
        prepend-icon="mdi-help-circle-outline"
        size="small"
        variant="outlined"
        @click="showHelp = !showHelp"
      >
        {{ showHelp ? $t('calendar.hide_instructions') : $t('calendar.show_instructions') }}
      </v-btn>

      <v-snackbar
        v-model="showSnackbar"
        color="success"
        :timeout="2000"
      >
        {{ $t('common.copied') }}
      </v-snackbar>

      <v-expand-transition>
        <div v-show="showHelp">
          <v-divider class="my-4" />

          <div class="text-h6 mb-3">
            {{ $t('calendar.export_events_help') }}
          </div>

          <div class="text-body-2 text-medium-emphasis mb-3">
            {{ $t('calendar.export_events_instructions') }}
          </div>

          <v-list class="pa-0" density="compact">
            <v-list-item
              class="px-0"
              href="https://support.google.com/calendar/answer/37100"
              prepend-icon="mdi-google"
              rel="noopener noreferrer"
              target="_blank"
              title="Google Calendar"
            />
            <v-list-item
              class="px-0"
              href="https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-or-outlook-on-the-web-503ffaf6-7b86-44fe-8dd6-8099d95f38df"
              prepend-icon="mdi-microsoft-outlook"
              rel="noopener noreferrer"
              target="_blank"
              title="Microsoft Outlook"
            />
            <v-list-item
              class="px-0"
              href="https://support.apple.com/guide/calendar/subscribe-to-calendars-icl1022/mac"
              prepend-icon="mdi-apple"
              rel="noopener noreferrer"
              target="_blank"
              title="Apple Calendar (Mac)"
            />
            <v-list-item
              class="px-0"
              href="https://support.apple.com/102301"
              prepend-icon="mdi-cellphone"
              rel="noopener noreferrer"
              target="_blank"
              title="iPhone/iPad"
            />
          </v-list>
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script lang="ts">
  import { useUserStore } from '@/stores/user'
  import api from '@/utils/axios'

  export default {
    name: 'ExportEvents',
    setup() {
      const userStore = useUserStore()
      const currentRole = userStore.currentRole
      return { userStore, currentRole }
    },
    data() {
      return {
        url: '',
        copied: false,
        showSnackbar: false,
        showHelp: false
      }
    },
    created() {
      api.post('/calendar/create-subscription', {
        userId: this.userStore.user?.id,
        teamId: this.userStore.currentTeamId,
        role: this.currentRole.role,
        guardianOfId: this.currentRole.guardianOf || null
      }).then((response) => {
        this.url = response.data.data.url
      })
    },
    methods: {
      async copyToClipboard() {
        try {
          await navigator.clipboard.writeText(this.url)
          this.copied = true
          this.showSnackbar = true
          setTimeout(() => {
            this.copied = false
          }, 2000)
        } catch (error) {
          console.error('Failed to copy:', error)
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = this.url
          document.body.append(textArea)
          textArea.select()
          document.execCommand('copy')
          textArea.remove()
          this.copied = true
          this.showSnackbar = true
          setTimeout(() => {
            this.copied = false
          }, 2000)
        }
      }
    }
  }
</script>
