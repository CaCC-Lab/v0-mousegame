"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useKeyboardControls } from '@/hooks/useKeyboardControls'
import { useLanguage } from '@/hooks/useLanguage'
import { useAnimation } from '@/hooks/useAnimation'
import { StageSelector } from './StageSelector'
import {
  ScoreBar,
  GameControls,
  HarvestedFruitsDisplay,
  HelpDialog,
  StageClearModal,
  GamePlayArea
} from './game'
import { ResultModal } from './game/ResultModal'
import { BadgeNotification } from './game/BadgeNotification'
import { BadgeDisplay } from './game/BadgeDisplay'
import { MasteryDisplay } from './game/MasteryDisplay'
import { LevelUpNotification } from './game/LevelUpNotification'
import { DailyPracticeCard } from './game/DailyPracticeCard'
import { DailyGoalComplete } from './game/DailyGoalComplete'
import { CollectionModal } from './game/CollectionModal'
import { Button } from './ui/button'
import { Fruit, InteractionType } from '@/types/game'
import type { InteractionType as IT } from '@/types/game'
import type { MasteryLevel } from '@/types/gamification'
import { useDailyPractice } from '@/hooks/useDailyPractice'

const GAME_CONTAINER_ANIMATION = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5, delay: 0.2 }
}

/**
 * Determines the correct interaction type for a fruit based on its type.
 */
function getInteractionTypeForFruit(fruitType: Fruit['type']): InteractionType {
  switch (fruitType) {
    case 'apple':
      return 'click'
    case 'blueberry':
      return 'doubleClick'
    case 'lemon':
      return 'rightClick'
    case 'watermelon':
      return 'click'
    default:
      return 'click'
  }
}

