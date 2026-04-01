/**
 * AC-2.1, AC-2.3, AC-2.4
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BadgeDisplay } from '@/components/game/BadgeDisplay'
import { createDefaultGamificationData } from '@/lib/gamificationManager'

describe('BadgeDisplay', () => {
  it('AC-2.3: 4種類のバッジ行が表示される', () => {
    const cum = createDefaultGamificationData().cumulativeStats
    render(<BadgeDisplay earnedBadges={[]} cumulativeStats={cum} />)
    expect(screen.getByTestId('badge-row-clickMaster')).toBeInTheDocument()
    expect(screen.getByTestId('badge-row-doubleClickExpert')).toBeInTheDocument()
    expect(screen.getByTestId('badge-row-rightClickPro')).toBeInTheDocument()
    expect(screen.getByTestId('badge-row-dragDoctor')).toBeInTheDocument()
  })

  it('AC-2.4: 進捗 current/target が表示される', () => {
    const cum = createDefaultGamificationData().cumulativeStats
    cum.click.totalSuccess = 10
    render(<BadgeDisplay earnedBadges={[]} cumulativeStats={cum} />)
    expect(screen.getByTestId('badge-progress-clickMaster')).toHaveTextContent('10 / 30')
  })

  it('獲得済みバッジが表示される', () => {
    const cum = createDefaultGamificationData().cumulativeStats
    render(<BadgeDisplay earnedBadges={['clickMaster']} cumulativeStats={cum} />)
    expect(screen.getByTestId('badge-earned-clickMaster')).toHaveTextContent('獲得済み')
  })

  it('空配列の earnedBadges でも落ちない', () => {
    const cum = createDefaultGamificationData().cumulativeStats
    render(<BadgeDisplay earnedBadges={[]} cumulativeStats={cum} />)
    expect(screen.getByTestId('badge-display')).toBeInTheDocument()
  })
})
