"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useKeyboardControls } from '@/hooks/useKeyboardControls'
import { useLanguage } from '@/hooks/useLanguage'
import { useAnimation } from '@/hooks/useAnimation'
import { StageSelector } from './StageSelector'
import {
  ScoreBar,
  GameControls,
  HarvestedFruitsDisplay,
  OperationLegend,
  FeverIntro,
  HelpDialog,
  StageClearModal,
  GamePlayArea,
  TouchDeviceNotice
} from './game'
import { FruitSprite } from './game/FruitSprite'
import { ResultModal } from './game/ResultModal'
import { ModeSelector } from './game/ModeSelector'
import { ArcadeHUD } from './game/ArcadeHUD'
import { ArcadeResultModal } from './game/ArcadeResultModal'
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
import type { GameMode } from '@/types/arcade'
import { useDailyPractice } from '@/hooks/useDailyPractice'
import { isRewardedBoostAvailable, requestRewardedBoost } from '@/lib/ads/rewardedBoost'

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
    mode,
    arcade,
    arcadeResult,
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
    missHint,
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

  const isArcade = mode === 'arcade'
  const showArcadeResult = isArcade && arcadeResult !== null

  const handleHardModeChange = useCallback((checked: boolean) => {
    setIsHardMode(checked)
  }, [setIsHardMode])

  // 待機中に選んでいるモード。カードを押しても始めず、「はじめる」で始める
  // （押した瞬間にタイマーが走ると、初見のプレイヤーは何が起きたか分からない）
  const [selectedMode, setSelectedMode] = useState<GameMode>('arcade')

  const handleSelectMode = useCallback((selected: GameMode) => {
    setSelectedMode(selected)
  }, [])

  // はじめてフィーバーに入ったときだけ、何が起きたのかを一度だけ説明する。
  // プレイテストでは「Feverが何なのか最後まで分からなかった」まま終わっていた
  const [showFeverIntro, setShowFeverIntro] = useState(false)
  const feverIntroShownRef = useRef(false)

  useEffect(() => {
    if (!isArcade || !arcade.isFever || feverIntroShownRef.current) return

    feverIntroShownRef.current = true
    setShowFeverIntro(true)
    const timer = setTimeout(() => setShowFeverIntro(false), 4000)
    return () => clearTimeout(timer)
  }, [isArcade, arcade.isFever])

  const handleStart = useCallback(() => {
    resetAnimations()
    startGame(selectedMode)
  }, [startGame, resetAnimations, selectedMode])

  const handleArcadeRetry = useCallback(() => {
    resetAnimations()
    startGame('arcade')
  }, [startGame, resetAnimations])

  const handleArcadeClose = useCallback(() => {
    resetGame()
    resetAnimations()
  }, [resetGame, resetAnimations])

  // リワード広告はSDK導入後に有効化される（未導入のあいだはボタンを出さない）
  const handleRewardedBoost = useCallback(() => {
    void requestRewardedBoost()
  }, [])

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
    // アーケードはステージの進行と無関係なので、クリア判定にもかけない
    if (isArcade || gameState !== 'idle' || score <= 0 || !stage?.isHydrated || !stage?.currentStageInfo || stageClearProcessed) {
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
  }, [gameState, score, harvestedFruits, stage, triggerAnimation, stageClearProcessed, isArcade])

  // Show ResultModal when game ends (playing → idle transition with score > 0)
  const prevGameStateRef = useRef(gameState)
  useEffect(() => {
    if (prevGameStateRef.current === 'playing' && gameState === 'idle' && score > 0) {
      // アーケードは専用の結果画面を出すため、練習用の結果モーダルは開かない
      if (!isArcade) {
        setShowResultModal(true)
      }
      // AC-8.4: プレイした日にスタンプ（モードを問わず「今日あそんだ」記録は残す）
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
    // reducedMotion="user": OSの「視差効果を減らす」設定を尊重し、
    // 拡大縮小や移動のアニメーションを止める（globals.cssはCSSアニメーションのみ対象で、
    // framer-motionがJSで書き込むtransformには効かないため、ここで面倒を見る）
    <MotionConfig reducedMotion="user">
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
        対象はマウスのあるPC（タッチ専用端末はTouchDeviceNoticeが案内する）。
        画面が低すぎる場合はmin-hを下回らず、ページ側がスクロールする。
      */}
      <div className="max-w-6xl mx-auto flex flex-col h-[calc(100dvh-1rem)] md:h-[calc(100dvh-1.5rem)] min-h-[480px]">
        <motion.div
          initial={GAME_CONTAINER_ANIMATION.initial}
          animate={GAME_CONTAINER_ANIMATION.animate}
          transition={GAME_CONTAINER_ANIMATION.transition}
          className="bg-white/90 backdrop-blur-sm rounded-[var(--radius-xl)] shadow-playful overflow-hidden flex flex-col flex-1 min-h-0"
          style={{ border: '4px solid var(--color-secondary)' }}
        >
          <TouchDeviceNotice t={t} />

          {/* HUDバー: タイトル + スコア/時間チップ + あそびかた */}
          <div className="bg-gradient-ocean px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0">
            <h1 className="text-display text-lg md:text-xl font-bold text-white whitespace-nowrap drop-shadow">
              <FruitSprite type="apple" size={22} className="inline-block align-[-0.15em] mr-1" decorative />
              {t.gameTitle}
            </h1>
            <div className="flex-1 min-w-0">
              <ScoreBar
                score={score}
                highScore={isArcade ? arcade.best : highScore}
                timeLeft={timeLeft}
                streak={isArcade ? undefined : operationStats.streak}
                gameState={gameState}
                combo={combo}
                stage={isArcade ? null : stage}
                t={t}
              />
            </div>
            {isArcade && (
              <ArcadeHUD
                combo={arcade.combo}
                comboMultiplier={arcade.comboMultiplier}
                feverGauge={arcade.feverGauge}
                isFever={arcade.isFever}
                t={t}
              />
            )}
            <HelpDialog t={t} />
          </div>

          {/* プレイエリア + オーバーレイ */}
          <div className="relative flex flex-col flex-1 min-h-0">
            <GamePlayArea
              fruits={fruits}
              powerUps={powerUps}
              particles={particles}
              isHardMode={isHardMode}
              selectedFruitIndex={selectedFruitIndex}
              t={t}
              missHint={missHint}
              onFruitClick={handleFruitClick}
              onPowerUpCollect={handlePowerUpClick}
              onTriggerAnimation={triggerAnimation}
              onFruitCollected={onFruitCollected}
              gameAreaRef={gameAreaRef}
              streak={operationStats.streak}
              lastStreakBonus={operationStats.lastStreakBonus}
            />
            {/* pointer-events-none でクリックを下のフルーツへ通す */}
            <div className="absolute top-1.5 inset-x-0 z-20 pointer-events-none space-y-1">
              <HarvestedFruitsDisplay
                harvestedFruits={harvestedFruits}
                score={score}
                stage={isArcade ? null : stage}
                t={t}
              />
            </div>

            {/*
              どのフルーツに何をすればいいかを、遊んでいる間ずっと見えるところに置く。
              上の収穫カウンターの真下だと役割を取り違えられたので、
              プレイエリアの下端に離して置く（ドロップエリアの手前まで）
            */}
            <div className="absolute bottom-1.5 left-0 right-20 z-20 px-2 pointer-events-none">
              <OperationLegend t={t} />
            </div>

            {/* 遊び終わって待機画面に戻ったら残さない（モード選択と重なる） */}
            <FeverIntro show={showFeverIntro && gameState === 'playing'} t={t} />

            {/* フィーバー中は画面全体を熱くする（クリックは通す） */}
            {isArcade && arcade.isFever && (
              <motion.div
                data-testid="fever-overlay"
                aria-hidden
                className="absolute inset-0 z-10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                style={{
                  // 中央は透かしてフルーツを見やすく保ち、縁だけを熱くする。
                  // screen 合成にすることで、半透明を重ねたときのくすみを避ける
                  background:
                    'radial-gradient(ellipse at center, rgba(255,140,0,0) 52%, rgba(255,120,0,0.9) 100%)',
                  mixBlendMode: 'screen',
                }}
              />
            )}

            {/* 待機中はプレイエリアをそのまま入口にする（開いて数秒で遊び始められるように） */}
            {gameState === 'idle' && !showArcadeResult && (
              // 画面が低いとカード2枚が入りきらずプレイエリアからはみ出し、
              // 下の操作ボタンに重なってタップを奪ってしまう。
              // オーバーレイ内でスクロールさせて外へ出さない
              <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/35 py-3">
                <ModeSelector
                  onSelectMode={handleSelectMode}
                  onStart={handleStart}
                  selectedMode={selectedMode}
                  arcadeBest={arcade.best}
                  arcadeRank={arcade.rank}
                  language={language}
                  t={t}
                />
              </div>
            )}
          </div>

          <GameControls
            gameState={gameState}
            isHardMode={isHardMode}
            language={language}
            difficulty={difficulty}
            soundEffects={soundEffects}
            onStart={handleStart}
            // 待機中はプレイエリア上のモード選択が開始の入口。
            // ここにも「はじめる」があると、どちらを押せばいいのか分からなくなる
            showStart={!(gameState === 'idle' && !showArcadeResult)}
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

      <ArcadeResultModal
        open={showArcadeResult}
        result={arcadeResult}
        rankProgress={arcade.rankProgress}
        language={language}
        onRetry={handleArcadeRetry}
        onClose={handleArcadeClose}
        rewardedAvailable={isRewardedBoostAvailable()}
        onRewardedBoost={handleRewardedBoost}
        t={t}
      />

      <ResultModal
        t={t}
        open={showResultModal}
        sessionStats={operationStats.sessionStats}
        starRating={lastStarRating}
        lastSessionStats={gamification.previousSessionStats}
        onClose={() => setShowResultModal(false)}
      />

      <BadgeNotification
        t={t}
        badge={gamification.newlyEarnedBadge}
        show={showBadgeNotification}
      />

      <div className="max-w-6xl mx-auto mt-4">
        <DailyPracticeCard
          t={t}
          todayGoals={dailyPractice.todayGoals}
          isGoalComplete={dailyPractice.isGoalComplete}
          practiceStreak={dailyPractice.practiceStreak}
        />
      </div>

      {gameState === 'idle' && !isArcade && (
        <div className="max-w-6xl mx-auto mt-4 space-y-4">
          <MasteryDisplay
            t={t}
            masteryLevels={gamification.masteryLevels}
            masteryProgress={gamification.masteryProgress}
            cumulativeStats={gamification.cumulativeStats}
          />
          <BadgeDisplay
            t={t}
            earnedBadges={gamification.earnedBadges}
            cumulativeStats={gamification.cumulativeStats}
          />
          <Button
            data-testid="collection-open-button"
            onClick={() => setShowCollection(true)}
            className="w-full"
            variant="outline"
          >
            {t.gamification.viewCollection}
          </Button>
        </div>
      )}

      <CollectionModal
        t={t}
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
        t={t}
        show={showDailyGoalComplete}
        streak={dailyPractice.practiceStreak}
      />

      {levelUpInfo && (
        <LevelUpNotification
          t={t}
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
    </MotionConfig>
  )
}
