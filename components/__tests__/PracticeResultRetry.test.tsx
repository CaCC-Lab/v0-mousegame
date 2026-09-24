import React from 'react'
import { render, screen, act, within } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'

/**
 * れんしゅうのリザルト（v1.1 計画 G8、docs/game-spec.md §5）。
 *
 * - 0点で終わってもリザルトを出す（以前は何も出ずにメニューへ戻っていた）
 * - 「もういちど」で同じステージをすぐ遊べる（以前は「とじる」だけ）
 */
describe('れんしゅうのリザルト', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const playPracticeUntilTimeUp = () => {
    act(() => screen.getByTestId('mode-select-practice').click())
    act(() => screen.getByTestId('mode-start').click())
    // ステージ1は60秒。タイマーは描画のあとで張られるので1秒ずつ進める
    for (let second = 0; second < 62; second++) {
      act(() => {
        jest.advanceTimersByTime(1000)
      })
    }
  }

  it('0点で時間切れになっても、リザルトと次にやることが出る', () => {
    render(<FruitHarvestGame />)
    playPracticeUntilTimeUp()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('れんしゅうけっか')
    expect(within(dialog).getByTestId('result-next-focus')).toBeInTheDocument()
  })

  it('「もういちど」を押すと、すぐにれんしゅうが始まる', () => {
    render(<FruitHarvestGame />)
    playPracticeUntilTimeUp()

    act(() => within(screen.getByRole('dialog')).getByRole('button', { name: /もういちど/ }).click())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ちゅうだん/ })).toBeInTheDocument()
    expect(screen.getByText(/ステージ目標/)).toBeInTheDocument()
  })
})
