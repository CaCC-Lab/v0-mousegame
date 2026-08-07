'use client'

import React from 'react'
import type { DailyGoal } from '@/types/gamification'
import { OPERATION_LABELS } from '@/types/gamification'
import { translations } from '@/lib/i18n/translations'

export interface DailyPracticeCardProps {
  todayGoals: DailyGoal
  isGoalComplete: boolean
  practiceStreak: number
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function DailyPracticeCard({ todayGoals, isGoalComplete, practiceStreak, t = translations.ja }: DailyPracticeCardProps): React.ReactElement {
  const g = t.gamification
  return (
    <div data-testid="daily-practice-card" className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3">
        {/* h1（ゲームタイトル）の次の見出しなので h2。h3 にすると見出し階層が飛ぶ */}
        <h2 className="text-lg font-bold">{g.dailyPracticeTitle}</h2>
        <div data-testid="daily-practice-streak" className="text-sm font-semibold text-blue-600" aria-label={g.daysStreakLabel}>
          {practiceStreak}{g.daysStreakUnit}
        </div>
      </div>
      {/* text-gray-400 は白背景でコントラスト比が不足するため gray-600 を使う */}
      <div data-testid="daily-practice-complete" className={`text-center mb-2 font-bold ${isGoalComplete ? 'text-green-600' : 'text-gray-600'}`}>
        {isGoalComplete ? g.goalComplete : g.goalIncomplete}
      </div>
      <ul className="space-y-2">
        {OPERATION_LABELS.map(({ key, icon }) => (
          <li
            key={key}
            data-testid={`daily-goal-${key}`}
            data-done={todayGoals[key]}
            className={`flex items-center gap-2 p-2 rounded ${todayGoals[key] ? 'bg-green-100' : 'bg-white'}`}
          >
            <span aria-hidden>{icon}</span>
            <span>{g.operations[key]}</span>
            <span className="ml-auto">{todayGoals[key] ? '✅' : '⬜'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
