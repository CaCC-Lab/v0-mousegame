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
} from '@/lib/gameLogic'
import { useLocalStorage } from './useLocalStorage'
import { useSoundEffects } from './useSoundEffects'
import { useDifficulty } from './useDifficulty'
import { usePowerUps } from './usePowerUps'
import { useStage } from './useStage'

const INITIAL_HARVESTED_FRUITS: HarvestedFruits = {
  apple: 0,
  blueberry: 0,
  lemon: 0,
  watermelon: 0,
}

const GAME_AREA_DIMENSIONS = { width: 800, height: 600 }

function createInitialHarvestedFruits(): HarvestedFruits {
  return { ...INITIAL_HARVESTED_FRUITS }
}

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useLocalStorage('fruitHarvestHighScore', 0)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [harvestedFruits, setHarvestedFruits] = useState<HarvestedFruits>(createInitialHarvestedFruits())
  const [isHardMode, setIsHardMode] = useLocalStorage('fruitHarvestHardMode', false)

  const animationFrameRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(0)
  const scoreRef = useRef<number>(0)
  const harvestedFruitsRef = useRef<HarvestedFruits>(createInitialHarvestedFruits())

  const soundEffects = useSoundEffects()
  const difficulty = useDifficulty()
  const powerUps = usePowerUps(GAME_AREA_DIMENSIONS)
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

  // Refs for accessing latest values in effects without causing re-renders
  const isEffectActiveRef = useRef(isEffectActive)
  const stopSpawningRef = useRef(stopSpawning)
  const stageRef = useRef(stage)
  const soundEffectsRef = useRef(soundEffects)
  const highScoreRef = useRef(highScore)

  // Sync refs with state
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { harvestedFruitsRef.current = harvestedFruits }, [harvestedFruits])
  useEffect(() => { isEffectActiveRef.current = isEffectActive }, [isEffectActive])
  useEffect(() => { stopSpawningRef.current = stopSpawning }, [stopSpawning])
  useEffect(() => { stageRef.current = stage }, [stage])
  useEffect(() => { soundEffectsRef.current = soundEffects }, [soundEffects])
  useEffect(() => { highScoreRef.current = highScore }, [highScore])

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)

    const currentStageInfo = stage.currentStageInfo
    if (currentStageInfo) {
      setTimeLeft(currentStageInfo.timeLimit)
      setFruits(generateFruits(currentStageInfo.difficulty.fruitCount))
    } else {
      const adjustedTime = difficulty.getAdjustedGameTime(GAME_CONFIG.gameDuration)
      setTimeLeft(adjustedTime)
      setFruits(generateFruits(difficulty.currentConfig.fruitCount))
    }

    setHarvestedFruits(createInitialHarvestedFruits())
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
    setHarvestedFruits(createInitialHarvestedFruits())

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    resetPowerUps()
  }, [resetPowerUps])

  const handleFruitInteraction = useCallback((fruit: Fruit, action: InteractionType) => {
    if (gameState !== 'playing') return

    const basePoints = calculateScore(fruit.type, action)
    if (basePoints <= 0) return

    let adjustedPoints = difficulty.getAdjustedScore(basePoints)
    const scoreMultiplier = getEffectValue('scoreMultiplier')
    adjustedPoints = Math.floor(adjustedPoints * scoreMultiplier)

    setScore(prevScore => prevScore + adjustedPoints)
    setHarvestedFruits(prev => ({
      ...prev,
      [fruit.type]: prev[fruit.type] + 1
    }))
    setFruits(prevFruits => {
      const updatedFruits = prevFruits.filter(f => f.id !== fruit.id)
      return [...updatedFruits, generateFruit()]
    })
    soundEffects.playCollectSound()
  }, [gameState, soundEffects, difficulty, getEffectValue])

  const moveFruits = useCallback(() => {
    if (gameState !== 'playing' || !isHardMode) return

    const now = performance.now()
    let deltaTime = (now - lastUpdateTimeRef.current) / 1000
    lastUpdateTimeRef.current = now

    const speedBoostMultiplier = getEffectValue('speedBoost')
    deltaTime *= speedBoostMultiplier

    setFruits(prevFruits => prevFruits.map(fruit => updateFruitPosition(fruit, deltaTime)))

    animationFrameRef.current = requestAnimationFrame(moveFruits)
  }, [gameState, isHardMode, getEffectValue])

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      const isTimeFrozen = isEffectActiveRef.current('freezeTime')
      if (isTimeFrozen) return

      setTimeLeft(prevTime => {
        const newTime = prevTime - 1
        if (newTime <= 0) {
          setGameState('idle')
          stopSpawningRef.current()

          const isStageCompleted = stageRef.current.checkStageCompletion(
            scoreRef.current,
            harvestedFruitsRef.current
          )

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
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, setHighScore])

  // Animation effect for hard mode
  useEffect(() => {
    if (gameState !== 'playing' || !isHardMode) return

    lastUpdateTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(moveFruits)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, isHardMode, moveFruits])

  const handlePowerUpClick = useCallback((powerUpId: string) => {
    if (gameState !== 'playing') return

    const effect = collectPowerUp(powerUpId)
    if (!effect) return

    soundEffects.playCollectSound()

    if (effect.type === 'timeExtension') {
      setTimeLeft(prevTime => prevTime + Math.floor(effect.value / 1000))
    } else if (effect.type === 'extraFruits') {
      setFruits(prevFruits => {
        const newFruits = Array.from({ length: effect.value }, () => generateFruit())
        return [...prevFruits, ...newFruits]
      })
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
    activePowerUpEffects,
    stage,
  }
}
