/**
 * Task 11.4 / design.md §12.4 — DailyPracticeCard
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { DailyPracticeCard } from '@/components/game/DailyPracticeCard'
import type { DailyGoal } from '@/types/gamification'

describe('DailyPracticeCard (Task 11.4)', () => {
  const goals: DailyGoal = {
    click: true,
    doubleClick: false,
    rightClick: true,
    drop: false,
  }

  it('4操作の目標チェックと連続日数が表示される', () => {
    // Given / When
    render(<DailyPracticeCard todayGoals={goals} isGoalComplete={false} practiceStreak={5} />)

    // Then
    expect(screen.getByTestId('daily-practice-card')).toBeInTheDocument()
    expect(screen.getByTestId('daily-practice-streak')).toHaveTextContent('5')
    expect(screen.getByTestId('daily-goal-click')).toHaveAttribute('data-done', 'true')
    expect(screen.getByTestId('daily-goal-doubleClick')).toHaveAttribute('data-done', 'false')
  })
})
