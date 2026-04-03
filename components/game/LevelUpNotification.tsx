'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MasteryLevel } from '@/types/gamification'
import { MASTERY_THRESHOLDS } from '@/types/gamification'
import type { InteractionType } from '@/types/game'

const OPERATION_NAMES: Record<InteractionType, string> = {
  click: 'クリック',
  doubleClick: 'ダブルクリック',
  rightClick: '右クリック',
  drop: 'ドラッグ',
}

export interface LevelUpNotificationProps {
  operationType: InteractionType
  newLevel: MasteryLevel
  show: boolean
}

export function LevelUpNotification({ operationType, newLevel, show }: LevelUpNotificationProps): React.ReactElement {
  const label = MASTERY_THRESHOLDS.find(t => t.level === newLevel)?.label ?? ''

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
            レベルアップ！
          </div>
          <div className="text-center mt-1">
            <span data-testid="level-up-operation">{OPERATION_NAMES[operationType]}</span>
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
