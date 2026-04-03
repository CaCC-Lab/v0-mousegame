/**
 * Task 11.4 / design.md §12.4 — DailyPracticeCard
 *
 * components/game/DailyPracticeCard.tsx 未追加のため、§12.4 の Props 契約に沿ったテスト内スタブで検証する。
 * 本番追加後は @/components/game/DailyPracticeCard を import し testid を揃えること。
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

type DailyGoal = {
  click: boolean
  doubleClick: boolean
  rightClick: boolean
  drop: boolean
}

export interface DailyPracticeCardProps {
  todayGoals: DailyGoal
  isGoalComplete: boolean
  practiceStreak: number
}

function DailyPracticeCard({
  todayGoals,
  isGoalComplete,
  practiceStreak,
}: DailyPracticeCardProps): React.ReactElement {
  const ops = ['click', 'doubleClick', 'rightClick', 'drop'] as const
  return (
    <div data-testid="daily-practice-card">
      <div data-testid="daily-practice-streak" aria-label="連続日数">
        {practiceStreak}
      </div>
      <div data-testid="daily-practice-complete">{isGoalComplete ? 'complete' : 'incomplete'}</div>
      <ul>
        {ops.map(op => (
          <li key={op} data-testid={`daily-goal-${op}`} data-done={todayGoals[op]}>
            {op}
          </li>
        ))}
      </ul>
    </div>
  )
}

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
