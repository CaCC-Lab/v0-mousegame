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
  generateFruitForField,
  generateBalancedFruits,
  calculateScore,
  updateFruitPosition,
} from '@/lib/gameLogic'
import { useLocalStorage } from './useLocalStorage'
import { useSoundEffects } from './useSoundEffects'
import { useDifficulty } from './useDifficulty'
import { usePowerUps } from './usePowerUps'
import { useStage } from './useStage'
import { useOperationStats } from './useOperationStats'
import { useGamification } from './useGamification'
import { useArcadeMode } from './useArcadeMode'
import { calculateArcadePoints } from '@/lib/arcadeManager'
import { ARCADE_CONFIG, ArcadeResult, GameMode } from '@/types/arcade'

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
  const [mode, setMode] = useState<GameMode>('practice')
  const [arcadeResult, setArcadeResult] = useState<ArcadeResult | null>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useLocalStorage('fruitHarvestHighScore', 0)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [harvestedFruits, setHarvestedFruits] = useState<HarvestedFruits>(createInitialHarvestedFruits())
  const [isHardMode, setIsHardMode] = useLocalStorage('fruitHarvestHardMode', false)
  const [lastStarRating, setLastStarRating] = useState<0 | 1 | 2 | 3>(0)

  const animationFrameRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(0)
  const scoreRef = useRef<number>(0)
  const timeLeftRef = useRef<number>(60)
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
  const operationStats = useOperationStats()
  const gamification = useGamification()
  // コンボ・フィーバーはアーケードのプレイ中だけ時間が進む（ポーズ中は損をしない）
  const arcade = useArcadeMode(gameState === 'playing' && mode === 'arcade')

  // Refs for accessing latest values in effects without causing re-renders
  const isEffectActiveRef = useRef(isEffectActive)
  const stopSpawningRef = useRef(stopSpawning)
  const stageRef = useRef(stage)
  const soundEffectsRef = useRef(soundEffects)
  const highScoreRef = useRef(highScore)
  const operationStatsRef = useRef(operationStats)
  const gamificationRef = useRef(gamification)
  const modeRef = useRef(mode)
  const arcadeRef = useRef(arcade)

  // Sync refs with state
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { timeLeftRef.current = timeLeft }, [timeLeft])
  useEffect(() => { harvestedFruitsRef.current = harvestedFruits }, [harvestedFruits])
  useEffect(() => { isEffectActiveRef.current = isEffectActive }, [isEffectActive])
  useEffect(() => { stopSpawningRef.current = stopSpawning }, [stopSpawning])
  useEffect(() => { stageRef.current = stage }, [stage])
  useEffect(() => { soundEffectsRef.current = soundEffects }, [soundEffects])
  useEffect(() => { highScoreRef.current = highScore }, [highScore])
  useEffect(() => { operationStatsRef.current = operationStats }, [operationStats])
  useEffect(() => { gamificationRef.current = gamification }, [gamification])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { arcadeRef.current = arcade }, [arcade])

  /**
   * ゲームを開始する。
   *
   * @param nextMode 'practice' は従来のステージ制（既定）、
   *                 'arcade' は60秒スコアアタック。
   *                 アーケードは記録を比べる遊びなので、時間・フルーツ数・得点計算を
   *                 ステージや難易度設定から切り離して常に同じ条件にする。
   */
  const startGame = useCallback((nextMode: GameMode = 'practice') => {
    setMode(nextMode)
    modeRef.current = nextMode
    setGameState('playing')
    setScore(0)
    scoreRef.current = 0

    if (nextMode === 'arcade') {
      setArcadeResult(null)
      arcade.reset()
      setTimeLeft(ARCADE_CONFIG.duration)
      timeLeftRef.current = ARCADE_CONFIG.duration
      // 最初の畑から4種類そろえて、どの操作でもすぐ点を取れるようにする
      setFruits(generateBalancedFruits(ARCADE_CONFIG.fruitCount))
    } else {
      const currentStageInfo = stage.currentStageInfo
      if (currentStageInfo) {
        setTimeLeft(currentStageInfo.timeLimit)
        timeLeftRef.current = currentStageInfo.timeLimit
        setFruits(generateFruits(currentStageInfo.difficulty.fruitCount))
      } else {
        const adjustedTime = difficulty.getAdjustedGameTime(GAME_CONFIG.gameDuration)
        setTimeLeft(adjustedTime)
        timeLeftRef.current = adjustedTime
        setFruits(generateFruits(difficulty.currentConfig.fruitCount))
      }
    }

    setHarvestedFruits(createInitialHarvestedFruits())
    harvestedFruitsRef.current = createInitialHarvestedFruits()
    operationStats.resetSession()
    startSpawning()
    soundEffects.playGameStartSound()
  }, [soundEffects, difficulty, startSpawning, stage, operationStats, arcade])

  const pauseGame = useCallback(() => {
    setGameState(prevState => prevState === 'playing' ? 'paused' : 'playing')
  }, [])

  // タブが隠れている間はゲームを止める。
  // 子どもが席を離れている間もタイマーが減り続けると、
  // 戻ったときには時間切れでスコアが不当に下がってしまう。
  // 戻ったときの自動再開はしない（不意にゲームが動き出さないよう、再開は本人の操作に任せる）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setGameState(prevState => (prevState === 'playing' ? 'paused' : prevState))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const resetGame = useCallback(() => {
    setGameState('idle')
    // リセットは「最初の選択画面に戻る」操作なので、モード選択もやり直しにする
    setMode('practice')
    modeRef.current = 'practice'
    setArcadeResult(null)
    arcade.reset()
    setScore(0)
    setTimeLeft(60)
    timeLeftRef.current = 60
    setFruits([])
    setHarvestedFruits(createInitialHarvestedFruits())

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    resetPowerUps()
  }, [resetPowerUps, arcade])

  const handleFruitInteraction = useCallback((fruit: Fruit, action: InteractionType) => {
    if (gameState !== 'playing') return

    const isArcade = modeRef.current === 'arcade'
    const basePoints = calculateScore(fruit.type, action)

    if (basePoints <= 0) {
      operationStatsRef.current.recordFailure(action)
      // アーケードでは操作を間違えるとコンボが途切れる（点は減らさない）
      if (isArcade) arcadeRef.current.registerMiss()
      return
    }

    const newStreak = operationStatsRef.current.recordSuccess(action)

    // この収穫に適用されたコンボ倍率・フィーバー状態（アーケードのみ）
    const bonus = isArcade ? arcadeRef.current.registerHarvest() : null

    let adjustedPoints = bonus
      ? calculateArcadePoints(basePoints, bonus.comboMultiplier, bonus.isFever)
      : difficulty.getAdjustedScore(basePoints)
    const scoreMultiplier = getEffectValue('scoreMultiplier')
    adjustedPoints = Math.floor(adjustedPoints * scoreMultiplier)

    const newScore = scoreRef.current + adjustedPoints
    scoreRef.current = newScore
    setScore(newScore)

    const newHarvested = { ...harvestedFruitsRef.current, [fruit.type]: harvestedFruitsRef.current[fruit.type] + 1 }
    harvestedFruitsRef.current = newHarvested
    setHarvestedFruits(newHarvested)

    setFruits(prevFruits => {
      const updatedFruits = prevFruits.filter(f => f.id !== fruit.id)
      // アーケードは4種類が畑に揃い続けるように補充する（手が止まらないようにするため）
      const spawn = (field: Fruit[]) => (isArcade ? generateFruitForField(field) : generateFruit())

      const newFruits = [...updatedFruits, spawn(updatedFruits)]
      // Task 7.3: 5回連続成功時にボーナスフルーツ追加
      if (newStreak === 5) {
        newFruits.push(spawn(newFruits))
      }
      // フィーバー中は畑が実りに埋まる（上限まで）
      if (bonus?.isFever) {
        newFruits.push(spawn(newFruits))
      }
      return isArcade ? newFruits.slice(0, ARCADE_CONFIG.maxFruits) : newFruits
    })
    soundEffects.playCollectSound()

    // アーケードは60秒を走り切る遊びなので、ステージのクリア判定はしない
    if (isArcade) return

    // Task 9.1: ステージクリア即終了（AC-1.1a）
    const currentStage = stageRef.current
    if (currentStage.currentStageInfo && currentStage.checkStageCompletion(newScore, newHarvested)) {
      setGameState('idle')
      stopSpawningRef.current()
      soundEffectsRef.current.playHighScoreSound()

      const gamification = gamificationRef.current
      const latestStats = operationStatsRef.current.getLatestSessionStats()
      const stageNum = currentStage.currentStage
      const timeLimit = currentStage.currentStageInfo.timeLimit
      const starRating = gamification.calculateStarRating(stageNum, true, timeLeft, timeLimit, latestStats)
      gamification.commitSession(stageNum, starRating, latestStats)
      setLastStarRating(starRating)

      if (newScore > highScoreRef.current) {
        setHighScore(newScore)
      }
    }
  }, [gameState, soundEffects, difficulty, getEffectValue, timeLeft, setHighScore])

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

  /**
   * 時間切れの後始末。
   *
   * setTimeLeft の更新関数の中には置かない。
   * React の StrictMode（開発時）は更新関数を2回呼ぶため、そこに副作用を書くと
   * 「自己ベスト更新」の判定や commitSession が二重に走ってしまう。
   */
  const finishGame = useCallback((remainingTime: number) => {
    setGameState('idle')
    stopSpawningRef.current()

    if (modeRef.current === 'arcade') {
      const outcome = arcadeRef.current.commitResult(scoreRef.current)
      setArcadeResult(outcome)

      // アーケードもマウス操作の練習には違いないので、累積統計・習熟度・バッジには反映する。
      // 星は0で渡すため（mergeStageStarsMonotonicがmaxを取る）ステージの星評価は動かない。
      gamificationRef.current.commitSession(
        stageRef.current.currentStage,
        0,
        operationStatsRef.current.getLatestSessionStats()
      )

      if (outcome.isNewBest) {
        soundEffectsRef.current.playHighScoreSound()
      } else {
        soundEffectsRef.current.playGameOverSound()
      }
      return
    }

    const isStageCompleted = stageRef.current.checkStageCompletion(
      scoreRef.current,
      harvestedFruitsRef.current
    )

    if (isStageCompleted) {
      soundEffectsRef.current.playHighScoreSound()
    } else {
      soundEffectsRef.current.playGameOverSound()
    }

    // Task 7.2: 星評価算出・commitSession
    const gamification = gamificationRef.current
    const stats = operationStatsRef.current
    const stageNum = stageRef.current.currentStage
    const stageInfo = stageRef.current.currentStageInfo
    const timeLimit = stageInfo?.timeLimit ?? 60
    const latestSessionStats = stats.getLatestSessionStats()
    const starRating = gamification.calculateStarRating(stageNum, isStageCompleted, remainingTime, timeLimit, latestSessionStats)
    gamification.commitSession(stageNum, starRating, latestSessionStats)
    setLastStarRating(starRating)

    if (scoreRef.current > highScoreRef.current) {
      setHighScore(scoreRef.current)
    }
  }, [setHighScore])

  // Timer effect
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      const isTimeFrozen = isEffectActiveRef.current('freezeTime')
      if (isTimeFrozen) return

      const prevTime = timeLeftRef.current
      const newTime = prevTime - 1
      timeLeftRef.current = Math.max(0, newTime)
      setTimeLeft(timeLeftRef.current)

      if (newTime <= 0) {
        finishGame(prevTime)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, finishGame])

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
    handlePowerUpClick,
    soundEffects,
    difficulty,
    powerUps: powerUpsList,
    activePowerUpEffects,
    stage,
    operationStats,
    gamification,
    lastStarRating,
  }
}
