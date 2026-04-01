'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BadgeDefinition } from '@/types/gamification'

export interface BadgeNotificationProps {
  badge: BadgeDefinition | null
  show: boolean
}

export function BadgeNotification({ badge, show }: BadgeNotificationProps): React.ReactElement {
  return (
    <AnimatePresence>
      {show && badge && (
        <motion.div
          role="status"
          aria-live="polite"
          data-testid="badge-notification"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-yellow-100 px-6 py-4 shadow-lg"
        >
          <div className="text-lg font-bold" data-testid="badge-notification-title">
            おめでとう！ {badge.icon} {badge.name}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
