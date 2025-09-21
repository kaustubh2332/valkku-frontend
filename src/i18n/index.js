import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fi from './locales/fi.json'

const messages = {
  en,
  fi
}

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('valkku:locale') || 'en', // Default locale or saved locale
  fallbackLocale: 'en', // Fallback locale
  messages
})

export default i18n
