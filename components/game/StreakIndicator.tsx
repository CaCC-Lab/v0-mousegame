'use client'

import React from 'react'
import { StreakBonus } from '@/types/gamification'

export interface StreakIndicatorProps {
  streak: number
  lastBonus: StreakBonus | null
}

export function StreakIndicator({ streak, lastBonus }: StreakIndicatorProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <div
        data-testid="streak-count"
        aria-live="polite"
        className="rounded bg-white/20 px-3 py-1 text-white"
      >
        連続: {streak}
      </div>
      {lastBonus?.type === 'smile' && (
        <div data-testid="streak-bonus-smile" className="text-4xl" aria-hidden>
          {lastBonus.label}
        </div>
      )}
      {lastBonus?.type === 'bonusFruit' && (
        <div data-testid="streak-bonus-fruit" className="text-4xl" aria-hidden>
          {lastBonus.label}
        </div>
      )}
      {lastBonus?.type === 'amazing' && (
        <div data-testid="streak-bonus-amazing" className="text-xl font-bold text-yellow-200">
          {lastBonus.label}
        </div>
      )}
    </div>
  )
}
