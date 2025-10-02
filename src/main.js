/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'
import VueRewards from 'vue-rewards'

// Plugins
import enterkeyhint from '@/directives/enterkeyhit.directive.js'
import zIndex from '@/directives/zIndex.directive.js'
import i18n from '@/i18n'
import { registerPlugins } from '@/plugins'
import { currentLocale } from '@/plugins/vuetify'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(VueRewards)
app.directive('enterkeyhint', enterkeyhint)
app.directive('z-index', zIndex)

registerPlugins(app)

// Keep Vuetify locale in sync with i18n locale
watch(
  () => i18n.global.locale.value,
  (newLocale) => {
    currentLocale.value = newLocale
  },
  { immediate: true }
)

app.mount('#app')
