/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

import { createAuth0 } from '@auth0/auth0-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueRewards from 'vue-rewards'

// Plugins
import i18n from '@/i18n'
import { registerPlugins } from '@/plugins'

// Utils
import { setupAxiosWithAuth0 } from '@/utils/axios'

// Composables

// Components
import App from './App.vue'


// Styles
import 'unfonts.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(VueRewards)

const auth0 = createAuth0({
  domain: "valkku.eu.auth0.com",
  clientId: "TYPc6tf6czVlQFoRApFqdvtp9IzfayIR",
  authorizationParams: {
    redirect_uri: window.location.origin + '/#/callback',
    audience: 'https://valkku.eu.auth0.com/api/v2/',
    scope: 'openid profile email'
  },
  cacheLocation: "localstorage",   // persist tokens across refresh
  useRefreshTokens: true
})

app.use(auth0)

// Setup axios with Auth0 instance
setupAxiosWithAuth0(auth0)

registerPlugins(app)

app.mount('#app')
