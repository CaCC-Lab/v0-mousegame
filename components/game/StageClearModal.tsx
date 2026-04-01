"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { StarRating } from '@/types/gamification'

interface StageClearModalProps {
  show: boolean
  currentStage: number
  /** クリア時の星評価（0のときは非表示扱い） */
  starRating?: StarRating
  onNextStage: () => void
  onClose: () => void
  t: {
    stageClear: string
    stage: string
    stageCleared: string
    nextStage: string
    close: string
  }
}

const MODAL_ANIMATION = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  content: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    exit: { scale: 0, rotate: 180 },
    transition: { type: "spring", duration: 0.6, bounce: 0.5 }
  }
}

export function StageClearModal({
  show,
  currentStage,
  starRating = 0,
  onNextStage,
  onClose,
  t
}: StageClearModalProps): React.ReactElement {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/30 backdrop-blur-sm"
          initial={MODAL_ANIMATION.overlay.initial}
          animate={MODAL_ANIMATION.overlay.animate}
          exit={MODAL_ANIMATION.overlay.exit}
        >
          <motion.div
            initial={MODAL_ANIMATION.content.initial}
            animate={MODAL_ANIMATION.content.animate}
            exit={MODAL_ANIMATION.content.exit}
            transition={MODAL_ANIMATION.content.transition}
            className="pointer-events-auto px-8 py-6 rounded-[var(--radius-xl)] shadow-xl"
            style={{ background: 'var(--gradient-playful)' }}
          >
            <h2 className="text-display text-4xl font-bold mb-3 text-white drop-shadow-lg text-center">
              &#127881; {t.stageClear} &#127881;
            </h2>
            <p className="text-xl text-center text-white mb-4">
              {t.stage} {currentStage} {t.stageCleared}
            </p>
            {starRating > 0 && (
              <p
                data-testid="stage-clear-star-rating"
                className="text-center text-3xl text-yellow-200 mb-4"
                aria-label={`star rating ${starRating}`}
              >
                {'★'.repeat(starRating)}
              </p>
            )}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={onNextStage}
                className="px-6 py-3 rounded-[var(--radius-full)] font-bold shadow-lg hover-lift"
                style={{ backgroundColor: 'var(--color-secondary)', color: 'white' }}
              >
                {t.nextStage}
              </Button>
              <Button
                onClick={onClose}
                className="px-6 py-3 rounded-[var(--radius-full)] font-bold shadow-lg hover-lift"
                style={{ backgroundColor: 'white', color: 'var(--color-purple)' }}
              >
                {t.close}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
