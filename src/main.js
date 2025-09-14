/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueRewards from 'vue-rewards'

// Plugins
import enterkeyhint from '@/directives/enterkeyhit.directive.js'
import i18n from '@/i18n'
import { registerPlugins } from '@/plugins'

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

registerPlugins(app)

app.mount('#app')
