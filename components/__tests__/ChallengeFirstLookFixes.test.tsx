import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { ArcadeResultModal } from '../game/ArcadeResultModal'
import { ScoreBar } from '../game/ScoreBar'
import { translations } from '@/lib/i18n/translations'
import { getRank, getRankProgress } from '@/lib/arcadeManager'
import { ARCADE_CONFIG, type ArcadeResult } from '@/types/arcade'

/**
 * v1.2 のあとの AI 初見テストで「採る」とした4件（docs/audits/20260924-ai-first-look-v1.2.md）。
 */
const t = translations.ja
const result = (overrides: Partial<ArcadeResult> = {}): ArcadeResult => ({
  score: 0, best: 0, isNewBest: false, maxCombo: 0, feverCount: 0, rank: getRank(0),
  weakOperation: null, endReason: 'timeUp', playedSec: 0, ...overrides,
})
const renderResult = (r: ArcadeResult) =>
  render(
    <ArcadeResultModal open result={r} rankProgress={getRankProgress(r.best)} language="ja" onRetry={jest.fn()} onClose={jest.fn()} t={t} />
  )

describe('1. 結果画面に「◯びょう つづいた」を出す', () => {
  // 遊びの約束を「どこまで つづけられるかな？」にしたのに、結果が続いた時間に答えていなかった（初見テスト 1番目）
  it('続いた時間を出す', () => {
    renderResult(result({ score: 2500, best: 2500, playedSec: 88 }))
    expect(screen.getByTestId('arcade-played-seconds')).toHaveTextContent('88びょう つづいた！')
  })

  it('0点でも続いた時間を出す（0 だけが主役にならないように）', () => {
    renderResult(result({ playedSec: 35 }))
    expect(screen.getByTestId('arcade-played-seconds')).toHaveTextContent('35びょう つづいた！')
  })

  it('ゲームは、何もしなければ開始時間ぶん続いたと記録する', () => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    jest.useFakeTimers()
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-start').click())
    for (let s = 0; s < ARCADE_CONFIG.startTimeSec + 2; s++) act(() => { jest.advanceTimersByTime(1000) })
    expect(screen.getByTestId('arcade-played-seconds')).toHaveTextContent(`${ARCADE_CONFIG.startTimeSec}びょう つづいた！`)
    jest.useRealTimers()
  })
})

describe('2. 残り時間に「のこり」を付け、残り5秒で色を変える', () => {
  it('「のこり」と出す', () => {
    render(<ScoreBar score={0} highScore={0} timeLeft={20} gameState="playing" stage={null} t={t} />)
    expect(screen.getByTestId('time-left')).toHaveTextContent('のこり')
    expect(screen.getByTestId('time-left')).not.toHaveAttribute('data-urgent', 'true')
  })

  it('残り5秒以下で、急ぐ見た目になる', () => {
    render(<ScoreBar score={0} highScore={0} timeLeft={5} gameState="playing" stage={null} t={t} />)
    expect(screen.getByTestId('time-left')).toHaveAttribute('data-urgent', 'true')
  })
})

describe('3. 0点の目標を「まずは 1こ とろう」にする', () => {
  // 0点から「つぎは 100てん」は遠い（初見テスト 8番目）
  it('0点なら「まずは 1こ とろう」', () => {
    renderResult(result())
    expect(screen.getByTestId('arcade-next-target')).toHaveTextContent('まずは 1こ とろう')
    expect(screen.getByTestId('arcade-next-target')).not.toHaveTextContent('100')
  })

  it('点が取れていれば、これまでどおり「つぎは ◯てんを めざそう」', () => {
    renderResult(result({ score: 1000, best: 1000, playedSec: 60 }))
    expect(screen.getByTestId('arcade-next-target')).toHaveTextContent('つぎは 1,100てんを めざそう')
  })
})

describe('4. チャレンジ中の「ステージ選択」は出さない', () => {
  // 無効表示は伝わらず、2回続けて「チャレンジ中にステージ選択は矛盾」と指摘された
  it('チャレンジ中は「ステージ選択」ボタンが無い', () => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-start').click())
    expect(screen.queryByRole('button', { name: /ステージ選択/ })).not.toBeInTheDocument()
  })

  it('れんしゅう中は「ステージ選択」がある', () => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-practice').click())
    act(() => screen.getByTestId('mode-start').click())
    expect(screen.getByRole('button', { name: /ステージ選択/ })).toBeEnabled()
  })
})
