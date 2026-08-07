'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MasteryLevel } from '@/types/gamification'
import type { InteractionType } from '@/types/game'
import { translations } from '@/lib/i18n/translations'

export interface LevelUpNotificationProps {
  operationType: InteractionType
  newLevel: MasteryLevel
  show: boolean
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

export function LevelUpNotification({ operationType, newLevel, show, t = translations.ja }: LevelUpNotificationProps): React.ReactElement {
  const g = t.gamification
  const label = g.masteryLevels[newLevel] ?? ''

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="level-up"
          data-testid="level-up-notification"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-green-100 px-6 py-4 shadow-lg"
        >
          <div className="text-lg font-bold text-center">
            {g.levelUpTitle}
          </div>
          <div className="text-center mt-1">
            <span data-testid="level-up-operation">{g.operations[operationType]}</span>
            {' → '}
            <span data-testid="level-up-new-level" className="text-green-600 font-bold">Lv.{newLevel}</span>
            {' '}
            <span className="text-sm text-gray-500">{label}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
