/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
import { VHotkey } from 'vuetify/labs/VHotkey'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VHotkey,
  },
  display: {
    // Lower mobile breakpoint so $vuetify.display.mobile is true under 480px
    mobileBreakpoint: 800,
    thresholds: {
      xs: 0,
      sm: 480,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#01B0D8',
        },
      },
    },
  },
})
