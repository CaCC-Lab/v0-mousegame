"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Timer, Pause, Play, RefreshCw, Info, Languages } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AnimatePresence, motion } from 'framer-motion'
import { useGameLogic } from '@/hooks/useGameLogic'
import { useKeyboardControls } from '@/hooks/useKeyboardControls'
import { useLanguage } from '@/hooks/useLanguage'
import { useAnimation } from '@/hooks/useAnimation'
import { Fruit } from './Fruit'
import { PowerUp } from './PowerUp'
import { SoundControls } from './SoundControls'
import { DifficultySelector } from './DifficultySelector'
import { StageSelector } from './StageSelector'
import { ParticleContainer } from './ParticleContainer'
import { 
  Fruit as FruitType, 
  HarvestAnimation,
  InteractionType,
  FRUIT_EMOJI
} from '@/types/game'

export function FruitHarvestGame() {
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
  } = useGameLogic()

  const { language, toggleLanguage, t } = useLanguage()
  const { 
    particles, 
    combo, 
    triggerAnimation, 
    onFruitCollected, 
    reset: resetAnimations
  } = useAnimation()
  
  // Memoize handlers to prevent unnecessary re-renders
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

  const [draggedFruit, setDraggedFruit] = useState<FruitType | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [harvestAnimations, setHarvestAnimations] = useState<HarvestAnimation[]>([])
  const [selectedFruitIndex, setSelectedFruitIndex] = useState<number>(-1)
  const [showStageSelector, setShowStageSelector] = useState(false)
  const [showStageClearMessage, setShowStageClearMessage] = useState(false)
  const [stageClearProcessed, setStageClearProcessed] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  
  // Wrapped fruit interaction handler that triggers animations
  const handleFruitClick = useCallback((fruit: FruitType, action: InteractionType) => {
    const gameArea = gameAreaRef.current
    if (gameArea) {
      const fruitElement = gameArea.querySelector(`[data-fruit-id="${fruit.id}"]`)
      if (fruitElement) {
        const rect = fruitElement.getBoundingClientRect()
        const gameRect = gameArea.getBoundingClientRect()
        const x = rect.left + rect.width / 2 - gameRect.left
        const y = rect.top + rect.height / 2 - gameRect.top
        triggerAnimation('fruitCollect', x, y)
        onFruitCollected()
      }
    }
    handleFruitInteraction(fruit, action)
  }, [handleFruitInteraction, triggerAnimation, onFruitCollected])
  
  // Wrapped power-up collection handler
  const handlePowerUpCollect = useCallback((powerUpId: string) => {
    const gameArea = gameAreaRef.current
    if (gameArea) {
      const powerUpElement = gameArea.querySelector(`[data-powerup-id="${powerUpId}"]`)
      if (powerUpElement) {
        const rect = powerUpElement.getBoundingClientRect()
        const gameRect = gameArea.getBoundingClientRect()
        const x = rect.left + rect.width / 2 - gameRect.left
        const y = rect.top + rect.height / 2 - gameRect.top
        triggerAnimation('powerUpCollect', x, y)
      }
    }
    handlePowerUpClick(powerUpId)
  }, [handlePowerUpClick, triggerAnimation])

  const handleMouseDown = useCallback((e: React.MouseEvent, fruit: FruitType) => {
    if (e.button === 2 && fruit.type === 'lemon') {
      e.preventDefault()
      handleFruitClick(fruit, 'rightClick')
    } else if (fruit.type === 'watermelon') {
      setDraggedFruit(fruit)
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [handleFruitClick])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedFruit) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [draggedFruit])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggedFruit) {
      const dropArea = gameAreaRef.current?.querySelector('.drop-area')
      if (dropArea) {
        const rect = dropArea.getBoundingClientRect()
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          handleFruitClick(draggedFruit, 'drop')
        }
      }
      setDraggedFruit(null)
    }
  }, [draggedFruit, handleFruitClick])

  // Add harvest animation when fruit is collected
  // This is currently a placeholder for future animation improvements

  // Keyboard controls
  const { gameContainerRef } = useKeyboardControls({
    onSpacePress: () => {
      if (gameState === 'playing' || gameState === 'paused') {
        pauseGame()
      }
    },
    onEnterPress: () => {
      if (gameState === 'idle') {
        startGame()
      } else if (gameState === 'playing' && selectedFruitIndex >= 0 && selectedFruitIndex < fruits.length) {
        const selectedFruit = fruits[selectedFruitIndex]
        // Determine interaction type based on fruit type
        let interactionType: 'click' | 'doubleClick' | 'rightClick' | 'drop' = 'click'
        switch (selectedFruit.type) {
          case 'apple':
            interactionType = 'click'
            break
          case 'blueberry':
            interactionType = 'doubleClick'
            break
          case 'lemon':
            interactionType = 'rightClick'
            break
          case 'watermelon':
            // For watermelon, we can't do drag with keyboard, so we'll treat it as a click
            interactionType = 'click'
            break
        }
        handleFruitClick(selectedFruit, interactionType)
        setSelectedFruitIndex(-1) // Deselect after interaction
      }
    },
    onArrowKeys: (direction) => {
      if (gameState === 'playing' && fruits.length > 0) {
        let newIndex = selectedFruitIndex
        
        if (selectedFruitIndex === -1) {
          // No fruit selected, select the first one
          newIndex = 0
        } else {
          // Find next fruit based on direction
          const currentFruit = fruits[selectedFruitIndex]
          if (!currentFruit) {
            newIndex = 0
          } else {
            // Simple navigation: find the nearest fruit in the given direction
            let bestIndex = selectedFruitIndex
            let bestDistance = Infinity
            
            fruits.forEach((fruit, index) => {
              if (index === selectedFruitIndex) return
              
              const dx = fruit.x - currentFruit.x
              const dy = fruit.y - currentFruit.y
              
              let isInDirection = false
              switch (direction) {
                case 'right':
                  isInDirection = dx > 0
                  break
                case 'left':
                  isInDirection = dx < 0
                  break
                case 'down':
                  isInDirection = dy > 0
                  break
                case 'up':
                  isInDirection = dy < 0
                  break
              }
              
              if (isInDirection) {
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance < bestDistance) {
                  bestDistance = distance
                  bestIndex = index
                }
              }
            })
            
            newIndex = bestIndex
          }
        }
        
        setSelectedFruitIndex(newIndex)
      }
    }
  }, gameState === 'playing' || gameState === 'paused' || gameState === 'idle')
  useEffect(() => {
    // Animation system will be implemented later
  }, [])

  // Check for stage clear when game ends
  useEffect(() => {
    if (gameState === 'idle' && score > 0 && stage?.isHydrated && stage?.currentStageInfo && !stageClearProcessed) {
      const isStageCompleted = stage?.checkStageCompletion(score, harvestedFruits) ?? false
      if (isStageCompleted) {
        setStageClearProcessed(true)
        setShowStageClearMessage(true)
        // Trigger stage complete animation at center of game area
        const gameArea = gameAreaRef.current
        if (gameArea) {
          const rect = gameArea.getBoundingClientRect()
          triggerAnimation('stageComplete', rect.width / 2, rect.height / 2)
        }
      }
    }
  }, [gameState, score, harvestedFruits, stage, triggerAnimation, stageClearProcessed])
  
  // Reset stage clear flag when starting a new game
  useEffect(() => {
    if (gameState === 'playing') {
      setStageClearProcessed(false)
    }
  }, [gameState])

  // Listen for Electron menu events
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
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
    }
  }, [resetGame, startGame])

  return (
    <div 
      ref={gameContainerRef as React.RefObject<HTMLDivElement>}
      className="min-h-screen bg-gray-100 p-4"
      tabIndex={0}
      aria-label={t.gameTitle}
      role="application"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Game Information Area */}
        <div className="bg-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold">
              {t.score} {score}
              {combo.multiplier > 1 && (
                <span className="ml-2 text-sm text-yellow-600">
                  x{combo.multiplier} {t.combo}!
                </span>
              )}
            </div>
            {stage?.isHydrated && stage?.currentStageInfo && stage?.currentStage > 0 && (
              <div className="text-sm font-medium">
                {t.stage} {stage?.currentStage}: {stage?.currentStageInfo?.name}
              </div>
            )}
          </div>
          <div className="text-xl font-bold flex items-center">
            <Timer className="mr-2" />
            {t.timeFormat(Math.floor(timeLeft / 60), timeLeft % 60)}
          </div>
          <div className="text-sm">{t.highScore} {highScore}</div>
        </div>

        {/* Game Instructions */}
        <div className="bg-blue-100 p-4 text-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                data-help-trigger
              >
                <Info className="mr-2 h-4 w-4" /> {t.howToPlay}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-gray-900 text-center">{t.helpTitle}</DialogTitle>
                <DialogDescription className="sr-only">{t.helpDescription}</DialogDescription>
              </DialogHeader>
              <div className="mt-6 text-left text-gray-700">
                {/* フルーツの取り方 - 視覚的にわかりやすく配置 */}
                <h3 className="text-xl font-bold mb-4 text-center">{t.fruitSection}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-400 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
                      <div className="flex items-center mb-2">
                        <span className="text-4xl mr-3">🍎</span>
                        <span className="font-bold text-xl text-red-700">{t.apple}</span>
                      </div>
                      <div className="text-lg leading-relaxed">{t.helpContent.apple.replace(/^[^:]+: /, '')}</div>
                      <div className="mt-2 text-sm text-red-600 font-semibold">10 {t.points}</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
                      <div className="flex items-center mb-2">
                        <span className="text-4xl mr-3">🫐</span>
                        <span className="font-bold text-xl text-blue-700">{t.blueberry}</span>
                      </div>
                      <div className="text-lg leading-relaxed">{t.helpContent.blueberry.replace('🫐 ブルーベリー: ', '')}</div>
                      <div className="mt-2 text-sm text-blue-600 font-semibold">20 {t.points}</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 hover:border-yellow-400 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
                      <div className="flex items-center mb-2">
                        <span className="text-4xl mr-3">🍋</span>
                        <span className="font-bold text-xl text-yellow-700">{t.lemon}</span>
                      </div>
                      <div className="text-lg leading-relaxed">{t.helpContent.lemon.replace('🍋 レモン: ', '')}</div>
                      <div className="mt-2 text-sm text-yellow-600 font-semibold">30 {t.points}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer transform hover:scale-105 transition-transform">
                      <div className="flex items-center mb-2">
                        <span className="text-4xl mr-3">🍉</span>
                        <span className="font-bold text-xl text-green-700">{t.watermelon}</span>
                      </div>
                      <div className="text-lg leading-relaxed">{t.helpContent.watermelon.replace('🍉 スイカ: ', '')}</div>
                      <div className="mt-2 text-sm text-green-600 font-semibold">50 {t.points}</div>
                    </div>
                  </div>
                  {/* ゲームモード */}
                  <div className="mb-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <h4 className="font-bold text-lg text-purple-700 mb-3 text-center">{t.modeSection}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg">
                        <div className="font-semibold text-purple-600 mb-1">{t.easyMode}</div>
                        <div className="text-sm">{t.helpContent.easyModeDesc.replace('とまるモード: ', '')}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="font-semibold text-purple-600 mb-1">{t.hardModeTitle}</div>
                        <div className="text-sm">{t.helpContent.hardModeDesc.replace('うごくモード: ', '')}</div>
                      </div>
                    </div>
                  </div>
                  {/* ゲーム情報 */}
                  <div className="mb-6 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                    <div className="text-center space-y-2">
                      <div className="text-lg">⏱️ {t.helpContent.timeLimit}</div>
                      <div className="text-lg font-semibold">🎯 {t.helpContent.goal}</div>
                    </div>
                  </div>
                  {/* キーボード操作 */}
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <h4 className="font-bold text-lg text-gray-700 mb-3 text-center">{t.helpContent.keyboardTitle}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg">
                        <kbd className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-base font-mono shadow-sm">Space</kbd>
                        <span className="text-base">{t.helpContent.keyboardSpace.replace(/^[^:]+: /, '')}</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg">
                        <kbd className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-base font-mono shadow-sm">↑↓←→</kbd>
                        <span className="text-base">{t.helpContent.keyboardArrow.replace(/^[^:]+: /, '')}</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg">
                        <kbd className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-base font-mono shadow-sm">Enter</kbd>
                        <span className="text-base">{t.helpContent.keyboardEnter.replace(/^[^:]+: /, '')}</span>
                      </div>
                    </div>
                  </div>
                  {/* パワーアップアイテム */}
                  <div className="mt-6 p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
                    <h4 className="font-bold text-lg text-pink-700 mb-3 text-center">{t.helpContent.powerUpTitle}</h4>
                    <p className="text-sm text-gray-600 mb-4 text-center">{t.helpContent.powerUpDesc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpSpeedBoost}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpScoreMultiplier}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpSlowMotion}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpMagnet}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpShield}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpTimeExtension}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpExtraFruits}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <div className="text-base">{t.helpContent.powerUpFreezeTime}</div>
                      </div>
                    </div>
                  </div>
                </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Harvested Fruits Area */}
        <div className="bg-green-100 p-4">
          {/* Stage Goals */}
          {stage?.isHydrated && stage?.currentStageInfo && (
            <div className="mb-3 text-center text-sm">
              <div className="font-medium">{t.stageGoals}</div>
              <div className="flex justify-center space-x-4 mt-1">
                <span>{t.scoreText} {score} / {stage?.currentStageInfo?.targetScore}</span>
                {stage?.currentStageInfo?.targetFruits?.total && (
                  <span>
                    {t.fruitsText} {Object.values(harvestedFruits).reduce((sum, count) => sum + count, 0)} / {stage?.currentStageInfo?.targetFruits?.total}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Fruit Counters */}
          <div className="flex justify-around items-center">
            {Object.entries(harvestedFruits).map(([fruit, count]) => (
              <div key={fruit} className="flex items-center">
                <span className="text-2xl mr-2">{FRUIT_EMOJI[fruit as FruitType['type']]}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Play Area */}
        <div
          ref={gameAreaRef}
          data-testid="game-area"
          className="relative h-[60vh] bg-green-300 overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {fruits.map((fruit, index) => (
            <Fruit
              key={fruit.id}
              fruit={fruit}
              isHardMode={isHardMode}
              isSelected={index === selectedFruitIndex}
              onClick={() => handleFruitClick(fruit, 'click')}
              onDoubleClick={() => handleFruitClick(fruit, 'doubleClick')}
              onMouseDown={(e) => handleMouseDown(e, fruit)}
            />
          ))}
          
          {/* Power-ups */}
          {powerUps.map((powerUp) => (
            <PowerUp
              key={powerUp.id}
              powerUp={powerUp}
              onClick={handlePowerUpCollect}
            />
          ))}
          
          {/* Particle Effects */}
          <ParticleContainer particles={particles} />
          
          {draggedFruit && (
            <div
              className={`absolute pointer-events-none select-none
                ${draggedFruit.size === 'small' ? 'text-2xl' :
                  draggedFruit.size === 'medium' ? 'text-3xl' :
                  'text-4xl'}`}
              style={{
                left: `${mousePosition.x - (gameAreaRef.current?.getBoundingClientRect().left || 0)}px`,
                top: `${mousePosition.y - (gameAreaRef.current?.getBoundingClientRect().top || 0)}px`,
                zIndex: 20,
                opacity: 0.7,
              }}
            >
              {FRUIT_EMOJI[draggedFruit.type]}
            </div>
          )}
          
          <div className="drop-area absolute right-0 top-0 bottom-0 w-16 bg-yellow-200 border-l-2 border-yellow-400 flex justify-center items-center">
            <div className="writing-vertical text-yellow-800 font-bold text-lg">
              {t.dropArea}
            </div>
          </div>
          
          <AnimatePresence>
            {harvestAnimations.map((animation) => (
              <motion.div
                key={animation.id}
                className="absolute text-4xl pointer-events-none select-none"
                style={{ left: `${animation.x}%`, top: `${animation.y}%` }}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0, y: -50 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                onAnimationComplete={() => {
                  setHarvestAnimations(prev => prev.filter(a => a.id !== animation.id))
                }}
              >
                {FRUIT_EMOJI[animation.type]}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Control Area */}
        <div className="bg-gray-200 p-6">
          {/* Game Control Buttons - Top Row */}
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Button
              onClick={startGame}
              disabled={gameState === 'playing'}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
            >
              <Play className="mr-2 h-4 w-4" /> {t.start}
            </Button>
            <Button
              onClick={pauseGame}
              disabled={gameState === 'idle'}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2"
            >
              {gameState === 'playing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {gameState === 'playing' ? t.pause : t.resume}
            </Button>
            <Button
              onClick={resetGame}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> {t.reset}
            </Button>
            <Button
              onClick={() => setShowStageSelector(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2"
            >
              {t.stageSelect}
            </Button>
          </div>

          {/* Settings Controls - Bottom Row */}
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {/* Difficulty Settings Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/50 rounded-lg px-4 py-3 min-w-[320px]">
              <div className="flex-1">
                <DifficultySelector
                  currentDifficulty={difficulty.currentDifficulty}
                  availableDifficulties={difficulty.availableDifficulties}
                  onDifficultyChange={difficulty.setDifficulty}
                  disabled={gameState === 'playing'}
                  language={language}
                  t={t}
                />
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-2 border-t sm:border-t-0 sm:border-l border-gray-300 pt-3 sm:pt-0 sm:pl-4">
                <input
                  type="checkbox"
                  id="hard-mode"
                  checked={isHardMode}
                  onChange={(e) => handleHardModeChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="hard-mode" className="text-sm whitespace-nowrap">{t.hardMode}</Label>
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white/50 rounded-lg px-4 py-2">
              <Button
                onClick={toggleLanguage}
                variant="outline"
                size="sm"
                className="flex items-center"
                aria-label={`Language: ${t.language}`}
              >
                <Languages className="w-4 h-4 mr-1" />
                {language === 'ja' ? 'JA' : 'EN'}
              </Button>
            </div>

            {/* Sound Controls Group */}
            <div className="bg-white/50 rounded-lg px-4 py-2">
              <SoundControls
                soundEnabled={soundEffects.soundEnabled}
                volume={soundEffects.volume}
                onToggleSound={soundEffects.toggleSound}
                onVolumeChange={soundEffects.setVolume}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stage Selector Dialog */}
      {showStageSelector && (
        <StageSelector
          stages={stage?.allStages ?? []}
          currentStage={stage?.isHydrated ? (stage?.currentStage ?? 1) : 1}
          onSelectStage={handleStageSelect}
          onClose={() => setShowStageSelector(false)}
        />
      )}
      
      {/* Stage Clear Message */}
      <AnimatePresence>
        {showStageClearMessage && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="stage-clear-backdrop"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-yellow-400 text-white px-8 py-6 rounded-lg shadow-2xl pointer-events-auto"
              key="stage-clear-message"
            >
              <h2 className="text-3xl font-bold mb-2">{t.stageClear}</h2>
              <p className="text-lg text-center">{t.stage} {stage?.isHydrated ? stage?.currentStage : 1} {t.stageCleared}</p>
              <div className="mt-4 flex justify-center space-x-4">
                <Button
                  onClick={() => {
                    setShowStageClearMessage(false)
                    stage?.nextStage()
                    resetGame()
                    setStageClearProcessed(false)
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  {t.nextStage}
                </Button>
                <Button
                  onClick={() => setShowStageClearMessage(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  {t.close}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}