'use client'

import React from 'react'
import type { DailyGoal } from '@/types/gamification'

const OPERATIONS = [
  { key: 'click' as const, icon: '🖱️', name: 'クリック' },
  { key: 'doubleClick' as const, icon: '⚡', name: 'ダブルクリック' },
  { key: 'rightClick' as const, icon: '🎯', name: '右クリック' },
  { key: 'drop' as const, icon: '🧲', name: 'ドラッグ' },
]

export interface DailyPracticeCardProps {
  todayGoals: DailyGoal
  isGoalComplete: boolean
  practiceStreak: number
}

export function DailyPracticeCard({ todayGoals, isGoalComplete, practiceStreak }: DailyPracticeCardProps): React.ReactElement {
  return (
    <div data-testid="daily-practice-card" className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">きょうのれんしゅう</h3>
        <div data-testid="daily-practice-streak" className="text-sm font-semibold text-blue-600" aria-label="連続日数">
          {practiceStreak}日れんぞく
        </div>
      </div>
      <div data-testid="daily-practice-complete" className={`text-center mb-2 font-bold ${isGoalComplete ? 'text-green-600' : 'text-gray-400'}`}>
        {isGoalComplete ? 'クリア！' : 'がんばろう！'}
      </div>
      <ul className="space-y-2">
        {OPERATIONS.map(({ key, icon, name }) => (
          <li
            key={key}
            data-testid={`daily-goal-${key}`}
            data-done={todayGoals[key]}
            className={`flex items-center gap-2 p-2 rounded ${todayGoals[key] ? 'bg-green-100' : 'bg-white'}`}
          >
            <span aria-hidden>{icon}</span>
            <span>{name}</span>
            <span className="ml-auto">{todayGoals[key] ? '✅' : '⬜'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
