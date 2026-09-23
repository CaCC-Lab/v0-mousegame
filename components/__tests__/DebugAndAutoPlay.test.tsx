import React from 'react'
import { render, screen, act, within } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'

/**
 * `?debug=1` の診断表示と `?test=1` の自動プレイ（v1.1 計画 G12、docs/game-spec.md §10）。
 *
 * スマホやヘッドレスでは開発者ツールが開けない。画面に「いま何が起きているか」を出す手段と、
 * 人が遊ばなくても4操作と結果画面まで通す手段を持つ（出荷前チェックリスト 3-3・6-5）。
 */
describe('検証用の入口', () => {
  const setSearch = (search: string) => window.history.replaceState({}, '', `/${search}`)

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    setSearch('')
  })

  it('指定しなければ診断は出ない', () => {
    render(<FruitHarvestGame />)
    expect(screen.queryByTestId('debug-panel')).not.toBeInTheDocument()
  })

  it('?debug=1 で、モード・状態・残り時間・コンボ・最後の入力・ミス数を出す', () => {
    setSearch('?debug=1')
    render(<FruitHarvestGame />)
    act(() => {
      jest.advanceTimersByTime(50)
    })

    const panel = screen.getByTestId('debug-panel')
    for (const label of ['mode', 'state', 'time', 'combo', 'last', 'miss']) {
      expect(within(panel).getByText(new RegExp(`^${label}`))).toBeInTheDocument()
    }
  })

  it('?test=1&debug=1&bot=beginner で、自動でチャレンジを遊び、4操作すべてを使って結果画面まで行く', () => {
    // チャレンジは時間をかせぐ型なので、ミスしない expert は 5 分近く続く（v1.2 D1）。
    // 早く終わる beginner（1.5 秒ごと・ミス 20%）で通す
    setSearch('?test=1&debug=1&bot=beginner')
    render(<FruitHarvestGame />)

    // 開始・カウントダウン・自動プレイのタイマーは、描画のあとで張られる。
    // 1回の act でまとめて進めると後から張られたタイマーが動かないので、1秒ずつ進める
    for (let second = 0; second < 300 && !screen.queryByRole('dialog'); second++) {
      act(() => {
        jest.advanceTimersByTime(1000)
      })
    }

    expect(screen.getByRole('dialog')).toHaveTextContent(/チャレンジけっか/)
    const panel = screen.getByTestId('debug-panel')
    for (const action of ['click', 'doubleClick', 'rightClick', 'drop']) {
      const value = Number(within(panel).getByTestId(`debug-ok-${action}`).textContent)
      expect(value).toBeGreaterThanOrEqual(1)
    }
    // beginner は5回に1回まちがえる。ミスは数として出る
    expect(Number(within(panel).getByTestId('debug-miss').textContent)).toBeGreaterThan(0)
  })
})
