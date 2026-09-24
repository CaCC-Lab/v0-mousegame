import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArcadeResultModal } from '../ArcadeResultModal'
import { translations } from '@/lib/i18n/translations'
import { getRank, getRankProgress } from '@/lib/arcadeManager'
import type { ArcadeResult } from '@/types/arcade'

/**
 * チャレンジの結果画面（v1.2 D4・D6・G3、docs/game-spec.md §5）。
 * 初見テスト: 「大きな赤い 0 と 0 が並ぶ表は成績表のようで冷たい」「次の目標が無い」「れんしゅうの存在が見えない」
 */
describe('チャレンジの結果画面', () => {
  const t = translations.ja
  const result = (overrides: Partial<ArcadeResult> = {}): ArcadeResult => ({
    score: 0,
    best: 0,
    isNewBest: false,
    maxCombo: 0,
    feverCount: 0,
    rank: getRank(0),
    weakOperation: null,
    endReason: 'timeUp',
    ...overrides,
  })
  const renderModal = (r: ArcadeResult, onPracticeWeak = jest.fn()) =>
    render(
      <ArcadeResultModal
        open
        result={r}
        rankProgress={getRankProgress(r.best)}
        language="ja"
        onRetry={jest.fn()}
        onClose={jest.fn()}
        onPracticeWeak={onPracticeWeak}
        t={t}
      />
    )

  it('終わった理由「じかんぎれ！」を出す', () => {
    renderModal(result({ score: 300, best: 300 }))
    expect(screen.getByTestId('arcade-end-reason')).toHaveTextContent('じかんぎれ！')
  })

  it('次の目標を出す（0点なら「まずは 1こ とろう」。100 点は遠いと初見テストで分かり決め直した）', () => {
    renderModal(result())
    expect(screen.getByTestId('arcade-next-target')).toHaveTextContent('まずは 1こ とろう')
  })

  it('0点は目立たせない（大きな赤で出さない）', () => {
    renderModal(result())
    expect(screen.getByTestId('arcade-result-score')).toHaveAttribute('data-emphasis', 'low')
  })

  it('点が取れたときは目立たせる', () => {
    renderModal(result({ score: 500, best: 500 }))
    expect(screen.getByTestId('arcade-result-score')).toHaveAttribute('data-emphasis', 'high')
  })

  it('ミスがいちばん多かった操作を「にがてな そうさ」として出し、れんしゅうに進める', async () => {
    const onPracticeWeak = jest.fn()
    renderModal(result({ score: 500, best: 500, weakOperation: 'doubleClick' }), onPracticeWeak)

    const weak = screen.getByTestId('arcade-weak-operation')
    expect(weak).toHaveTextContent('にがてな そうさ')
    expect(weak).toHaveTextContent('ブルーベリー')
    expect(weak).toHaveTextContent('ダブルクリック')
    await userEvent.setup().click(screen.getByRole('button', { name: 'れんしゅうで ためす' }))
    expect(onPracticeWeak).toHaveBeenCalledTimes(1)
  })

  it('ミスが無ければ「にがてな そうさ」は出さない', () => {
    renderModal(result({ score: 500, best: 500, weakOperation: null }))
    expect(screen.queryByTestId('arcade-weak-operation')).not.toBeInTheDocument()
  })
})