export function FruitHarvestGame(): React.ReactElement {
  const {
    gameState,
    score,
    highScore,
    timeLeft,
    fruits,
    harvestedFruits,
    isHardMode,
    setIsHardMode,
    startGame,
    pauseGame,
    resetGame,
    handleFruitInteraction,
    handlePowerUpClick,
    soundEffects,
    difficulty,
    powerUps,
    stage,
    operationStats,
    gamification,
    lastStarRating,
  } = useGameLogic()

  const { language, toggleLanguage, t } = useLanguage()
  const {
    particles,
    combo,
    triggerAnimation,
    onFruitCollected,
    reset: resetAnimations
  } = useAnimation()

  const dailyPractice = useDailyPractice()
  const [showDailyGoalComplete, setShowDailyGoalComplete] = useState(false)

  const [selectedFruitIndex, setSelectedFruitIndex] = useState<number>(-1)
  const [showStageSelector, setShowStageSelector] = useState(false)
  const [showCollection, setShowCollection] = useState(false)
  const [showStageClearMessage, setShowStageClearMessage] = useState(false)
  const [stageClearProcessed, setStageClearProcessed] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showBadgeNotification, setShowBadgeNotification] = useState(false)
  const [levelUpInfo, setLevelUpInfo] = useState<{ op: IT; level: MasteryLevel } | null>(null)
  const prevMasteryRef = useRef(gamification.masteryLevels)
  const levelUpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const handleHardModeChange = useCallback((checked: boolean) => {
    setIsHardMode(checked)
  }, [setIsHardMode])

  const handleStageSelect = useCallback((stageNumber: number) => {
    const selected = stage?.selectStage(stageNumber) ?? false
    if (selected) {
      setShowStageSelector(false)
      resetGame()
      resetAnimations()
    }
  }, [stage, resetGame, resetAnimations])

  const handleFruitClick = useCallback((fruit: Fruit, action: InteractionType) => {
    handleFruitInteraction(fruit, action)
    // AC-8.2: 収穫成功時にリアルタイムで目標更新
    dailyPractice.updateGoals(operationStats.getLatestSessionStats())
  // dailyPractice.updateGoals/operationStats.getLatestSessionStats は useCallback([]) で安定参照
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFruitInteraction])

  const handleKeyboardEnter = useCallback(() => {
    if (gameState === 'idle') {
      startGame()
      return
    }

    if (gameState === 'playing' && selectedFruitIndex >= 0 && selectedFruitIndex < fruits.length) {
      const selectedFruit = fruits[selectedFruitIndex]
      const interactionType = getInteractionTypeForFruit(selectedFruit.type)
      handleFruitClick(selectedFruit, interactionType)
      setSelectedFruitIndex(-1)
    }
  }, [gameState, selectedFruitIndex, fruits, startGame, handleFruitClick])

  const handleKeyboardSpace = useCallback(() => {
    if (gameState === 'playing' || gameState === 'paused') {
      pauseGame()
    }
  }, [gameState, pauseGame])

  const handleArrowKeys = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing' || fruits.length === 0) {
      return
    }

    if (selectedFruitIndex === -1) {
      setSelectedFruitIndex(0)
      return
    }

    const currentFruit = fruits[selectedFruitIndex]
    if (!currentFruit) {
      setSelectedFruitIndex(0)
      return
    }

    let bestIndex = selectedFruitIndex
    let bestDistance = Infinity

    fruits.forEach((fruit, index) => {
      if (index === selectedFruitIndex) return

      const dx = fruit.x - currentFruit.x
      const dy = fruit.y - currentFruit.y

      const isInDirection = direction === 'right' ? dx > 0
        : direction === 'left' ? dx < 0
        : direction === 'down' ? dy > 0
        : dy < 0

      if (isInDirection) {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < bestDistance) {
          bestDistance = distance
          bestIndex = index
        }
      }
    })

    setSelectedFruitIndex(bestIndex)
  }, [gameState, fruits, selectedFruitIndex])

  const { gameContainerRef } = useKeyboardControls({
    onSpacePress: handleKeyboardSpace,
    onEnterPress: handleKeyboardEnter,
    onArrowKeys: handleArrowKeys
  }, (gameState === 'playing' || gameState === 'paused' || gameState === 'idle') && !showCollection)

  // Stage completion check
  useEffect(() => {
    if (gameState !== 'idle' || score <= 0 || !stage?.isHydrated || !stage?.currentStageInfo || stageClearProcessed) {
      return
    }

    const isStageCompleted = stage?.checkStageCompletion(score, harvestedFruits) ?? false
    if (isStageCompleted) {
      setStageClearProcessed(true)
      setShowStageClearMessage(true)
      const gameArea = gameAreaRef.current
      if (gameArea) {
        const rect = gameArea.getBoundingClientRect()
        triggerAnimation('stageComplete', rect.width / 2, rect.height / 2)
      }
    }
  }, [gameState, score, harvestedFruits, stage, triggerAnimation, stageClearProcessed])

  // Show ResultModal when game ends (playing → idle transition with score > 0)
  const prevGameStateRef = useRef(gameState)
  useEffect(() => {
    if (prevGameStateRef.current === 'playing' && gameState === 'idle' && score > 0) {
      setShowResultModal(true)
      // AC-8.4: プレイした日にスタンプ（全目標達成は不要）
      dailyPractice.stampToday()
    }
    prevGameStateRef.current = gameState
  // dailyPractice.stampToday は today 依存の useCallback だが、日付跨ぎ中のゲーム終了は極めて稀
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, score])

  // AC-8.3: 全目標達成時に祝福演出（スタンプはゲーム終了時に既に押下済み）
  useEffect(() => {
    if (dailyPractice.isGoalComplete && dailyPractice.isHydrated) {
      setShowDailyGoalComplete(true)
      const timer = setTimeout(() => setShowDailyGoalComplete(false), 3000)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyPractice.isGoalComplete, dailyPractice.isHydrated])

  // Auto-dismiss badge notification after 3 seconds
  useEffect(() => {
    if (gamification.newlyEarnedBadge) {
      setShowBadgeNotification(true)
      const timer = setTimeout(() => {
        setShowBadgeNotification(false)
        gamification.clearNewBadge()
      }, 3000)
      return () => clearTimeout(timer)
    }
  // gamification.clearNewBadge は useCallback([]) で安定参照のためdepsから除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamification.newlyEarnedBadge])

  // Detect mastery level up after commitSession (P1: hydration完了後のみ)
  useEffect(() => {
    if (!gamification.isHydrated) {
      prevMasteryRef.current = gamification.masteryLevels
      return
    }
    const prev = prevMasteryRef.current
    const curr = gamification.masteryLevels
    const keys = ['click', 'doubleClick', 'rightClick', 'drop'] as const
    // P2: 全操作の昇格を収集（最初の1つだけでなく全て）
    const levelUps: { op: IT; level: MasteryLevel }[] = []
    for (const key of keys) {
      if (curr[key] > prev[key]) {
        levelUps.push({ op: key, level: curr[key] })
      }
    }
    prevMasteryRef.current = curr
    if (levelUps.length > 0) {
      let idx = 0
      setLevelUpInfo(levelUps[idx])
      const clearTimer = () => {
        if (levelUpTimerRef.current) {
          clearTimeout(levelUpTimerRef.current)
          levelUpTimerRef.current = null
        }
      }
      const showNext = () => {
        idx++
        if (idx < levelUps.length) {
          setLevelUpInfo(levelUps[idx])
          levelUpTimerRef.current = setTimeout(showNext, 3000)
        } else {
          setLevelUpInfo(null)
          levelUpTimerRef.current = null
        }
      }
      levelUpTimerRef.current = setTimeout(showNext, 3000)
      return clearTimer
    }
  }, [gamification.masteryLevels, gamification.isHydrated])

  // Reset state when game starts (P3: levelUpInfoもクリア)
  useEffect(() => {
    if (gameState === 'playing') {
      setStageClearProcessed(false)
      setShowResultModal(false)
      setShowBadgeNotification(false)
      setLevelUpInfo(null)
      gamification.clearNewBadge()
    }
  // gamification.clearNewBadge は useCallback([]) で安定参照のためdepsから除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState])

  // Electron API handlers
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return
    }

    const handleNewGame = () => {
      resetGame()
      startGame()
    }

    const handleShowHelp = () => {
      const helpButton = document.querySelector('[data-help-trigger]') as HTMLElement
      helpButton?.click()
    }

    window.electronAPI.onNewGame(handleNewGame)
    window.electronAPI.onShowHelp(handleShowHelp)

    return () => {
      window.electronAPI?.removeAllListeners('new-game')
      window.electronAPI?.removeAllListeners('show-help')
    }
  }, [resetGame, startGame])

  const handleNextStage = useCallback(() => {
    setShowStageClearMessage(false)
    stage?.nextStage()
    resetGame()
    setStageClearProcessed(false)
  }, [stage, resetGame])

  const handleCloseStageClear = useCallback(() => {
    setShowStageClearMessage(false)
  }, [])

  return (
    <div
      ref={gameContainerRef as React.RefObject<HTMLDivElement>}
      className="min-h-screen p-2 md:p-3 bg-gradient-to-br from-[var(--color-cream)] via-[var(--color-cream-dark)] to-[var(--color-sky-light)]"
      tabIndex={0}
      aria-label={t.gameTitle}
      role="application"
    >
      {/*
        プレイエリアが主役のレイアウト。
        画面はスリムなHUDバー（タイトル・スコア・時間）と操作バーで挟み、
        残りの高さをすべてプレイエリアに割り当てる。
        目標や収穫数はプレイエリアの上にクリック透過のオーバーレイとして重ねる。

        md未満（スマホ縦）ではHUDが折り返して固定高さに収まらないため、
        高さ固定をやめて自然な縦スクロールにする（プレイエリアは45vh）。
      */}
      <div className="max-w-6xl mx-auto flex flex-col md:h-[calc(100dvh-1.5rem)]">
        <motion.div
          initial={GAME_CONTAINER_ANIMATION.initial}
          animate={GAME_CONTAINER_ANIMATION.animate}
          transition={GAME_CONTAINER_ANIMATION.transition}
          className="bg-white/90 backdrop-blur-sm rounded-[var(--radius-xl)] shadow-playful overflow-hidden flex flex-col flex-1 min-h-0"
          style={{ border: '4px solid var(--color-secondary)' }}
        >
          {/* HUDバー: タイトル + スコア/時間チップ + あそびかた */}
          <div className="bg-gradient-ocean px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0">
            <h1 className="text-display text-lg md:text-xl font-bold text-white whitespace-nowrap drop-shadow">
              🍎 {t.gameTitle}
            </h1>
            <div className="flex-1 min-w-0">
              <ScoreBar
                score={score}
                highScore={highScore}
                timeLeft={timeLeft}
                streak={operationStats.streak}
                gameState={gameState}
                combo={combo}
                stage={stage}
                t={t}
              />
            </div>
            <HelpDialog t={t} />
          </div>

          {/* プレイエリア + オーバーレイ（md未満は45vh固定、md以上は残り全部） */}
          <div className="relative flex flex-col h-[45vh] md:h-auto md:flex-1 min-h-0">
            <GamePlayArea
              fruits={fruits}
              powerUps={powerUps}
              particles={particles}
              isHardMode={isHardMode}
              selectedFruitIndex={selectedFruitIndex}
              dropAreaText={t.dropArea}
              onFruitClick={handleFruitClick}
              onPowerUpCollect={handlePowerUpClick}
              onTriggerAnimation={triggerAnimation}
              onFruitCollected={onFruitCollected}
              gameAreaRef={gameAreaRef}
              streak={operationStats.streak}
              lastStreakBonus={operationStats.lastStreakBonus}
            />
            {/* pointer-events-none でクリックを下のフルーツへ通す */}
            <div className="absolute top-1.5 inset-x-0 z-20 pointer-events-none">
              <HarvestedFruitsDisplay
                harvestedFruits={harvestedFruits}
                score={score}
                stage={stage}
                t={t}
              />
            </div>
          </div>

          <GameControls
            gameState={gameState}
            isHardMode={isHardMode}
            language={language}
            difficulty={difficulty}
            soundEffects={soundEffects}
            onStart={startGame}
            onPause={pauseGame}
            onReset={resetGame}
            onStageSelect={() => setShowStageSelector(true)}
            onHardModeChange={handleHardModeChange}
            onToggleLanguage={toggleLanguage}
            t={t}
          />
        </motion.div>
      </div>

      {showStageSelector && (
        <StageSelector
          stages={stage?.allStages ?? []}
          currentStage={stage?.isHydrated ? (stage?.currentStage ?? 1) : 1}
          stageStars={gamification.stageStars}
          onSelectStage={handleStageSelect}
          onClose={() => setShowStageSelector(false)}
        />
      )}

      <ResultModal
        open={showResultModal}
        sessionStats={operationStats.sessionStats}
        starRating={lastStarRating}
        lastSessionStats={gamification.previousSessionStats}
        onClose={() => setShowResultModal(false)}
      />

      <BadgeNotification
        badge={gamification.newlyEarnedBadge}
        show={showBadgeNotification}
      />

      <div className="max-w-6xl mx-auto mt-4">
        <DailyPracticeCard
          todayGoals={dailyPractice.todayGoals}
          isGoalComplete={dailyPractice.isGoalComplete}
          practiceStreak={dailyPractice.practiceStreak}
        />
      </div>

      {gameState === 'idle' && (
        <div className="max-w-6xl mx-auto mt-4 space-y-4">
          <MasteryDisplay
            masteryLevels={gamification.masteryLevels}
            masteryProgress={gamification.masteryProgress}
            cumulativeStats={gamification.cumulativeStats}
          />
          <BadgeDisplay
            earnedBadges={gamification.earnedBadges}
            cumulativeStats={gamification.cumulativeStats}
          />
          <Button
            data-testid="collection-open-button"
            onClick={() => setShowCollection(true)}
            className="w-full"
            variant="outline"
          >
            ずかんを見る
          </Button>
        </div>
      )}

      <CollectionModal
        open={showCollection}
        onClose={() => setShowCollection(false)}
        cumulativeStats={gamification.cumulativeStats}
        earnedBadges={gamification.earnedBadges}
        masteryLevels={gamification.masteryLevels}
        masteryProgress={gamification.masteryProgress}
        stamps={dailyPractice.stamps}
        practiceStreak={dailyPractice.practiceStreak}
      />

      <DailyGoalComplete
        show={showDailyGoalComplete}
        streak={dailyPractice.practiceStreak}
      />

      {levelUpInfo && (
        <LevelUpNotification
          operationType={levelUpInfo.op}
          newLevel={levelUpInfo.level}
          show
        />
      )}

      <StageClearModal
        show={showStageClearMessage}
        currentStage={stage?.isHydrated ? stage?.currentStage : 1}
        starRating={lastStarRating}
        onNextStage={handleNextStage}
        onClose={handleCloseStageClear}
        t={t}
      />
    </div>
  )
}
