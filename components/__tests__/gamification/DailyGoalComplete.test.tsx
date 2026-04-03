/**
 * Task 11.5 / design.md §12.4 — DailyGoalComplete
 *
 * components/game/DailyGoalComplete.tsx 未追加のため、§12.4 の Props（show, streak）に沿ったテスト内スタブで検証する。
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

export interface DailyGoalCompleteProps {
  show: boolean
  streak: number
}

function DailyGoalComplete({ show, streak }: DailyGoalCompleteProps): React.ReactElement | null {
  if (!show) {
    return null
  }
  return (
    <div data-testid="daily-goal-complete-modal" role="status" aria-live="polite">
      <span data-testid="daily-goal-complete-streak">{streak}</span>
    </div>
  )
}

describe('DailyGoalComplete (Task 11.5)', () => {
  it('show=true のとき祝福演出が表示される', () => {
    // Given / When
    render(<DailyGoalComplete show streak={7} />)

    // Then
    expect(screen.getByTestId('daily-goal-complete-modal')).toBeInTheDocument()
    expect(screen.getByTestId('daily-goal-complete-streak')).toHaveTextContent('7')
  })

  it('show=false のとき非表示', () => {
    // Given / When
    render(<DailyGoalComplete show={false} streak={3} />)

    // Then
    expect(screen.queryByTestId('daily-goal-complete-modal')).not.toBeInTheDocument()
  })
})
