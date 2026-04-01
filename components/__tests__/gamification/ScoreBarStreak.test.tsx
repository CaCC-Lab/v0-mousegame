/**
 * AC-4.5: 連続成功のUI（ScoreBar）
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ScoreBar } from '@/components/game/ScoreBar'

const t = {
  score: 'スコア',
  highScore: 'ハイスコア',
  combo: 'コンボ',
  stage: 'ステージ',
  timeFormat: (m: number, s: number) => `${m}:${s}`,
}

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
