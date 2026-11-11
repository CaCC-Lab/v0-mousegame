import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { ArcadeResultModal } from '../game/ArcadeResultModal'
import { ArcadeHUD } from '../game/ArcadeHUD'
import { DropArea } from '../game/DropArea'
import { ScoreBar } from '../game/ScoreBar'
import { translations } from '@/lib/i18n/translations'
import { getRank, getRankProgress } from '@/lib/arcadeManager'
import type { ArcadeResult } from '@/types/arcade'

/**
 * 初見テストの判断4件のうち、表示が変わる3件（docs/v1.2-plan.md §7、2026-11-11）。
 * カードを押しても始まらないことは ModeSelector の既存テストのまま（コードは変えない）。
 *
 * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
 * |---|---|---|---|---|
 * | FL-N-01 | 日本語の帯 | Equivalence – normal | 「スイカをここへ」が1行 | 折り返して割れない |
 * | FL-N-02 | 待機中とプレイ中 | Equivalence – normal | 帯が両方にある | 常時表示 |
 * | FL-N-03 | 得点 0・35秒 | Equivalence – normal | 続いた時間が最大。0 はベスト・コンボと同じ text-xl | 0点の主役 |
 * | FL-N-04 | チャレンジ開始・ゲージ 0 と満タン | Equivalence – normal | 「つづけてとるとてんすうアップ」。語「コンボ」も残る | ゲージの横 |
 * | FL-N-05 | プレイ中の見出し | Equivalence – normal | 「てんすう:」 | |
 * | FL-N-06 | せっていを開く | Equivalence – normal | 「ステージをえらぶ」 | |
 * | FL-A-01 | 英語の帯 | Equivalence – abnormal | DROP のまま | 日本語にしない |
 * | FL-A-02 | 得点 1 | Boundary – +1 | 続いた時間は主役サイズではない。得点は 3rem | 0点だけの規則 |
 * | FL-A-03 | 得点 0・playedSec 無し | Boundary – NULL | 落ちない。時間の行は無い。0 は text-xl | |
 * | FL-A-04 | 得点 -1 | Boundary – 負 | 0点と同じ大きさ | 不正な得点 |
 * | FL-A-05 | 英語の HUD | Equivalence – abnormal | コンボの1行に日本語が無い | |
 * | FL-A-06 | ボーナスタイム中 | Equivalence – abnormal | 1行は残る。ヒントは「2ばい」 | 1行でヒントを置き換えない |
 * | FL-A-07 | れんしゅう中 | Equivalence – abnormal | コンボの1行は出ない | チャレンジのゲージだけ |
 * | FL-B-01 | 得点 0・0秒 | Boundary – 0 | 「0びょう つづいた！」が主役サイズ | 0秒でも出す |
 * | FL-B-02 | ゲージ 0 と最大 | Boundary – 0 / 最大 | どちらでも1行が出る | |
 */

const ja = translations.ja

function result(overrides: Partial<ArcadeResult> = {}): ArcadeResult {
  const score = overrides.score ?? 0
  return {
    score,
    best: overrides.best ?? 0,
    isNewBest: false,
    maxCombo: overrides.maxCombo ?? 0,
    feverCount: 0,
    rank: getRank(Math.max(score, 0)),
    weakOperation: null,
    endReason: 'timeUp',
    ...overrides,
  }
}

function renderResult(value: ArcadeResult) {
  return render(
    <ArcadeResultModal
      open
      result={value}
      rankProgress={getRankProgress(value.best)}
      language="ja"
      onRetry={jest.fn()}
      onClose={jest.fn()}
      t={ja}
    />
  )
}

function statValue(testId: string): HTMLElement {
  const node = screen.getByTestId(testId).querySelector('[data-stat-value]')
  if (!(node instanceof HTMLElement)) {
    throw new Error(`${testId} の数値が見つからない`)
  }
  return node
}

describe('初見の判断: 右端の帯', () => {
  it('FL-N-01: 日本語の帯は「スイカをここへ」を1行で出す', () => {
    // Given: 日本語
    // When: 帯を描く
    // Then: 決めた語が、文字ごとに割れない1行で出る
    render(<DropArea t={ja} />)
    const label = screen.getByTestId('drop-area-label')
    expect(label).toHaveTextContent('スイカをここへ')
    expect(label).toHaveClass('whitespace-nowrap')
    expect(label).not.toHaveClass('flex-col')
    expect(screen.getByTestId('drop-area')).toHaveClass('w-[7.5rem]')
  })

  it('FL-N-02: 待機中もプレイ中も帯を出す', () => {
    // Given: 日本語の起動画面
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    render(<FruitHarvestGame />)

    // When: 待機中の帯を見る
    // Then: 帯がある。モード選択は帯の手前に収まる
    expect(screen.getByTestId('drop-area-label')).toHaveTextContent('スイカをここへ')
    expect(screen.getByTestId('mode-selector').parentElement).toHaveClass('right-[7.5rem]')

    // When: はじめる
    act(() => screen.getByTestId('mode-start').click())

    // Then: プレイ中も帯があり、凡例は帯の手前で止まる
    expect(screen.getByTestId('drop-area')).toBeInTheDocument()
    expect(screen.getByTestId('drop-area-label')).toHaveTextContent('スイカをここへ')
    expect(screen.getByTestId('operation-legend').parentElement).toHaveClass('right-[7.5rem]')
  })

  it('FL-A-01: 英語の帯は DROP のまま', () => {
    // Given: 英語
    // When: 帯を描く
    // Then: 日本語の目的語は出ない
    render(<DropArea t={translations.en} />)
    expect(screen.getByTestId('drop-area-label')).toHaveTextContent('DROP')
    expect(screen.getByTestId('drop-area-label')).not.toHaveTextContent('スイカ')
  })
})

