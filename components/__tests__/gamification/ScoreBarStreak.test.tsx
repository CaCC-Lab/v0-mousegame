/**
 * AC-4.5: 連続成功のUI（ScoreBar）
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ScoreBar } from '@/components/game/ScoreBar'
import { translations } from '@/lib/i18n/translations'

// 実際の翻訳辞書を使う（部分的な差し替えだと文言の欠落に気づけない）
const t = translations.ja

describe('ScoreBar streak', () => {
  it('streak が渡されると表示される', () => {
    render(
      <ScoreBar
        score={10}
        highScore={20}
        timeLeft={60}
        streak={7}
        gameState="playing"
        combo={{ multiplier: 1 }}
        stage={null}
        t={t}
      />
    )
    expect(screen.getByTestId('scorebar-streak')).toHaveTextContent('7')
  })

  it('streak 未指定なら表示されない', () => {
    render(
      <ScoreBar
        score={10}
        highScore={20}
        timeLeft={60}
        gameState="playing"
        combo={{ multiplier: 1 }}
        stage={null}
        t={t}
      />
    )
    expect(screen.queryByTestId('scorebar-streak')).not.toBeInTheDocument()
  })
})
