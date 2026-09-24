import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { translations, Language } from '@/lib/i18n/translations'

/**
 * ブラウザの言語設定から表示言語を決める。
 * 日本語なら日本語、それ以外は英語（CrazyGames の「英語フォールバック」の要件。v1.1 計画 D8）。
 */
export function languageFromBrowser(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('ja') ? 'ja' : 'en'
}

export function useLanguage() {
  // ブラウザの言語から決める（日本語以外は英語。docs/game-spec.md §9）
  const getBrowserLanguage = (): Language => {
    if (typeof window !== 'undefined' && window.navigator) {
      return languageFromBrowser(window.navigator.language)
    }
    // 静的エクスポートの HTML は日本語で書き出す（クライアントで判定し直す）
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
    if (!urlLang) {
      // 保存済みの設定も URL 指定も無ければ、ブラウザの言語に合わせる。
      // 静的エクスポートの HTML は日本語で書き出されるので、初回描画との食い違いを
      // React が描き直すのに任せず、読み込み後に明示的に切り替える（WebKit で1回取りこぼした）
      let stored: string | null = null
      try {
        stored = window.localStorage.getItem('fruitHarvestLanguage')
      } catch {
        // 読めなければブラウザの言語に合わせる
      }
      const browserLang = getBrowserLanguage()
      if (stored === null && browserLang !== language) {
        setLanguage(browserLang)
      }
      return
    }
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

  // <html lang> を表示している言語に合わせる（読み上げ・ブラウザの自動翻訳が正しく働くように）
  useEffect(() => {
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  // Toggle between languages
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ja' ? 'en' : 'ja'
    setLanguage(newLang)
  }

  return {
    language: currentLanguage,
    setLanguage,
    toggleLanguage,
    t,
  }
}