describe('初見の判断: 0点の結果', () => {
  it('FL-N-03: 0点では続いた時間が一番大きく、0 はベストとコンボと同じ大きさ', () => {
    // Given: 0点で 35 秒続いた
    // When: 結果を出す
    // Then: 続いた時間が text-4xl。得点の 0 はベスト・コンボと同じ text-xl
    renderResult(result({ score: 0, best: 0, maxCombo: 0, playedSec: 35 }))

    const played = screen.getByTestId('arcade-played-seconds')
    const score = screen.getByTestId('arcade-result-score')
    expect(played).toHaveTextContent('35びょう つづいた！')
    expect(played).toHaveClass('text-4xl')
    expect(played).not.toHaveClass('text-xl')
    expect(score).toHaveTextContent('0')
    expect(score).toHaveClass('text-xl')
    expect(score).not.toHaveClass('text-4xl')
    expect(statValue('arcade-result-best')).toHaveClass('text-xl')
    expect(statValue('arcade-result-max-combo')).toHaveClass('text-xl')
  })

  it('FL-B-01: 0秒・0点でも続いた時間を主役の大きさで出す', () => {
    // Given: 得点 0、続いた時間 0 秒
    // When: 結果を出す
    // Then: 「0びょう つづいた！」が text-4xl
    renderResult(result({ score: 0, playedSec: 0 }))
    const played = screen.getByTestId('arcade-played-seconds')
    expect(played).toHaveTextContent('0びょう つづいた！')
    expect(played).toHaveClass('text-4xl')
  })

  it('FL-A-02: 1点では続いた時間を主役にしない', () => {
    // Given: 得点 1（0 の隣）
    // When: 結果を出す
    // Then: 続いた時間は text-xl のまま。得点は 3rem
    renderResult(result({ score: 1, best: 1, playedSec: 35 }))
    expect(screen.getByTestId('arcade-played-seconds')).toHaveClass('text-xl')
    expect(screen.getByTestId('arcade-played-seconds')).not.toHaveClass('text-4xl')
    expect(screen.getByTestId('arcade-result-score')).toHaveStyle({ fontSize: '3rem' })
    expect(screen.getByTestId('arcade-result-score')).not.toHaveClass('text-xl')
  })

  it('FL-A-03: 続いた時間が無い 0 点でも落ちず、0 は text-xl', () => {
    // Given: playedSec を渡さない
    // When: 結果を出す
    // Then: 時間の行は無く、得点の 0 は text-xl
    renderResult(result({ score: 0 }))
    expect(screen.queryByTestId('arcade-played-seconds')).not.toBeInTheDocument()
    expect(screen.getByTestId('arcade-result-score')).toHaveClass('text-xl')
  })

  it('FL-A-04: 負の得点も 0 点と同じ大きさ', () => {
    // Given: 得点 -1
    // When: 結果を出す
    // Then: 続いた時間が text-4xl、得点は text-xl
    renderResult(result({ score: -1, playedSec: 10 }))
    expect(screen.getByTestId('arcade-played-seconds')).toHaveClass('text-4xl')
    expect(screen.getByTestId('arcade-result-score')).toHaveClass('text-xl')
    expect(screen.getByTestId('arcade-result-score')).toHaveTextContent('-1')
  })
})

