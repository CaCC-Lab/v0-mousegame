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

  // URL パラメータ ?lang=en / ?lang=ja による強制指定（共有リンク・教室展開・埋め込み向け）
  const getUrlLanguage = (): Language | null => {
    if (typeof window !== 'undefined' && window.location) {
      const param = new URLSearchParams(window.location.search).get('lang')?.toLowerCase()
      if (param === 'en' || param === 'ja') {
        return param
      }
    }
    return null
  }

  // Initialize with browser language if no stored preference
  const [language, setLanguage] = useLocalStorage<Language>(
    'fruitHarvestLanguage',
    getBrowserLanguage()
  )

  // URL 指定は保存済み設定より優先し、次回以降のために保存もする。
  // マウント直後は useLocalStorage が未ハイドレートで setter が保存をスキップするため、
  // localStorage へは直接書き込む（state 側は setLanguage で更新）。
  useEffect(() => {
    const urlLang = getUrlLanguage()
    if (urlLang) {
      try {
        window.localStorage.setItem('fruitHarvestLanguage', JSON.stringify(urlLang))
      } catch {
        // プライベートモード等では保存しない（表示の切替だけ行う）
      }
      if (urlLang !== language) {
        setLanguage(urlLang)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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