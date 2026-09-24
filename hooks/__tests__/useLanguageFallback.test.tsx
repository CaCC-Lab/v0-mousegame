import { renderHook } from '@testing-library/react'
import { useLanguage, languageFromBrowser } from '../useLanguage'

/**
 * ブラウザの言語が日本語以外なら英語で始める（v1.1 計画 G16・D8、docs/game-spec.md §9）。
 *
 * CrazyGames は「locale に応じた言語 + 英語フォールバック」を求める。
 * 以前は en で始まる言語だけが英語で、韓国語・フランス語などは日本語で起動していた。
 */
describe('言語の自動判定', () => {
  it('日本語のブラウザは日本語、それ以外は英語', () => {
    expect(languageFromBrowser('ja-JP')).toBe('ja')
    expect(languageFromBrowser('ja')).toBe('ja')
    expect(languageFromBrowser('en-US')).toBe('en')
    expect(languageFromBrowser('ko-KR')).toBe('en')
    expect(languageFromBrowser('fr-FR')).toBe('en')
    expect(languageFromBrowser('zh-CN')).toBe('en')
    expect(languageFromBrowser(undefined)).toBe('en')
  })

  it('<html lang> を表示している言語に合わせる（読み上げ・自動翻訳のため）', () => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('en'))
    renderHook(() => useLanguage())
    expect(document.documentElement.lang).toBe('en')
  })
})
