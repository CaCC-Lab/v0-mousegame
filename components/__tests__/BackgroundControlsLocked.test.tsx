import React from 'react'
import { render, screen, act, within } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { ARCADE_CONFIG } from '@/types/arcade'

/**
 * 押しても意味のない操作を押せないようにする（v1.1 計画 G9、docs/game-spec.md §4.3）。
 *
 * - アーケードの結果が出ているあいだ、背後の操作列に「はじめる」が有効な状態で出ていた。
 *   結果の「もういちど」と開始導線が二重になり、初見テストで「どちらを押せばいいのか」と指摘された。
 * - アーケードにステージは無いのに、遊んでいる最中も「ステージ選択」が押せた。
 */
describe('結果表示中・アーケード中の背後の操作', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const startArcade = () => {
    act(() => {
      screen.getByTestId('mode-select-arcade').click()
    })
    act(() => {
      screen.getByTestId('mode-start').click()
    })
  }

  it('アーケード中は「ステージ選択」を押せない', () => {
    render(<FruitHarvestGame />)
    startArcade()

    expect(screen.getByRole('button', { name: /ステージ選択/ })).toBeDisabled()
  })

  it('アーケードの結果が出ているあいだ、結果の外に押せる「はじめる」は無い', () => {
    render(<FruitHarvestGame />)
    startArcade()

    act(() => {
      jest.advanceTimersByTime((ARCADE_CONFIG.duration + 2) * 1000)
    })

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: /もういちど/ })).toBeInTheDocument()

    const outsideStart = screen
      .queryAllByRole('button', { name: /はじめる/ })
      .filter((b) => !dialog.contains(b) && !(b as HTMLButtonElement).disabled)
    expect(outsideStart).toHaveLength(0)
  })

  it('待機中は「せってい」から「ステージ選択」を押せる', () => {
    render(<FruitHarvestGame />)
    act(() => {
      screen.getByTestId('mode-select-practice').click()
    })
    act(() => {
      screen.getByRole('button', { name: /せってい/ }).click()
    })

    expect(screen.getByRole('button', { name: /ステージ選択/ })).toBeEnabled()
  })
})
