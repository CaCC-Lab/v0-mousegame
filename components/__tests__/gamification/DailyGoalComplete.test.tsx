/**
 * Task 11.5 / design.md §12.4 — DailyGoalComplete
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { DailyGoalComplete } from '@/components/game/DailyGoalComplete'

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
