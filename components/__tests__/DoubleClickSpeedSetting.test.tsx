import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'

/**
 * 「せってい」の「ダブルクリックの はやさ」（docs/game-spec.md §2）。
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---|---|---|---|---|
 * | DS-N-01 | 保存なし | Equivalence – 既定 | 「ふつう」が選ばれている | - |
 * | DS-N-02 | 「ゆっくり」を選ぶ | Equivalence – normal | LocalStorage に 'slow' を保存 | - |
 * | DS-N-03 | 'verySlow' が保存済み | Persistence | 「もっとゆっくり」で始まる | - |
 * | DS-A-01 | 不正な値が保存済み | Invalid | 「ふつう」 | 壊れた保存データ |
 * | DS-A-02 | JSON でない値が保存済み | Invalid format | 「ふつう」 | useLocalStorage が読めない |
 * | DS-A-03 | 英語 | i18n | 英語のラベル | - |
 */
describe('ダブルクリックの はやさ の設定', () => {
  const KEY = 'fruitHarvestDoubleClickSpeed'

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
  })

  const openSettings = () => {
    act(() => screen.getByRole('button', { name: /せってい|Settings/ }).click())
  }
  const speedSelect = () => screen.getByLabelText(/ダブルクリックの はやさ|Double-click speed/) as HTMLSelectElement

  it('DS-N-01: 保存が無ければ「ふつう」', () => {
    // Given: 保存なし When: せっていを開く Then: ふつう
    render(<FruitHarvestGame />)
    openSettings()
    expect(speedSelect().value).toBe('normal')
    expect(speedSelect()).toHaveDisplayValue(/ふつう/)
  })

  it('DS-N-02: 「ゆっくり」を選ぶと保存される', () => {
    // Given: ふつう When: ゆっくりを選ぶ Then: 表示と LocalStorage が slow
    render(<FruitHarvestGame />)
    openSettings()
    fireEvent.change(speedSelect(), { target: { value: 'slow' } })
    expect(speedSelect().value).toBe('slow')
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toBe('slow')
  })

  it('DS-N-03: 保存した「もっとゆっくり」で始まる', () => {
    // Given: verySlow を保存 When: 開く Then: もっとゆっくり
    localStorage.setItem(KEY, JSON.stringify('verySlow'))
    render(<FruitHarvestGame />)
    openSettings()
    expect(speedSelect().value).toBe('verySlow')
    expect(speedSelect()).toHaveDisplayValue(/もっとゆっくり/)
  })

  it('DS-A-01: 知らない値が保存されていたら「ふつう」', () => {
    // Given: 'turbo' を保存 When: 開く Then: ふつう
    localStorage.setItem(KEY, JSON.stringify('turbo'))
    render(<FruitHarvestGame />)
    openSettings()
    expect(speedSelect().value).toBe('normal')
  })

  it('DS-A-02: JSON でない値が保存されていても「ふつう」', () => {
    // Given: 壊れた文字列 When: 開く Then: ふつう
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(KEY, '{broken')
    render(<FruitHarvestGame />)
    openSettings()
    expect(speedSelect().value).toBe('normal')
    warn.mockRestore()
  })

  it('DS-A-03: 英語では英語のラベル', () => {
    // Given: 英語 When: 開く Then: Double-click speed / Slow
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('en'))
    render(<FruitHarvestGame />)
    openSettings()
    expect(screen.getByLabelText(/Double-click speed/)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /^Slow/ })).toBeInTheDocument()
  })
})
