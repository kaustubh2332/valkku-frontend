/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */


import { createAuth0 } from '@auth0/auth0-vue'
import { createApp } from 'vue'
import VueRewards from 'vue-rewards'

// Plugins
import i18n from '@/i18n'
import { registerPlugins } from '@/plugins'

// Composables

// Components
import App from './App.vue'


// Styles
import 'unfonts.css'

const app = createApp(App)

app.use(i18n)
app.use(VueRewards)

app.use(
  createAuth0({
    domain: "valkku.eu.auth0.com",
    clientId: "TYPc6tf6czVlQFoRApFqdvtp9IzfayIR",
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  })
);

registerPlugins(app)

app.mount('#app')
