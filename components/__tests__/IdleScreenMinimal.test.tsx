import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'

/**
 * 待機中の画面は「題名・モード2枚・はじめる」（v1.1 計画 G7・D6、チェックリスト 1-3）。
 * 遊んでいる最中の HUD（得点・時間・ベスト・ステージ目標・凡例・コンボ）は開始してから出す。
 *
 * ベースライン: 起動画面のビューポート内の文字ブロック 47（遊ぶ前にステージ目標 0/100 まで出ていた）。
 */
describe('待機中の画面', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
  })

  it('題名・モード2枚・はじめるを出し、遊んでいる最中の表示は出さない', () => {
    render(<FruitHarvestGame />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('フルーツハーベストゲーム')
    expect(screen.getByTestId('mode-select-arcade')).toBeInTheDocument()
    expect(screen.getByTestId('mode-select-practice')).toBeInTheDocument()
    expect(screen.getByTestId('mode-start')).toBeInTheDocument()

    expect(screen.queryByTestId('score-value')).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+分\d+秒/)).not.toBeInTheDocument()
    expect(screen.queryByText('ベスト:')).not.toBeInTheDocument()
    expect(screen.queryByText('とりかた')).not.toBeInTheDocument()
    expect(screen.queryByText(/ステージ目標/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('streak-count')).not.toBeInTheDocument()
  })

  it('はじめると、得点・時間・凡例が出る', () => {
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-start').click())

    expect(screen.getByTestId('score-value')).toBeInTheDocument()
    expect(screen.getByText(/\d+分\d+秒/)).toBeInTheDocument()
    expect(screen.getByText('とりかた')).toBeInTheDocument()
  })
})