describe('初見の判断: コンボの1行と2語', () => {
  const hud = { combo: 0, comboMultiplier: 1, t: ja }

  it('FL-N-04: ゲージの横に効果の1行があり、溜まっているときは「コンボ」も読める', () => {
    // Given: 日本語・ゲージは空・ボーナスタイムではない
    // When: HUD を描く
    // Then: 決めた1行と、語「コンボ」
    render(<ArcadeHUD {...hud} feverGauge={0} isFever={false} />)
    expect(screen.getByTestId('combo-effect')).toHaveTextContent('つづけてとるとてんすうアップ')
    expect(screen.getByTestId('fever-hint')).toHaveTextContent('コンボ')
  })

  it('FL-B-02: ゲージが 0 でも最大でも1行を出す', () => {
    // Given: ゲージ 0
    const { rerender } = render(<ArcadeHUD {...hud} feverGauge={0} isFever={false} />)
    // Then: 1行がある
    expect(screen.getByTestId('combo-effect')).toBeInTheDocument()

    // When: ゲージを最大にする
    rerender(<ArcadeHUD {...hud} feverGauge={50} isFever={false} />)
    // Then: 1行は残る
    expect(screen.getByTestId('combo-effect')).toHaveTextContent('つづけてとるとてんすうアップ')
  })

  it('FL-A-05: 英語の1行に日本語は出ない', () => {
    // Given: 英語
    // When: HUD を描く
    // Then: 1行にひらがな・カタカナ・漢字が無い
    render(<ArcadeHUD {...hud} t={translations.en} feverGauge={0} isFever={false} />)
    expect(screen.getByTestId('combo-effect').textContent).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
  })

  it('FL-A-08: 狭い幅でも説明は別行に折れ、ゲージは縮まない', () => {
    // Given: コンボ表示とボーナスタイムのバナーが同時に出る
    // When: HUD を描く
    // Then: 説明は狭い幅で親いっぱいになり、広い幅ではゲージの横に戻る。ゲージは縮まない
    render(<ArcadeHUD {...hud} combo={3} comboMultiplier={2} feverGauge={50} isFever />)
    const hudRoot = screen.getByTestId('arcade-hud')
    const effect = screen.getByTestId('combo-effect')
    expect(hudRoot).toHaveClass('flex-wrap')
    expect(effect).toHaveClass('basis-full', 'sm:basis-auto')
    expect(screen.getByTestId('fever-gauge-box')).toHaveClass('shrink-0')
    expect(screen.getByTestId('arcade-fever-banner')).toHaveClass('shrink-0')
  })

  it('FL-A-09: 説明の文字は白ではなく、明るい背景の上の濃い色', () => {
    // Given: 説明を出す
    // When: HUD を描く
    // Then: 白文字のままヘッダやプレイエリアに載せず、白地に濃い文字を載せる
    render(<ArcadeHUD {...hud} feverGauge={0} isFever={false} />)
    const effect = screen.getByTestId('combo-effect')
    expect(effect).toHaveClass('bg-white')
    expect(effect.className).toContain('var(--color-purple)')
    expect(effect).not.toHaveClass('text-white')
  })

  it('FL-A-06: ボーナスタイム中も1行は残し、ヒントは2ばいのまま', () => {
    // Given: ボーナスタイム中
    // When: HUD を描く
    // Then: 効果の1行は残る。ヒントは「コンボでたまる」に戻さない
    render(<ArcadeHUD {...hud} feverGauge={50} isFever />)
    expect(screen.getByTestId('combo-effect')).toHaveTextContent('つづけてとるとてんすうアップ')
    expect(screen.getByTestId('fever-hint')).toHaveTextContent('2ばい')
    expect(screen.getByTestId('fever-hint')).not.toHaveTextContent('つづけてとるとてんすうアップ')
  })

  it('FL-N-05: プレイ中の見出しは「てんすう:」', () => {
    // Given: 日本語の得点バー
    // When: 描く
    // Then: 「てんすう:」で、「得点:」ではない
    render(<ScoreBar score={0} highScore={0} timeLeft={20} gameState="playing" stage={null} t={ja} />)
    const label = screen.getByText('てんすう:')
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('whitespace-nowrap')
    expect(screen.queryByText('得点:')).not.toBeInTheDocument()
  })

  it('FL-A-07: れんしゅう中はコンボの1行を出さない', () => {
    // Given: 日本語
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    render(<FruitHarvestGame />)

    // When: れんしゅうを選んではじめる
    act(() => screen.getByTestId('mode-select-practice').click())
    act(() => screen.getByTestId('mode-start').click())

    // Then: チャレンジのゲージ横の1行は無い
    expect(screen.queryByTestId('combo-effect')).not.toBeInTheDocument()
  })

  it('FL-N-06: 「せってい」の中は「ステージをえらぶ」', () => {
    // Given: 待機中
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    render(<FruitHarvestGame />)

    // When: せっていを開く
    act(() => screen.getByRole('button', { name: /せってい/ }).click())

    // Then: ボタンは「ステージをえらぶ」で、漢字の「選択」は無い
    const button = screen.getByRole('button', { name: 'ステージをえらぶ' })
    expect(button).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'ステージ選択' })).not.toBeInTheDocument()
  })

  it('チャレンジをはじめると、ゲージの横の1行と「てんすう:」が出る', () => {
    // Given: 日本語の待機画面
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    render(<FruitHarvestGame />)

    // When: カードは押さず、はじめる（既定はチャレンジ）
    act(() => screen.getByTestId('mode-start').click())

    // Then: 1行と見出しが出る。カード選択だけでは始まらない既存の分離は、はじめるまで mode-start があったことで足りる
    expect(screen.queryByTestId('mode-start')).not.toBeInTheDocument()
    expect(screen.getByTestId('combo-effect')).toHaveTextContent('つづけてとるとてんすうアップ')
    expect(screen.getByText('てんすう:')).toBeInTheDocument()
  })
})
