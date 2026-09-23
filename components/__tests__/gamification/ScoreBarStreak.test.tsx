/**
 * コンボの表示は1か所にする（v1.1 計画 G2・D4、docs/game-spec.md §8）。
 *
 * 以前は ScoreBar に「連続成功: N」と、得点に効かない見た目だけのコンボ倍率（x1.5 コンボ!）が出ていて、
 * プレイエリアの「連続: N」やアーケードの「N コンボ xM」と同じ瞬間に別の数字を出していた。
 * ScoreBar は得点・ステージ・時間・ベストだけを出す。
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ScoreBar } from '@/components/game/ScoreBar'
import { translations } from '@/lib/i18n/translations'

// 実際の翻訳辞書を使う（部分的な差し替えだと文言の欠落に気づけない）
const t = translations.ja

describe('ScoreBar はコンボを出さない', () => {
  it('得点・時間・ベストを出し、コンボや倍率は出さない', () => {
    render(<ScoreBar score={10} highScore={20} timeLeft={60} gameState="playing" stage={null} t={t} />)

    expect(screen.getByTestId('score-value')).toHaveTextContent('10')
    expect(screen.getByText('ベスト:')).toBeInTheDocument()
    expect(screen.queryByTestId('scorebar-streak')).not.toBeInTheDocument()
    expect(screen.queryByText(/コンボ/)).not.toBeInTheDocument()
    expect(screen.queryByText(/x\d/)).not.toBeInTheDocument()
  })
})
