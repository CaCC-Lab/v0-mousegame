import React from 'react'
import { render, screen, act, within, fireEvent } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { ARCADE_CONFIG } from '@/types/arcade'

/**
 * チャレンジの画面の流れ（v1.2 D1・D2・D4・D7、docs/game-spec.md §4.2・§4.3・§5）。
 */
describe('チャレンジの画面の流れ', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const tick = (seconds: number) => {
    for (let i = 0; i < seconds; i++) act(() => { jest.advanceTimersByTime(1000) })
  }
  const clickApple = () => {
    const apple = document.querySelector('[role="button"][data-fruit-id]:has(img[src*="apple"])') as HTMLElement
    act(() => { fireEvent.click(apple, { detail: 1 }) })
  }
  const missOnLemon = () => {
    const lemon = document.querySelector('[role="button"][data-fruit-id]:has(img[src*="lemon"])') as HTMLElement
    act(() => { fireEvent.click(lemon, { detail: 1 }) })
  }

  it('起動画面に、4つの果物と操作を1行で出す（v1.2 D7）', () => {
    render(<FruitHarvestGame />)
    const selector = screen.getByTestId('mode-selector')
    expect(within(selector).getByText('とりかた')).toBeInTheDocument()
    for (const op of ['クリック', 'ダブルクリック', '右クリック', 'ドラッグ']) {
      expect(within(selector).getByText(op)).toBeInTheDocument()
    }
  })

  it('チャレンジのカードは「30びょう から」（60秒固定ではない）', () => {
    render(<FruitHarvestGame />)
    expect(screen.getByTestId('mode-select-arcade')).toHaveTextContent(`${ARCADE_CONFIG.startTimeSec}びょう から`)
    expect(screen.getByTestId('mode-select-arcade')).toHaveTextContent('チャレンジ')
  })

  it('25 個取ると「フルーツが うごきだした！」を一度だけ知らせる（v1.2 D2）', () => {
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-start').click())
    for (let i = 0; i < ARCADE_CONFIG.moveAfterHarvests - 1; i++) clickApple()
    expect(screen.queryByTestId('fruits-moving-notice')).not.toBeInTheDocument()
    clickApple()
    expect(screen.getByTestId('fruits-moving-notice')).toHaveTextContent('フルーツが うごきだした！')
    // 一度だけ: しばらくすると消え、そのあと取り続けても出し直さない
    tick(3)
    expect(screen.queryByTestId('fruits-moving-notice')).not.toBeInTheDocument()
    clickApple()
    expect(screen.queryByTestId('fruits-moving-notice')).not.toBeInTheDocument()
  })

  it('結果の「れんしゅうで ためす」で、れんしゅうが始まる（v1.2 D4）', () => {
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-start').click())
    missOnLemon()
    tick(ARCADE_CONFIG.startTimeSec + 2)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByTestId('arcade-weak-operation')).toHaveTextContent('レモン')
    act(() => within(dialog).getByRole('button', { name: 'れんしゅうで ためす' }).click())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/ステージ目標/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ちゅうだん/ })).toBeInTheDocument()
  })
})
