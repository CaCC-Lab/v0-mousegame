import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { translations, Language } from '@/lib/i18n/translations'

export function useLanguage() {
  // Detect browser language
  const getBrowserLanguage = (): Language => {
    if (typeof window !== 'undefined' && window.navigator) {
      const browserLang = window.navigator.language.toLowerCase()
      if (browserLang.startsWith('en')) {
        return 'en'
      }
    }
    // Default to Japanese
    return 'ja'
  }

  // Initialize with browser language if no stored preference
  const [language, setLanguage] = useLocalStorage<Language>(
    'fruitHarvestLanguage',
    getBrowserLanguage()
  )

  // Get translations for current language
  const t = translations[language]

  // Toggle between languages
  const toggleLanguage = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja')
  }

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
  }
}