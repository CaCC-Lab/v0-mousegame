import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { GAME_SCORES } from '@/types/game'

/**
 * キーボードでも4種類すべてを取れる（アクセシビリティ。README「キーボードでの操作」）。
 *
 * 以前は Enter で選んだスイカを「クリック」として判定していたため、スイカだけは
 * キーボードでは必ずミスになっていた（v1.1 実装中に発見。docs/v1.1-tasks.md）。
 * キーボードではドラッグできないので、選んで Enter が「ドロップエリアへ運ぶ」の代わりになる。
 */
describe('キーボードで取る', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
  })

  const score = () => Number(screen.getByTestId('score-value').textContent!.replace(/[^\d]/g, ''))
  const selectedType = () => {
    const el = document.querySelector('[data-fruit-id][data-selected="true"] img') as HTMLImageElement | null
    return el?.getAttribute('src')?.match(/(apple|blueberry|lemon|watermelon)/)?.[1] ?? null
  }
  const press = (key: string) => act(() => { fireEvent.keyDown(window, { key }) })

  it('矢印で選んだ果物を Enter で取ると、どの種類でも得点が入る（スイカを含む）', () => {
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-arcade').click())
    act(() => screen.getByTestId('mode-start').click())

    const harvested = new Set<string>()
    for (let i = 0; i < 60 && harvested.size < 4; i++) {
      press('ArrowDown')
      const type = selectedType()
      expect(type).not.toBeNull()
      const before = score()
      press('Enter')
      expect({ type, gained: score() - before > 0 }).toEqual({ type, gained: true })
      harvested.add(type!)
    }
    expect(Array.from(harvested).sort()).toEqual(['apple', 'blueberry', 'lemon', 'watermelon'])
  })

  it('スイカの加点は、スイカの基礎点（25点）にコンボ倍率をかけた値', () => {
    // れんしゅうのステージ1は 100 点で即クリアして終わるので、終わらないアーケードで確かめる。
    // 矢印は位置で選ぶのでスイカに届かない回がある。先頭を選んで取るのを繰り返す
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-arcade').click())
    act(() => screen.getByTestId('mode-start').click())

    for (let i = 0; i < 80; i++) {
      press('ArrowDown')
      const type = selectedType()
      const before = score()
      press('Enter')
      if (type === 'watermelon') {
        const gained = score() - before
        expect(gained).toBeGreaterThan(0)
        expect(gained % GAME_SCORES.watermelon).toBe(0)
        return
      }
    }
    throw new Error('スイカを一度も選べなかった')
  })
})
