/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */


import { createAuth0 } from '@auth0/auth0-vue'

import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Composables

// Components
import App from './App.vue'


// Styles
import 'unfonts.css'

const app = createApp(App)

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
