import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../FruitHarvestGame'

/**
 * アーケード中に練習モードの表示が混ざらないことの検証（4人目のプレイテストの指摘）。
 *
 * 「Arcade中に『Today's practice complete! 0-day streak』が出る」
 *
 * 「きょうのれんしゅう」は練習モードの日課で、60秒スコアアタックの
 * アーケードとは別の遊び。アーケードの収穫で埋まってしまうと、
 * 何をした結果なのかが分からなくなる。
 */
const updateGoals = jest.fn()

jest.mock('@/hooks/useDailyPractice', () => {
  const actual = jest.requireActual('@/hooks/useDailyPractice')
  return {
    ...actual,
    useDailyPractice: () => ({
      ...actual.useDailyPractice(),
      updateGoals,
    }),
  }
})

describe('アーケードと練習の分離', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    updateGoals.mockClear()
  })

  const harvestOnce = async (user: ReturnType<typeof userEvent.setup>) => {
    const gameArea = screen.getByTestId('game-area')
    // 正しい操作で1つ取る。ブルーベリーへのクリックはダブルクリック待ちで判定が遅れるので、
    // りんご（クリック）→レモン（右クリック）→ブルーベリー（ダブルクリック）の順に、畑にあるものを使う。
    // れんしゅうの畑は種類がランダムで、りんごが1つも無い回がある
    const pick = (type: string) =>
      gameArea.querySelector(`[role="button"][data-fruit-id]:has(img[src*="${type}"])`) as HTMLElement | null
    const apple = pick('apple')
    const lemon = pick('lemon')
    const berry = pick('blueberry')
    if (apple) await user.click(apple)
    else if (lemon) await user.pointer({ keys: '[MouseRight]', target: lemon })
    else if (berry) await user.dblClick(berry)
    else throw new Error('スイカしか無い畑はこのテストの前提外')
  }

  it('アーケードの収穫では、きょうのれんしゅうを更新しない', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-arcade'))
    await user.click(screen.getByTestId('mode-start'))
    await harvestOnce(user)

    expect(updateGoals).not.toHaveBeenCalled()
  })

  it('練習モードの収穫では、これまでどおり更新する', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-practice'))
    await user.click(screen.getByTestId('mode-start'))
    await harvestOnce(user)

    expect(updateGoals).toHaveBeenCalled()
  })
})
