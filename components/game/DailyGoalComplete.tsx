'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { translations } from '@/lib/i18n/translations'

export interface DailyGoalCompleteProps {
  show: boolean
  streak: number
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function DailyGoalComplete({ show, streak, t = translations.ja }: DailyGoalCompleteProps): React.ReactElement {
  const g = t.gamification
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="daily-goal-complete"
          data-testid="daily-goal-complete-modal"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-blue-100 px-6 py-4 shadow-lg text-center"
        >
          <div className="text-lg font-bold">{g.dailyGoalCompleteTitle}</div>
          <div className="mt-1">
            <span data-testid="daily-goal-complete-streak" className="text-blue-600 font-bold">{streak}</span>
            {g.daysStreakUnit}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
