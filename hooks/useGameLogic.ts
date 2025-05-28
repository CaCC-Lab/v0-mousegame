import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Fruit,
  GameState,
  HarvestedFruits,
  InteractionType,
  GAME_CONFIG,
} from '@/types/game'
import {
  generateFruit,
  generateFruits,
  calculateScore,
  updateFruitPosition,
  isValidHarvestAction,
} from '@/lib/gameLogic'
import { useLocalStorage } from './useLocalStorage'
import { useSoundEffects } from './useSoundEffects'
import { useDifficulty } from './useDifficulty'
import { usePowerUps } from './usePowerUps'
import { useStage } from './useStage'

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useLocalStorage('fruitHarvestHighScore', 0)
  const [timeLeft, setTimeLeft] = useState<number>(GAME_CONFIG.gameDuration)
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [harvestedFruits, setHarvestedFruits] = useState<HarvestedFruits>({
    apple: 0,
    blueberry: 0,
    lemon: 0,
    watermelon: 0,
  })
  const [isHardMode, setIsHardMode] = useLocalStorage('fruitHarvestHardMode', false)
  
  const animationFrameRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(0)
  const isTimeFreezed = useRef<boolean>(false)
  
  const soundEffects = useSoundEffects()
  const difficulty = useDifficulty()
  const powerUps = usePowerUps({ width: 800, height: 600 }) // Game area dimensions
  const stage = useStage()

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    
    // Use stage configuration if available, otherwise use difficulty settings
    const currentStageInfo = stage.currentStageInfo
    if (currentStageInfo) {
      // Use stage settings
      setTimeLeft(currentStageInfo.timeLimit)
      setFruits(generateFruits(currentStageInfo.difficulty.fruitCount))
    } else {
      // Fallback to difficulty-based settings
      const adjustedTime = difficulty.getAdjustedGameTime(GAME_CONFIG.gameDuration)
      setTimeLeft(adjustedTime)
      
      const fruitCount = difficulty.currentConfig.fruitCount
      setFruits(generateFruits(fruitCount))
    }
    
    setHarvestedFruits({
      apple: 0,
      blueberry: 0,
      lemon: 0,
      watermelon: 0,
    })
    
    // Start power-up spawning
    powerUps.startSpawning()
    
    soundEffects.playGameStartSound()
  }, [soundEffects, difficulty, powerUps, stage])

  const pauseGame = useCallback(() => {
    setGameState(prevState => prevState === 'playing' ? 'paused' : 'playing')
  }, [])

  const resetGame = useCallback(() => {
    setGameState('idle')
    setScore(0)
    setTimeLeft(GAME_CONFIG.gameDuration)
    setFruits([])
    setHarvestedFruits({
      apple: 0,
      blueberry: 0,
      lemon: 0,
      watermelon: 0,
    })
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // Reset power-ups
    powerUps.reset()
    isTimeFreezed.current = false
  }, [powerUps])

  const handleFruitInteraction = useCallback((fruit: Fruit, action: InteractionType) => {
    if (gameState !== 'playing') return

    const basePoints = calculateScore(fruit.type, action)
    
    if (basePoints > 0) {
      // Apply difficulty-based score adjustment
      let adjustedPoints = difficulty.getAdjustedScore(basePoints)
      
      // Apply score multiplier power-up
      const scoreMultiplier = powerUps.getEffectValue('scoreMultiplier')
      adjustedPoints = Math.floor(adjustedPoints * scoreMultiplier)
      
      setScore(prevScore => prevScore + adjustedPoints)
      setHarvestedFruits(prev => ({
        ...prev,
        [fruit.type]: prev[fruit.type] + 1
      }))
      setFruits(prevFruits => {
        const updatedFruits = prevFruits.filter(f => f.id !== fruit.id)
        const newFruit = generateFruit()
        return [...updatedFruits, newFruit]
      })
      soundEffects.playCollectSound()
    }
  }, [gameState, soundEffects, difficulty, powerUps])

  const moveFruits = useCallback(() => {
    if (gameState !== 'playing' || !isHardMode) return

    const now = performance.now()
    let deltaTime = (now - lastUpdateTimeRef.current) / 1000
    lastUpdateTimeRef.current = now

    // Apply speed boost effect (slower fruit movement)
    const speedBoostMultiplier = powerUps.getEffectValue('speedBoost')
    deltaTime *= speedBoostMultiplier

    setFruits(prevFruits => 
      prevFruits.map(fruit => updateFruitPosition(fruit, deltaTime))
    )

    animationFrameRef.current = requestAnimationFrame(moveFruits)
  }, [gameState, isHardMode, powerUps])

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        // Check if time is frozen
        const isTimeFrozen = powerUps.isEffectActive('freezeTime')
        if (!isTimeFrozen) {
          setTimeLeft(prevTime => prevTime - 1)
        }
      }, 1000)
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('idle')
      powerUps.stopSpawning()
      
      // Check stage completion
      const isStageCompleted = stage.checkStageCompletion(score, harvestedFruits)
      
      if (isStageCompleted) {
        soundEffects.playHighScoreSound()
      } else {
        soundEffects.playGameOverSound()
      }
      
      if (score > highScore) {
        setHighScore(score)
      }
    }
    return () => clearInterval(timer)
  }, [gameState, timeLeft, score, highScore, soundEffects, powerUps, stage, harvestedFruits])

  // Animation effect
  useEffect(() => {
    if (gameState === 'playing' && isHardMode) {
      lastUpdateTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(moveFruits)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, isHardMode, moveFruits])

  // Power-up collection handler
  const handlePowerUpClick = useCallback((powerUpId: string) => {
    if (gameState !== 'playing') return
    
    const effect = powerUps.collectPowerUp(powerUpId)
    if (effect) {
      soundEffects.playCollectSound()
      
      // Handle instant effects
      if (effect.type === 'timeExtension') {
        setTimeLeft(prevTime => prevTime + Math.floor(effect.value / 1000))
      } else if (effect.type === 'extraFruits') {
        setFruits(prevFruits => {
          const newFruits = Array.from({ length: effect.value }, () => generateFruit())
          return [...prevFruits, ...newFruits]
        })
      }
    }
  }, [gameState, powerUps, soundEffects])

  return {
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
    powerUps: powerUps.powerUps,
    activePowerUpEffects: powerUps.activeEffects,
    stage,
  }
}