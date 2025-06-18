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
  const currentLanguage: Language = language === 'en' || language === 'ja' ? language : 'ja'
  const t = translations[currentLanguage]

  // Toggle between languages
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ja' ? 'en' : 'ja'
    setLanguage(newLang)
    // Force update by logging
    console.log('Language changed to:', newLang)
  }

  return {
    language: currentLanguage,
    setLanguage,
    toggleLanguage,
    t,
  }
}