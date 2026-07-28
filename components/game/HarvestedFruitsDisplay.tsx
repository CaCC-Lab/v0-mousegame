"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Fruit as FruitType, HarvestedFruits, FRUIT_EMOJI } from '@/types/game'
import { Stage } from '@/types/stage'

interface HarvestedFruitsDisplayProps {
  harvestedFruits: HarvestedFruits
  score: number
  stage: {
    isHydrated: boolean
    currentStageInfo: Stage | null
  } | null
  t: {
    stageGoals: string
    scoreText: string
    fruitsText: string
  }
}

function StageGoals({ score, harvestedFruits, stage, t }: HarvestedFruitsDisplayProps): React.ReactElement | null {
  if (!stage?.isHydrated || !stage?.currentStageInfo) {
    return null
  }

  const totalFruitsCollected = Object.values(harvestedFruits).reduce((sum, count) => sum + count, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-2 text-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-[var(--radius-md)]"
    >
      <div className="text-sm font-bold text-white mb-2">{t.stageGoals}</div>
      <div className="flex justify-center gap-6 flex-wrap">
        <span className="text-white font-semibold">
          {t.scoreText} {score} / {stage.currentStageInfo.targetScore}
        </span>
        {stage.currentStageInfo.targetFruits?.total && (
          <span className="text-white font-semibold">
            {t.fruitsText} {totalFruitsCollected} / {stage.currentStageInfo.targetFruits.total}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function FruitCounter({ fruit, count, index }: { fruit: string; count: number; index: number }): React.ReactElement {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', bounce: 0.6 }}
      className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-[var(--radius-full)] shadow-md hover-lift"
      whileHover={{ scale: 1.1 }}
    >
      <span className="text-3xl">{FRUIT_EMOJI[fruit as FruitType['type']]}</span>
      <span className="text-display text-2xl font-bold" style={{ color: 'var(--color-purple)' }}>
        {count}
      </span>
    </motion.div>
  )
}

export function HarvestedFruitsDisplay({
  harvestedFruits,
  score,
  stage,
  t
}: HarvestedFruitsDisplayProps): React.ReactElement {
  return (
    <div className="p-3 md:p-4 shrink-0" style={{ background: 'var(--gradient-sunset)' }}>
      <StageGoals score={score} harvestedFruits={harvestedFruits} stage={stage} t={t} />

      <div className="flex justify-around items-center flex-wrap gap-2">
        {Object.entries(harvestedFruits).map(([fruit, count], index) => (
          <FruitCounter key={fruit} fruit={fruit} count={count} index={index} />
        ))}
      </div>
    </div>
  )
}
