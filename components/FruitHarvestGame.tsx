"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Timer, Pause, Play, RefreshCw, Info, Moon, Sun, Languages } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
import { useDarkMode } from '@/hooks/useDarkMode'
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

  const { isDarkMode, setIsDarkMode } = useDarkMode()
  const { language, toggleLanguage, t } = useLanguage()
  const { 
    particles, 
    combo, 
    triggerAnimation, 
    onFruitCollected, 
    reset: resetAnimations
  } = useAnimation()
  
  const handleStageSelect = useCallback((stageNumber: number) => {
    const selected = stage.selectStage(stageNumber)
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
  }, [handleFruitInteraction])

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
  }, [draggedFruit, handleFruitInteraction])

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
    if (gameState === 'idle' && score > 0 && stage.currentStageInfo) {
      const isStageCompleted = stage.checkStageCompletion(score, harvestedFruits)
      if (isStageCompleted) {
        setShowStageClearMessage(true)
        // Trigger stage complete animation at center of game area
        const gameArea = gameAreaRef.current
        if (gameArea) {
          const rect = gameArea.getBoundingClientRect()
          triggerAnimation('stageComplete', rect.width / 2, rect.height / 2)
        }
        setTimeout(() => {
          setShowStageClearMessage(false)
        }, 3000)
      }
    }
  }, [gameState, score, harvestedFruits, stage, triggerAnimation])

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
      className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4"
      tabIndex={0}
      aria-label="フルーツハーベストゲーム"
      role="application"
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Game Information Area */}
        <div className="bg-gray-200 dark:bg-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold dark:text-white">
              {t.score} {score}
              {combo.multiplier > 1 && (
                <span className="ml-2 text-sm text-yellow-600 dark:text-yellow-400">
                  x{combo.multiplier} コンボ!
                </span>
              )}
            </div>
            {stage.currentStageInfo && (
              <div className="text-sm font-medium dark:text-white">
                ステージ {stage.currentStage}: {stage.currentStageInfo.name}
              </div>
            )}
          </div>
          <div className="text-xl font-bold flex items-center dark:text-white">
            <Timer className="mr-2" />
            {t.timeFormat(Math.floor(timeLeft / 60), timeLeft % 60)}
          </div>
          <div className="text-sm dark:text-gray-300">{t.highScore} {highScore}</div>
        </div>

        {/* Game Instructions */}
        <div className="bg-blue-100 dark:bg-blue-900 p-4 text-center">
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.helpTitle}</DialogTitle>
                <DialogDescription className="mt-4 text-left">
                  <div className="space-y-2">
                    <div>{t.helpContent.apple}</div>
                    <div>{t.helpContent.blueberry}</div>
                    <div>{t.helpContent.lemon}</div>
                    <div>{t.helpContent.watermelon}</div>
                    <div>{t.helpContent.hardModeDesc}</div>
                    <div>{t.helpContent.easyModeDesc}</div>
                    <div>{t.helpContent.timeLimit}</div>
                    <div>{t.helpContent.goal}</div>
                    <div className="mt-4 pt-4 border-t">
                      <strong>{t.helpContent.keyboardTitle}</strong>
                      <div>{t.helpContent.keyboardSpace}</div>
                      <div>{t.helpContent.keyboardArrow}</div>
                      <div>{t.helpContent.keyboardEnter}</div>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        {/* Harvested Fruits Area */}
        <div className="bg-green-100 dark:bg-green-900 p-4">
          {/* Stage Goals */}
          {stage.currentStageInfo && (
            <div className="mb-3 text-center text-sm dark:text-gray-200">
              <div className="font-medium">ステージ目標:</div>
              <div className="flex justify-center space-x-4 mt-1">
                <span>スコア: {score} / {stage.currentStageInfo.targetScore}</span>
                {stage.currentStageInfo.targetFruits.total && (
                  <span>
                    フルーツ: {Object.values(harvestedFruits).reduce((sum, count) => sum + count, 0)} / {stage.currentStageInfo.targetFruits.total}
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
                <span className="font-bold dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Play Area */}
        <div
          ref={gameAreaRef}
          className="relative h-[60vh] bg-green-300 dark:bg-green-800 overflow-hidden select-none"
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
              ドロップエリア
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
        <div className="bg-gray-200 dark:bg-gray-700 p-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <Button
              onClick={startGame}
              disabled={gameState === 'playing'}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Play className="mr-2 h-4 w-4" /> {t.start}
            </Button>
            <Button
              onClick={pauseGame}
              disabled={gameState === 'idle'}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {gameState === 'playing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {gameState === 'playing' ? t.pause : t.resume}
            </Button>
            <Button
              onClick={resetGame}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> {t.reset}
            </Button>
            <Button
              onClick={() => setShowStageSelector(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              ステージ選択
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <DifficultySelector
              currentDifficulty={difficulty.currentDifficulty}
              availableDifficulties={difficulty.availableDifficulties}
              difficultyDescriptions={difficulty.difficultyDescriptions}
              onDifficultyChange={difficulty.setDifficulty}
              disabled={gameState === 'playing'}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="hard-mode"
                checked={isHardMode}
                onCheckedChange={setIsHardMode}
              />
              <Label htmlFor="hard-mode" className="text-sm dark:text-gray-200">{t.hardMode}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                aria-label="ダークモード"
              />
              <Label htmlFor="dark-mode" className="text-sm flex items-center dark:text-gray-200">
                {isDarkMode ? <Moon className="w-4 h-4 mr-1" /> : <Sun className="w-4 h-4 mr-1" />}
                {t.darkMode}
              </Label>
            </div>
            <SoundControls
              soundEnabled={soundEffects.soundEnabled}
              volume={soundEffects.volume}
              onToggleSound={soundEffects.toggleSound}
              onVolumeChange={soundEffects.setVolume}
            />
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
        </div>
      </div>
      
      {/* Stage Selector Dialog */}
      {showStageSelector && (
        <StageSelector
          stages={stage.allStages}
          currentStage={stage.currentStage}
          onSelectStage={handleStageSelect}
          onClose={() => setShowStageSelector(false)}
        />
      )}
      
      {/* Stage Clear Message */}
      {showStageClearMessage && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="bg-yellow-400 dark:bg-yellow-600 text-white px-8 py-6 rounded-lg shadow-2xl"
          >
            <h2 className="text-3xl font-bold mb-2">🎉 ステージクリア！ 🎉</h2>
            <p className="text-lg text-center">ステージ {stage.currentStage} をクリアしました！</p>
            <div className="mt-4 flex justify-center space-x-4">
              <Button
                onClick={() => {
                  setShowStageClearMessage(false)
                  stage.nextStage()
                  resetGame()
                }}
                className="pointer-events-auto bg-green-500 hover:bg-green-600 text-white"
              >
                次のステージへ
              </Button>
              <Button
                onClick={() => setShowStageClearMessage(false)}
                className="pointer-events-auto bg-gray-500 hover:bg-gray-600 text-white"
              >
                閉じる
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}