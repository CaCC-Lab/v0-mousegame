'use client'

import React from 'react'
import { StreakBonus } from '@/types/gamification'
import { translations } from '@/lib/i18n/translations'

export interface StreakIndicatorProps {
  streak: number
  lastBonus: StreakBonus | null
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function StreakIndicator({ streak, lastBonus, t = translations.ja }: StreakIndicatorProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <div
        data-testid="streak-count"
        aria-live="polite"
        className="rounded bg-white/20 px-3 py-1 text-white"
      >
        {t.gamification.streak}: {streak}
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
        // smile / bonusFruit の label は絵文字なのでそのまま出せるが、
        // amazing だけは文言なので辞書から引く
        <div data-testid="streak-bonus-amazing" className="text-xl font-bold text-yellow-200">
          {t.gamification.amazingBonus}
        </div>
      )}
    </div>
  )
}
