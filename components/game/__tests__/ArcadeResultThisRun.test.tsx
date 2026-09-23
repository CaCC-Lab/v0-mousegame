import React from 'react'
import { render, screen } from '@testing-library/react'
import { ArcadeResultModal } from '../ArcadeResultModal'
import { translations } from '@/lib/i18n/translations'
import { getRank, getRankProgress } from '@/lib/arcadeManager'
import type { ArcadeResult } from '@/types/arcade'

/**
 * アーケードの結果（v1.1 計画 G8・D1・D2、docs/game-spec.md §5）。
 *
 * - D1: 0点ではランクを出さず、次にやることを出す（初見テスト「何もしなくてもブロンズなら段位の意味がない」「冷たい」）
 * - D2: 段位と「あと N てん」は今回のスコアから出す（大きく出ている今回のスコアと別の数から出ると矛盾に見える）。
 *   ベストは別の欄に残す
 */
describe('ArcadeResultModal: 今回の結果', () => {
  const t = translations.ja
  const baseResult = (score: number, best: number): ArcadeResult => ({
    score,
    best,
    isNewBest: false,
    maxCombo: 0,
    feverCount: 0,
    rank: getRank(best),
  })
  const renderResult = (score: number, best: number) =>
    render(
      <ArcadeResultModal
        open
        result={baseResult(score, best)}
        rankProgress={getRankProgress(best)}
        language="ja"
        onRetry={jest.fn()}
        onClose={jest.fn()}
        t={t}
      />
    )

  it('0点のときはランクを出さず、「まずは 🍎 をクリックしてみよう」を出す', () => {
    renderResult(0, 0)

    expect(screen.queryByTestId('arcade-result-rank')).not.toBeInTheDocument()
    expect(screen.queryByTestId('arcade-rank-progress')).not.toBeInTheDocument()
    expect(screen.getByTestId('arcade-zero-hint')).toHaveTextContent('まずは 🍎 をクリックしてみよう')
    expect(screen.getByRole('button', { name: /もういちど/ })).toBeInTheDocument()
  })

  it('段位と「あと N てん」は、ベストではなく今回のスコアから出す', () => {
    // 今回 1200 点（シルバー、ゴールドまで 1300）、ベスト 3000 点（ゴールド）
    renderResult(1200, 3000)

    expect(screen.getByTestId('arcade-result-rank')).toHaveTextContent('シルバー')
    const progress = getRankProgress(1200)
    expect(screen.getByTestId('arcade-rank-progress')).toHaveTextContent(`あと${progress.pointsToNext}てん`)
    // ベストは別の欄に残る
    expect(screen.getByTestId('arcade-result-best')).toHaveTextContent('3,000')
  })
})
