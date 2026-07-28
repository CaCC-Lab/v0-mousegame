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
  /** 連続成功（ゲーミフィケーション） */
  streak?: number
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

/**
 * スコア・時間などのHUD。
 *
 * プレイエリアを最大化するため、大きなバーではなく
 * 1行に収まるコンパクトなチップの並びとして表示する。
 * 自前の背景は持たず、親（HUDバー）の上に載る。
 */

function ScoreSection({ score, combo, t }: Pick<ScoreBarProps, 'score' | 'combo' | 't'>): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-[var(--radius-md)]">
      <span className="text-lg" aria-hidden>&#11088;</span>
      <span className="text-xs font-semibold text-white/80">{t.score}</span>
      <span className="text-display text-xl font-bold text-white drop-shadow">
        {score.toLocaleString()}
      </span>
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
  )
}

function StageSection({ stage, t }: Pick<ScoreBarProps, 'stage' | 't'>): React.ReactElement | null {
  if (!stage?.isHydrated || !stage?.currentStageInfo || stage?.currentStage <= 0) {
    return null
  }

  return (
    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-[var(--radius-md)] text-white">
      <Zap className="w-4 h-4 text-yellow-300" aria-hidden />
      <span className="text-sm font-semibold whitespace-nowrap">
        {t.stage} {stage.currentStage}
      </span>
      <span className="hidden md:inline text-xs opacity-90 whitespace-nowrap">
        {stage.currentStageInfo.name}
      </span>
    </div>
  )
}

function TimerSection({ timeLeft, gameState, t }: Pick<ScoreBarProps, 'timeLeft' | 'gameState' | 't'>): React.ReactElement {
  const isLowTime = timeLeft < 10 && gameState === 'playing'

  return (
    <motion.div
      className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-[var(--radius-md)]"
      animate={{ scale: isLowTime ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.5, repeat: isLowTime ? Infinity : 0 }}
    >
      <Timer className="w-4 h-4 text-white" aria-hidden />
      <span className="text-display text-lg font-bold text-white">
        {t.timeFormat(Math.floor(timeLeft / 60), timeLeft % 60)}
      </span>
    </motion.div>
  )
}

function HighScoreSection({ highScore, t }: Pick<ScoreBarProps, 'highScore' | 't'>): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5 text-white bg-white/10 px-2.5 py-1 rounded-[var(--radius-md)]">
      <span className="text-xs opacity-80 whitespace-nowrap">{t.highScore}</span>
      <span className="text-display text-lg font-bold">{highScore.toLocaleString()}</span>
    </div>
  )
}

export function ScoreBar({
  score,
  highScore,
  timeLeft,
  streak,
  gameState,
  combo,
  stage,
  t
}: ScoreBarProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
      <ScoreSection score={score} combo={combo} t={t} />
      {typeof streak === 'number' && (
        <div data-testid="scorebar-streak" className="text-white text-xs font-semibold whitespace-nowrap">
          連続成功: {streak}
        </div>
      )}
      <StageSection stage={stage} t={t} />
      <TimerSection timeLeft={timeLeft} gameState={gameState} t={t} />
      <HighScoreSection highScore={highScore} t={t} />
    </div>
  )
}
