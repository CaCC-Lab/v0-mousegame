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
  const [timeLeft, setTimeLeft] = useState<number>(60)
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
  const scoreRef = useRef<number>(0)
  const harvestedFruitsRef = useRef<HarvestedFruits>({
    apple: 0,
    blueberry: 0,
    lemon: 0,
    watermelon: 0,
  })
  
  const soundEffects = useSoundEffects()
  const difficulty = useDifficulty()
  const powerUps = usePowerUps({ width: 800, height: 600 }) // Game area dimensions
  const { 
    isEffectActive, 
    stopSpawning, 
    startSpawning, 
    reset: resetPowerUps, 
    getEffectValue, 
    collectPowerUp,
    powerUps: powerUpsList,
    activeEffects: activePowerUpEffects
  } = powerUps
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
    startSpawning()
    
    soundEffects.playGameStartSound()
  }, [soundEffects, difficulty, startSpawning, stage])

  const pauseGame = useCallback(() => {
    setGameState(prevState => prevState === 'playing' ? 'paused' : 'playing')
  }, [])

  const resetGame = useCallback(() => {
    setGameState('idle')
    setScore(0)
    setTimeLeft(60)
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
    resetPowerUps()
    isTimeFreezed.current = false
  }, [resetPowerUps])

  // Sync refs with state
  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    harvestedFruitsRef.current = harvestedFruits
  }, [harvestedFruits])

  const handleFruitInteraction = useCallback((fruit: Fruit, action: InteractionType) => {
    if (gameState !== 'playing') return

    const basePoints = calculateScore(fruit.type, action)
    
    if (basePoints > 0) {
      // Apply difficulty-based score adjustment
      let adjustedPoints = difficulty.getAdjustedScore(basePoints)
      
      // Apply score multiplier power-up
      const scoreMultiplier = getEffectValue('scoreMultiplier')
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
  }, [gameState, soundEffects, difficulty, getEffectValue])

  const moveFruits = useCallback(() => {
    if (gameState !== 'playing' || !isHardMode) return

    const now = performance.now()
    let deltaTime = (now - lastUpdateTimeRef.current) / 1000
    lastUpdateTimeRef.current = now

    // Apply speed boost effect (slower fruit movement)
    const speedBoostMultiplier = getEffectValue('speedBoost')
    deltaTime *= speedBoostMultiplier

    setFruits(prevFruits => 
      prevFruits.map(fruit => updateFruitPosition(fruit, deltaTime))
    )

    animationFrameRef.current = requestAnimationFrame(moveFruits)
  }, [gameState, isHardMode, getEffectValue])


  // Create refs to access latest values without causing re-renders
  const isEffectActiveRef = useRef(isEffectActive)
  const stopSpawningRef = useRef(stopSpawning)
  const stageRef = useRef(stage)
  const soundEffectsRef = useRef(soundEffects)
  const highScoreRef = useRef(highScore)

  // Update refs when values change
  useEffect(() => {
    isEffectActiveRef.current = isEffectActive
  }, [isEffectActive])
  
  useEffect(() => {
    stopSpawningRef.current = stopSpawning
  }, [stopSpawning])
  
  useEffect(() => {
    stageRef.current = stage
  }, [stage])
  
  useEffect(() => {
    soundEffectsRef.current = soundEffects
  }, [soundEffects])
  
  useEffect(() => {
    highScoreRef.current = highScore
  }, [highScore])

  // Timer effect - only depends on gameState
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (gameState === 'playing') {
      timer = setInterval(() => {
        // Check if time is frozen using ref
        const isTimeFrozen = isEffectActiveRef.current('freezeTime')
        if (!isTimeFrozen) {
          setTimeLeft(prevTime => {
            const newTime = prevTime - 1
            if (newTime <= 0) {
              // タイマーが0になったら同期的に処理を実行
              setGameState('idle')
              stopSpawningRef.current()
              
              // Check stage completion
              const isStageCompleted = stageRef.current.checkStageCompletion(scoreRef.current, harvestedFruitsRef.current)
              
              if (isStageCompleted) {
                soundEffectsRef.current.playHighScoreSound()
              } else {
                soundEffectsRef.current.playGameOverSound()
              }
              
              if (scoreRef.current > highScoreRef.current) {
                setHighScore(scoreRef.current)
              }
              return 0
            }
            return newTime
          })
        }
      }, 1000)
    }
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [gameState, setHighScore])

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
    
    const effect = collectPowerUp(powerUpId)
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
  }, [gameState, collectPowerUp, soundEffects])

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
    powerUps: powerUpsList,
    activePowerUpEffects: activePowerUpEffects,
    stage,
  }
}