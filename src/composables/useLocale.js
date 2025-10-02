/**
 * useLocale composable
 *
 * Provides reactive locale management for both Vue i18n and Vuetify
 */

import { useI18n } from 'vue-i18n'
import { currentLocale } from '@/plugins/vuetify'

export function useLocale() {
  const { locale: i18nLocale } = useI18n()

  /**
   * Change the application locale
   * @param {string} newLocale - The locale to change to ('en' or 'fi')
   */
  const changeLocale = (newLocale) => {
    // Change Vue i18n locale
    i18nLocale.value = newLocale

    // Change Vuetify locale
    currentLocale.value = newLocale
  }

  /**
   * Get the current locale
   * @returns {string} The current locale
   */
  const getCurrentLocale = () => {
    return i18nLocale.value
  }

  /**
   * Check if the current locale is Finnish
   * @returns {boolean} True if locale is Finnish
   */
  const isFinnish = () => {
    return getCurrentLocale() === 'fi'
  }

  /**
   * Check if the current locale is English
   * @returns {boolean} True if locale is English
   */
  const isEnglish = () => {
    return getCurrentLocale() === 'en'
  }

  return {
    changeLocale,
    getCurrentLocale,
    isFinnish,
    isEnglish,
    currentLocale: i18nLocale,
    vuetifyLocale: currentLocale
  }
}
