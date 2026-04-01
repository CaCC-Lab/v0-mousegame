"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useKeyboardControls } from '@/hooks/useKeyboardControls'
import { useLanguage } from '@/hooks/useLanguage'
import { useAnimation } from '@/hooks/useAnimation'
import { StageSelector } from './StageSelector'
import {
  GameHeader,
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
import { Fruit, InteractionType } from '@/types/game'

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

  const [selectedFruitIndex, setSelectedFruitIndex] = useState<number>(-1)
  const [showStageSelector, setShowStageSelector] = useState(false)
  const [showStageClearMessage, setShowStageClearMessage] = useState(false)
  const [stageClearProcessed, setStageClearProcessed] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showBadgeNotification, setShowBadgeNotification] = useState(false)
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
  }, gameState === 'playing' || gameState === 'paused' || gameState === 'idle')

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
    }
    prevGameStateRef.current = gameState
  }, [gameState, score])

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamification.newlyEarnedBadge])

  // Reset stage clear processed when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      setStageClearProcessed(false)
      setShowResultModal(false)
    }
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
      className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-[var(--color-cream)] via-[var(--color-cream-dark)] to-[var(--color-sky-light)]"
      tabIndex={0}
      aria-label={t.gameTitle}
      role="application"
    >
      <div className="max-w-6xl mx-auto">
        <GameHeader
          title={`🍎 ${t.gameTitle} 🍉`}
          subtitle="マウス操作を楽しく学ぼう！"
        />

        <motion.div
          initial={GAME_CONTAINER_ANIMATION.initial}
          animate={GAME_CONTAINER_ANIMATION.animate}
          transition={GAME_CONTAINER_ANIMATION.transition}
          className="bg-white/90 backdrop-blur-sm rounded-[var(--radius-xl)] shadow-playful overflow-hidden"
          style={{ border: '4px solid var(--color-secondary)' }}
        >
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

          <HelpDialog t={t} />

          <HarvestedFruitsDisplay
            harvestedFruits={harvestedFruits}
            score={score}
            stage={stage}
            t={t}
          />

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

      {gameState === 'idle' && (
        <div className="max-w-6xl mx-auto mt-4">
          <BadgeDisplay
            earnedBadges={gamification.earnedBadges}
            cumulativeStats={gamification.cumulativeStats}
          />
        </div>
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
