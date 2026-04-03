'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface DailyGoalCompleteProps {
  show: boolean
  streak: number
}

export function DailyGoalComplete({ show, streak }: DailyGoalCompleteProps): React.ReactElement {
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
          <div className="text-lg font-bold">きょうのれんしゅうクリア！</div>
          <div className="mt-1">
            <span data-testid="daily-goal-complete-streak" className="text-blue-600 font-bold">{streak}</span>
            日れんぞく
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
