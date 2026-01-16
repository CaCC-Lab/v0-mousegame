"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Timer, Zap } from 'lucide-react'
import { GameState } from '@/types/game'
import { Stage } from '@/types/stage'

interface ScoreBarProps {
  score: number
  highScore: number
  timeLeft: number
  gameState: GameState
  combo: { multiplier: number }
  stage: {
    isHydrated: boolean
    currentStage: number
    currentStageInfo: Stage | null
  } | null
  t: {
    score: string
    highScore: string
    combo: string
    stage: string
    timeFormat: (minutes: number, seconds: number) => string
  }
}

function ScoreSection({ score, combo, t }: Pick<ScoreBarProps, 'score' | 'combo' | 't'>): React.ReactElement {
  return (
    <motion.div
      className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-[var(--radius-md)]"
      whileHover={{ scale: 1.05 }}
    >
      <span className="text-3xl">&#11088;</span>
      <div>
        <div className="text-sm font-semibold text-white/80">{t.score}</div>
        <div className="text-display text-3xl font-bold text-white drop-shadow">
          {score.toLocaleString()}
        </div>
        {combo.multiplier > 1 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-purple)]"
          >
            x{combo.multiplier} {t.combo}!
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}

function StageSection({ stage, t }: Pick<ScoreBarProps, 'stage' | 't'>): React.ReactElement | null {
  if (!stage?.isHydrated || !stage?.currentStageInfo || stage?.currentStage <= 0) {
    return null
  }

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-[var(--radius-md)]"
    >
      <Zap className="w-5 h-5 text-yellow-300" />
      <div className="text-white">
        <div className="text-sm font-semibold">{t.stage} {stage.currentStage}</div>
        <div className="text-xs opacity-90">{stage.currentStageInfo.name}</div>
      </div>
    </motion.div>
  )
}

function TimerSection({ timeLeft, gameState, t }: Pick<ScoreBarProps, 'timeLeft' | 'gameState' | 't'>): React.ReactElement {
  const isLowTime = timeLeft < 10 && gameState === 'playing'

  return (
    <motion.div
      className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-[var(--radius-md)]"
      animate={{ scale: isLowTime ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.5, repeat: isLowTime ? Infinity : 0 }}
    >
      <Timer className="w-6 h-6 text-white" />
      <div className="text-display text-2xl font-bold text-white">
        {t.timeFormat(Math.floor(timeLeft / 60), timeLeft % 60)}
      </div>
    </motion.div>
  )
}

function HighScoreSection({ highScore, t }: Pick<ScoreBarProps, 'highScore' | 't'>): React.ReactElement {
  return (
    <motion.div
      className="text-white bg-white/10 px-4 py-2 rounded-[var(--radius-md)]"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-xs opacity-80">{t.highScore}</div>
      <div className="text-display text-xl font-bold">{highScore.toLocaleString()}</div>
    </motion.div>
  )
}

export function ScoreBar({
  score,
  highScore,
  timeLeft,
  gameState,
  combo,
  stage,
  t
}: ScoreBarProps): React.ReactElement {
  return (
    <div className="bg-gradient-ocean p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <ScoreSection score={score} combo={combo} t={t} />
        <StageSection stage={stage} t={t} />
        <TimerSection timeLeft={timeLeft} gameState={gameState} t={t} />
        <HighScoreSection highScore={highScore} t={t} />
      </div>
    </div>
  )
}
