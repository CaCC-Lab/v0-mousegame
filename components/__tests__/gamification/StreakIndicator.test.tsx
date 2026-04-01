/**
 * AC-4.1, AC-4.2, AC-4.3, AC-4.5（表示）
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { StreakIndicator } from '@/components/game/StreakIndicator'
import { STREAK_BONUSES } from '@/types/gamification'

describe('StreakIndicator', () => {
  it('AC-4.5: 連続数が表示される', () => {
    render(<StreakIndicator streak={4} lastBonus={null} />)
    expect(screen.getByTestId('streak-count')).toHaveTextContent('4')
  })

  it('AC-4.1: スマイルボーナス', () => {
    const b = STREAK_BONUSES.find(x => x.type === 'smile')!
    render(<StreakIndicator streak={3} lastBonus={b} />)
    expect(screen.getByTestId('streak-bonus-smile')).toBeInTheDocument()
  })

  it('AC-4.2: ボーナスフルーツ', () => {
    const b = STREAK_BONUSES.find(x => x.type === 'bonusFruit')!
    render(<StreakIndicator streak={5} lastBonus={b} />)
    expect(screen.getByTestId('streak-bonus-fruit')).toBeInTheDocument()
  })

  it('AC-4.3: すごい演出', () => {
    const b = STREAK_BONUSES.find(x => x.type === 'amazing')!
    render(<StreakIndicator streak={10} lastBonus={b} />)
    expect(screen.getByTestId('streak-bonus-amazing')).toHaveTextContent(/すごい/)
  })

  it('lastBonus=null のとき追加演出は出ない', () => {
    render(<StreakIndicator streak={10} lastBonus={null} />)
    expect(screen.queryByTestId('streak-bonus-amazing')).not.toBeInTheDocument()
  })
})
