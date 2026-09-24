import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Fruit,
  GameState,
  HarvestedFruits,
  InteractionType,
  MissHint,
  GAME_CONFIG,
} from '@/types/game'
import {
  generateFruit,
  generateFruits,
  generateFruitForField,
  generateBalancedFruits,
  calculateScore,
  getRequiredInteraction,
  updateFruitPosition,
  relayoutFruits,
  type AreaSize,
} from '@/lib/gameLogic'
import { useLocalStorage } from './useLocalStorage'
import { useSoundEffects } from './useSoundEffects'
import { useDifficulty } from './useDifficulty'
import { usePowerUps } from './usePowerUps'
import { useStage } from './useStage'
import { useOperationStats } from './useOperationStats'
import { useGamification } from './useGamification'
import { useArcadeMode } from './useArcadeMode'
import { calculateArcadePoints, addHarvestTime, subtractMissTime } from '@/lib/arcadeManager'
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
  // 誤操作したときに出すヒント。正しく取れたら消す
  const [missHint, setMissHint] = useState<MissHint | null>(null)
  const missHintSeqRef = useRef<number>(0)

  const animationFrameRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(0)
  const scoreRef = useRef<number>(0)
  // チャレンジ（arcade）の状態（v1.2 D1・D2・D4）
  const arcadeHarvestCountRef = useRef(0)
  // チャレンジで続いた時間（ゲーム内の秒。タイマーが刻んだ回数）
  const arcadePlayedSecRef = useRef(0)
  const arcadeMissesByOperationRef = useRef<Record<InteractionType, number>>({ click: 0, doubleClick: 0, rightClick: 0, drop: 0 })
  const [arcadeFruitsMoving, setArcadeFruitsMoving] = useState(false)
  // 実際のプレイエリアの大きさ（px）。果物の配置に使う（docs/game-spec.md §3）。
  // 画面側が測って setPlayAreaSize で知らせる。知らせが無いあいだは 1280×800 の埋め込みを基準にする
  const playAreaSizeRef = useRef<AreaSize | undefined>(undefined)
  const setPlayAreaSize = useCallback((width: number, height: number) => {
    // 描画前（0×0）は測れていないので使わない
    if (width <= 0 || height <= 0) return
    const previous = playAreaSizeRef.current
    const next = { width, height }
    playAreaSizeRef.current = next
    if (previous && Math.round(previous.width) === Math.round(width) && Math.round(previous.height) === Math.round(height)) return
    // 大きさが変わったら（遊び始めてヘッダが折り返した、窓の大きさを変えた、など）、
    // 重なった果物・帯にはみ出した果物だけを置き直す。問題の無い果物は動かさない
    setFruits((prev) => (prev.length > 0 ? relayoutFruits(prev, next) : prev))
  }, [])
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
  // 残り時間の正本は timeLeftRef（小数を持つ）。state の timeLeft は表示用に切り上げた整数。
  // 以前は state から ref へ書き戻していて、チャレンジで 0.3 秒の増加が毎回 1 秒に化けていた（v1.2 の計測で発見）。
  // ref を変えるところで state も一緒に更新する
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
    setMissHint(null)
    resetPowerUps()

    if (nextMode === 'arcade') {
      setArcadeResult(null)
      arcade.reset()
      // 時間をかせぐ型: 30 秒から始まり、取ると増え、ミスで減る（docs/game-spec.md §4.2）
      setTimeLeft(ARCADE_CONFIG.startTimeSec)
      timeLeftRef.current = ARCADE_CONFIG.startTimeSec
      arcadeHarvestCountRef.current = 0
      arcadePlayedSecRef.current = 0
      arcadeMissesByOperationRef.current = { click: 0, doubleClick: 0, rightClick: 0, drop: 0 }
      setArcadeFruitsMoving(false)
      // 最初の畑から4種類そろえて、どの操作でもすぐ点を取れるようにする
      setFruits(generateBalancedFruits(ARCADE_CONFIG.fruitCount, playAreaSizeRef.current))
    } else {
      const currentStageInfo = stage.currentStageInfo
      if (currentStageInfo) {
        setTimeLeft(currentStageInfo.timeLimit)
        timeLeftRef.current = currentStageInfo.timeLimit
        setFruits(generateFruits(currentStageInfo.difficulty.fruitCount, [], playAreaSizeRef.current))
      } else {
        const adjustedTime = difficulty.getAdjustedGameTime(GAME_CONFIG.gameDuration)
        setTimeLeft(adjustedTime)
        timeLeftRef.current = adjustedTime
        setFruits(generateFruits(difficulty.currentConfig.fruitCount, [], playAreaSizeRef.current))
      }
    }

    setHarvestedFruits(createInitialHarvestedFruits())
    harvestedFruitsRef.current = createInitialHarvestedFruits()
    operationStats.resetSession()
    if (nextMode === 'practice') {
      startSpawning()
    }
    soundEffects.playGameStartSound()
  }, [soundEffects, difficulty, resetPowerUps, startSpawning, stage, operationStats, arcade])

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
    setArcadeFruitsMoving(false)
    setScore(0)
    setTimeLeft(60)
    timeLeftRef.current = 60
    setFruits([])
    setHarvestedFruits(createInitialHarvestedFruits())
    setMissHint(null)

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
      // チャレンジでは操作を間違えるとコンボが途切れ、残り時間が減る（点は減らさない）
      if (isArcade) {
        arcadeRef.current.registerMiss()
        arcadeMissesByOperationRef.current[getRequiredInteraction(fruit.type)] += 1
        timeLeftRef.current = subtractMissTime(timeLeftRef.current)
        setTimeLeft(Math.ceil(timeLeftRef.current))
      }
      // 何が正解だったかをその場で伝える。
      // 黙って0点にされると、初見のプレイヤーは何を直せばいいのか分からない
      missHintSeqRef.current += 1
      setMissHint({
        id: missHintSeqRef.current,
        fruitType: fruit.type,
        requiredAction: getRequiredInteraction(fruit.type),
      })
      return
    }

    // 正しく取れたらヒントは役目を終える
    setMissHint(null)

    const newStreak = operationStatsRef.current.recordSuccess(action)

    // この収穫に適用されたコンボ倍率・フィーバー状態（アーケードのみ）
    const bonus = isArcade ? arcadeRef.current.registerHarvest() : null

    // チャレンジ: 取ると残り時間が増える。一定の数を取ったら果物が動き出す（段差は1か所）
    if (isArcade) {
      timeLeftRef.current = addHarvestTime(timeLeftRef.current, arcadeHarvestCountRef.current)
      arcadeHarvestCountRef.current += 1
      setTimeLeft(Math.ceil(timeLeftRef.current))
      if (arcadeHarvestCountRef.current >= ARCADE_CONFIG.moveAfterHarvests) setArcadeFruitsMoving(true)
    }

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
      const area = playAreaSizeRef.current
      const spawn = (field: Fruit[]) => (isArcade ? generateFruitForField(field, area) : generateFruit(undefined, field, area))

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
      setMissHint(null)
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

  // うごくモード、またはチャレンジで段差を越えたら果物が動く
  const fruitsMove = isHardMode || (mode === 'arcade' && arcadeFruitsMoving)

  const moveFruits = useCallback(() => {
    if (gameState !== 'playing' || !fruitsMove) return

    const now = performance.now()
    let deltaTime = (now - lastUpdateTimeRef.current) / 1000
    lastUpdateTimeRef.current = now

    const speedBoostMultiplier = getEffectValue('speedBoost')
    deltaTime *= speedBoostMultiplier

    setFruits(prevFruits => prevFruits.map(fruit => updateFruitPosition(fruit, deltaTime)))

    animationFrameRef.current = requestAnimationFrame(moveFruits)
  }, [gameState, fruitsMove, getEffectValue])

  /**
   * 時間切れの後始末。
   *
   * setTimeLeft の更新関数の中には置かない。
   * React の StrictMode（開発時）は更新関数を2回呼ぶため、そこに副作用を書くと
   * 「自己ベスト更新」の判定や commitSession が二重に走ってしまう。
   */
  const finishGame = useCallback((remainingTime: number) => {
    setGameState('idle')
    // 遊び終わって待機画面に戻ったあとまで、直前の失敗を残さない
    setMissHint(null)
    stopSpawningRef.current()

    if (modeRef.current === 'arcade') {
      const misses = arcadeMissesByOperationRef.current
      const worst = (Object.keys(misses) as InteractionType[]).reduce<InteractionType | null>(
        (best, op) => (misses[op] > 0 && (best === null || misses[op] > misses[best]) ? op : best),
        null
      )
      const outcome = {
        ...arcadeRef.current.commitResult(scoreRef.current),
        weakOperation: worst,
        endReason: 'timeUp' as const,
        playedSec: arcadePlayedSecRef.current,
      }
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
      if (modeRef.current === 'arcade') arcadePlayedSecRef.current += 1
      timeLeftRef.current = Math.max(0, newTime)
      // チャレンジでは取るたびに小数の秒が増えるので、表示は切り上げた整数にする
      setTimeLeft(Math.ceil(timeLeftRef.current))

      if (newTime <= 0) {
        finishGame(prevTime)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, finishGame])

  // Animation effect for hard mode（チャレンジで段差を越えたときも）
  useEffect(() => {
    if (gameState !== 'playing' || !fruitsMove) return

    lastUpdateTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(moveFruits)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, fruitsMove, moveFruits])

  const handlePowerUpClick = useCallback((powerUpId: string) => {
    if (gameState !== 'playing') return

    const effect = collectPowerUp(powerUpId)
    if (!effect) return

    soundEffects.playCollectSound()

    if (effect.type === 'timeExtension') {
      timeLeftRef.current = timeLeftRef.current + Math.floor(effect.value / 1000)
      setTimeLeft(Math.ceil(timeLeftRef.current))
    } else if (effect.type === 'extraFruits') {
      setFruits(prevFruits => {
        // 追加分も、いまある果物と重ならない位置に置く（docs/game-spec.md §3）
        const newFruits = generateFruits(effect.value, prevFruits, playAreaSizeRef.current)
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
    arcadeFruitsMoving,
    setPlayAreaSize,
    missHint,
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
