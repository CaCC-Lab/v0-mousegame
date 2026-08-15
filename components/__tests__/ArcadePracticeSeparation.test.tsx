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
    const fruit = gameArea.querySelector('[data-fruit-id] [role="button"], [role="button"][data-fruit-id]')
      ?? gameArea.querySelector('[data-fruit-id]')
    expect(fruit).not.toBeNull()
    await user.click(fruit as HTMLElement)
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
