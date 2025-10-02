/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Vue
import { ref } from 'vue'

// Composables
import { createVuetify } from 'vuetify'
import { VDateInput } from 'vuetify/labs/VDateInput'
import { VHotkey } from 'vuetify/labs/VHotkey'

// Locales
import { en, fi } from 'vuetify/locale'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Create a reactive locale ref - initialize with stored locale or default to 'en'
function getInitialLocale() {
  // Check localStorage for saved locale (same logic as i18n)
  const savedLocale = localStorage.getItem('valkku:locale')
  if (savedLocale && ['en', 'fi'].includes(savedLocale)) {
    return savedLocale
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0]
  if (['en', 'fi'].includes(browserLang)) {
    return browserLang
  }

  // Default to English
  return 'en'
}

const currentLocale = ref(getInitialLocale())

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components: {
    VHotkey,
    VDateInput
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
  locale: {
    locale: currentLocale,
    fallback: 'en',
    messages: { en, fi }
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

// Export the reactive locale for use in composables
export { currentLocale }
