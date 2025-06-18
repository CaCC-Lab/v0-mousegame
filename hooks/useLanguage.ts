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
  // Ensure we always have valid translations
  const t = translations[language] || translations.ja

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