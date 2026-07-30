'use client'

import React from 'react'
import type { DailyGoal } from '@/types/gamification'
import { OPERATION_LABELS } from '@/types/gamification'

export interface DailyPracticeCardProps {
  todayGoals: DailyGoal
  isGoalComplete: boolean
  practiceStreak: number
}

export function DailyPracticeCard({ todayGoals, isGoalComplete, practiceStreak }: DailyPracticeCardProps): React.ReactElement {
  return (
    <div data-testid="daily-practice-card" className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3">
        {/* h1（ゲームタイトル）の次の見出しなので h2。h3 にすると見出し階層が飛ぶ */}
        <h2 className="text-lg font-bold">きょうのれんしゅう</h2>
        <div data-testid="daily-practice-streak" className="text-sm font-semibold text-blue-600" aria-label="連続日数">
          {practiceStreak}日れんぞく
        </div>
      </div>
      {/* text-gray-400 は白背景でコントラスト比が不足するため gray-600 を使う */}
      <div data-testid="daily-practice-complete" className={`text-center mb-2 font-bold ${isGoalComplete ? 'text-green-600' : 'text-gray-600'}`}>
        {isGoalComplete ? 'クリア！' : 'がんばろう！'}
      </div>
      <ul className="space-y-2">
        {OPERATION_LABELS.map(({ key, icon, name }) => (
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
