"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Fruit as FruitType, HarvestedFruits } from '@/types/game'
import { FruitSprite } from './FruitSprite'
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

/**
 * ステージ目標と収穫数の表示。
 *
 * プレイエリアの上に重ねるオーバーレイとして描画する。
 * - 親側で pointer-events-none を付けて重ねる前提（下のフルーツをクリックできる）
 * - 邪魔にならないよう、半透明の小さなチップ1行に収める
 */

function StageGoals({ score, harvestedFruits, stage, t }: HarvestedFruitsDisplayProps): React.ReactElement | null {
  if (!stage?.isHydrated || !stage?.currentStageInfo) {
    return null
  }

  const totalFruitsCollected = Object.values(harvestedFruits).reduce((sum, count) => sum + count, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-[var(--radius-full)] text-xs font-bold whitespace-nowrap"
    >
      <span>{t.stageGoals}</span>
      <span>
        {t.scoreText} {score} / {stage.currentStageInfo.targetScore}
      </span>
      {stage.currentStageInfo.targetFruits?.total && (
        <span>
          {t.fruitsText} {totalFruitsCollected} / {stage.currentStageInfo.targetFruits.total}
        </span>
      )}
    </motion.div>
  )
}

function FruitCounter({ fruit, count, index }: { fruit: string; count: number; index: number }): React.ReactElement {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', bounce: 0.5 }}
      className="flex items-center gap-1 bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded-[var(--radius-full)] shadow-sm"
    >
      <FruitSprite type={fruit as FruitType['type']} size={18} />
      <span className="text-display text-sm font-bold" style={{ color: 'var(--color-purple)' }}>
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
    <div
      data-testid="collection-fruit-counters"
      className="flex flex-wrap items-center justify-center gap-1.5 px-2"
    >
      <StageGoals score={score} harvestedFruits={harvestedFruits} stage={stage} t={t} />
      {Object.entries(harvestedFruits).map(([fruit, count], index) => (
        <FruitCounter key={fruit} fruit={fruit} count={count} index={index} />
      ))}
    </div>
  )
}
