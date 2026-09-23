import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { getComboMultiplier } from '@/lib/arcadeManager'

/**
 * コンボの表示は、遊んでいるモードごとに1か所（v1.1 計画 G2、docs/game-spec.md §8）。
 *
 * ベースライン: アーケードで4つ取ったとき、ScoreBar「x2 コンボ!」と ArcadeHUD「2 コンボ x1」が
 * 同時に出ていた（前者は得点に効かない見た目だけの倍率）。プレイエリアの「連続: N」も並んでいた。
 */
describe('コンボの表示は1か所', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
  })

  const clickApples = (times: number) => {
    for (let i = 0; i < times; i++) {
      const apple = document.querySelector('[role="button"][data-fruit-id]:has(img[src*="apple"])') as HTMLElement
      act(() => {
        apple.click()
      })
    }
  }

  /**
   * 畑にある果物を、正しい操作で取る（スイカ以外）。
   * れんしゅうの畑は種類がランダムなので、りんごが1つも無い回がある
   */
  const harvestAny = (times: number) => {
    for (let i = 0; i < times; i++) {
      const pick = (type: string) =>
        document.querySelector(`[role="button"][data-fruit-id]:has(img[src*="${type}"])`) as HTMLElement | null
      const apple = pick('apple')
      const lemon = pick('lemon')
      const berry = pick('blueberry')
      act(() => {
        if (apple) fireEvent.click(apple, { detail: 1 })
        else if (lemon) fireEvent.mouseDown(lemon, { button: 2 })
        else if (berry) fireEvent.doubleClick(berry, { detail: 2 })
        else throw new Error('スイカしか無い畑はこのテストの前提外')
      })
    }
  }

  it('アーケード: コンボはアーケードの表示にだけ出て、倍率は得点計算と一致する', () => {
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-arcade').click())
    act(() => screen.getByTestId('mode-start').click())

    clickApples(3)

    const arcadeCombo = screen.getByTestId('arcade-combo')
    expect(arcadeCombo).toHaveTextContent('3')
    expect(arcadeCombo).toHaveTextContent(`x${getComboMultiplier(3)}`)
    expect(screen.queryByTestId('streak-count')).not.toBeInTheDocument()
    expect(screen.queryByTestId('scorebar-streak')).not.toBeInTheDocument()
    // 倍率の表記は画面に1つだけ
    expect(screen.getAllByText(/x\d/)).toHaveLength(1)
  })

  it('れんしゅう: コンボはプレイエリアの表示にだけ出る', () => {
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-practice').click())
    act(() => screen.getByTestId('mode-start').click())

    harvestAny(2)

    expect(screen.getByTestId('streak-count')).toHaveTextContent('コンボ: 2')
    expect(screen.queryByTestId('arcade-combo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('scorebar-streak')).not.toBeInTheDocument()
  })
})
