/**
 * Issue #42: アーケードモードの画面配線テスト。
 * 実装（useGameLogic / useArcadeMode）はモックせず、実際の動きを確かめる。
 */

import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { ARCADE_CONFIG } from '@/types/arcade'

describe('FruitHarvestGame - アーケードモード', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => { jest.clearAllTimers() })
    jest.useRealTimers()
  })

  /** fake timers 環境で userEvent を使うための設定 */
  function makeUser() {
    return userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
  }

  it('待機中はモード選択が表示される', () => {
    render(<FruitHarvestGame />)

    expect(screen.getByTestId('mode-select-arcade')).toBeInTheDocument()
    expect(screen.getByTestId('mode-select-practice')).toBeInTheDocument()
  })

  it('アーケードを選ぶとゲームが始まり、コンボ／フィーバーのHUDが出る', async () => {
    const user = makeUser()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-arcade'))

    expect(screen.getByTestId('arcade-fever-gauge')).toBeInTheDocument()
    expect(screen.queryByTestId('mode-select-arcade')).not.toBeInTheDocument()
  })

  it('練習モードではアーケードHUDを出さない', async () => {
    const user = makeUser()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-practice'))

    expect(screen.queryByTestId('arcade-fever-gauge')).not.toBeInTheDocument()
  })

  it('アーケードの残り時間は60秒から始まる', async () => {
    const user = makeUser()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-arcade'))

    expect(ARCADE_CONFIG.duration).toBe(60)
    expect(screen.getByRole('application')).toHaveTextContent(/1分00秒|1:00/)
  })

  it('時間切れでアーケード結果が出て、練習用の結果画面は出ない', async () => {
    const user = makeUser()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-arcade'))
    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })

    expect(screen.getByTestId('arcade-retry')).toBeInTheDocument()
    // 練習モードの結果モーダル（ほし評価）は出さない
    expect(screen.queryByTestId('star-rating-display')).not.toBeInTheDocument()
  })

  it('結果画面の「もういちど」でそのまま次のプレイに入れる', async () => {
    const user = makeUser()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-arcade'))
    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })
    await user.click(screen.getByTestId('arcade-retry'))

    expect(screen.queryByTestId('arcade-retry')).not.toBeInTheDocument()
    expect(screen.getByTestId('arcade-fever-gauge')).toBeInTheDocument()
  })

  it('結果画面の「メニューへ」でモード選択に戻る', async () => {
    const user = makeUser()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-arcade'))
    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })
    await user.click(screen.getByTestId('arcade-back-to-menu'))

    expect(screen.getByTestId('mode-select-arcade')).toBeInTheDocument()
  })

  it('アーケードではステージクリア画面が出ない', async () => {
    const user = makeUser()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-arcade'))
    act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.duration * 1000) })

    expect(screen.queryByText(/ステージクリア|Stage Clear/)).not.toBeInTheDocument()
  })
})
