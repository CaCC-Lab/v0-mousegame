'use client'

import React, { useEffect, useRef, useState } from 'react'
import { StreakBonus } from '@/types/gamification'
import { translations } from '@/lib/i18n/translations'

export interface StreakIndicatorProps {
  streak: number
  lastBonus: StreakBonus | null
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function StreakIndicator({ streak, lastBonus, t = translations.ja }: StreakIndicatorProps): React.ReactElement {
  // 積み上げていたものが0に戻った瞬間だけ、はっきり伝える。
  // 薄い枠のままだと「ミスって0になったのに気づくのが遅れた」と言われた
  const [isBroken, setIsBroken] = useState(false)
  const previousStreakRef = useRef(streak)

  useEffect(() => {
    const previous = previousStreakRef.current
    previousStreakRef.current = streak

    if (streak === 0 && previous > 0) {
      setIsBroken(true)
      const timer = setTimeout(() => setIsBroken(false), 1200)
      return () => clearTimeout(timer)
    }

    if (streak > 0) setIsBroken(false)
  }, [streak])

  return (
    <div className="flex flex-col gap-2">
      <div
        data-testid="streak-count"
        data-broken={isBroken ? 'true' : undefined}
        aria-live="polite"
        className={`rounded px-3 py-1 text-white transition-colors ${
          isBroken ? 'bg-red-500/90 font-bold ring-2 ring-white animate-pulse' : 'bg-white/20'
        }`}
      >
        {t.gamification.streak}: {streak}
      </div>

      {isBroken && (
        <div
          data-testid="streak-broken"
          role="status"
          aria-live="assertive"
          className="rounded bg-red-500/90 px-2 py-0.5 text-center text-xs font-bold text-white shadow"
        >
          {t.gamification.streakBroken}
        </div>
      )}
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
