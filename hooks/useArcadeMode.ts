import { useState, useCallback, useRef, useEffect } from 'react'
import {
  getComboMultiplier,
  calculateArcadePoints,
  gainFeverGauge,
  isFeverReady,
  getRank,
  getRankProgress,
  isNewBest,
} from '@/lib/arcadeManager'
import { ARCADE_CONFIG, ArcadeResult, RankProgress, RankTierId } from '@/types/arcade'
import { useLocalStorage } from './useLocalStorage'

/** 残り時間の更新間隔。ゲージ表示は CSS 側で補間するのでこの粒度で足りる */
const TICK_MS = 100

export interface HarvestBonus {
  /** この収穫に適用されたコンボ倍率 */
  comboMultiplier: number
  /** この収穫がフィーバー中だったか */
  isFever: boolean
  /** この収穫を含めたコンボ数 */
  combo: number
}

export interface UseArcadeModeReturn {
  combo: number
  comboMultiplier: number
  maxCombo: number
  feverGauge: number
  isFever: boolean
  feverCount: number
  best: number
  rank: RankTierId
  rankProgress: RankProgress
  registerHarvest: () => HarvestBonus
  registerMiss: () => void
  commitResult: (score: number) => ArcadeResult
  reset: () => void
}

interface ArcadeSnapshot {
  combo: number
  maxCombo: number
  feverGauge: number
  isFever: boolean
  feverCount: number
}

const INITIAL_SNAPSHOT: ArcadeSnapshot = {
  combo: 0,
  maxCombo: 0,
  feverGauge: 0,
  isFever: false,
  feverCount: 0,
}

function isSameSnapshot(a: ArcadeSnapshot, b: ArcadeSnapshot): boolean {
  return a.combo === b.combo
    && a.maxCombo === b.maxCombo
    && a.feverGauge === b.feverGauge
    && a.isFever === b.isFever
    && a.feverCount === b.feverCount
}

/**
 * アーケードモード（60秒スコアアタック）のコンボ・フィーバー・自己ベストを管理する。
 *
 * 収穫の瞬間に「今回いくら倍か」を返す必要があるため、内部の真値は ref に持ち、
 * 表示用に state へ写している（React の非同期更新で1手遅れないようにするため）。
 *
 * 残り時間は実時計ではなく「残りミリ秒のカウントダウン」で持つ。
 * こうしておくとポーズ中に時間が進まず、席を離れた子どもがコンボを損しない。
 *
 * @param isRunning ゲームが進行中か（false の間はコンボもフィーバーも減らない）
 */
export function useArcadeMode(isRunning: boolean): UseArcadeModeReturn {
  const [best, setBest] = useLocalStorage('fruitHarvestArcadeBest', 0)
  const [snapshot, setSnapshot] = useState<ArcadeSnapshot>(INITIAL_SNAPSHOT)

  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const comboRemainingRef = useRef(0)
  const gaugeRef = useRef(0)
  const isFeverRef = useRef(false)
  const feverRemainingRef = useRef(0)
  const feverCountRef = useRef(0)
  const bestRef = useRef(best)

  useEffect(() => { bestRef.current = best }, [best])

  const sync = useCallback(() => {
    const next: ArcadeSnapshot = {
      combo: comboRef.current,
      maxCombo: maxComboRef.current,
      feverGauge: gaugeRef.current,
      isFever: isFeverRef.current,
      feverCount: feverCountRef.current,
    }
    setSnapshot(prev => (isSameSnapshot(prev, next) ? prev : next))
  }, [])

  const registerHarvest = useCallback((): HarvestBonus => {
    const combo = comboRef.current + 1
    comboRef.current = combo
    comboRemainingRef.current = ARCADE_CONFIG.comboTimeoutMs

    if (combo > maxComboRef.current) {
      maxComboRef.current = combo
    }

    const comboMultiplier = getComboMultiplier(combo)
    const isFever = isFeverRef.current

    // フィーバー中はゲージが減っていく最中なので、溜め直しはしない
    if (!isFever) {
      gaugeRef.current = gainFeverGauge(gaugeRef.current, comboMultiplier)

      if (isFeverReady(gaugeRef.current)) {
        isFeverRef.current = true
        feverRemainingRef.current = ARCADE_CONFIG.feverDurationMs
        feverCountRef.current += 1
      }
    }

    sync()

    return { comboMultiplier, isFever, combo }
  }, [sync])

  const registerMiss = useCallback(() => {
    comboRef.current = 0
    comboRemainingRef.current = 0
    sync()
  }, [sync])

  const commitResult = useCallback((score: number): ArcadeResult => {
    const previousBest = bestRef.current
    const updated = isNewBest(score, previousBest)
    const nextBest = updated ? score : previousBest

    if (updated) {
      bestRef.current = score
      setBest(score)
    }

    return {
      score,
      best: nextBest,
      isNewBest: updated,
      maxCombo: maxComboRef.current,
      feverCount: feverCountRef.current,
      // 段位は「自己ベストに対する称号」として扱う
      rank: getRank(nextBest),
    }
  }, [setBest])

  const reset = useCallback(() => {
    comboRef.current = 0
    maxComboRef.current = 0
    comboRemainingRef.current = 0
    gaugeRef.current = 0
    isFeverRef.current = false
    feverRemainingRef.current = 0
    feverCountRef.current = 0
    setSnapshot(INITIAL_SNAPSHOT)
  }, [])

  // コンボの猶予とフィーバーの残り時間を進める
  useEffect(() => {
    if (!isRunning) return

    const timer = setInterval(() => {
      let changed = false

      if (comboRef.current > 0) {
        comboRemainingRef.current -= TICK_MS
        if (comboRemainingRef.current <= 0) {
          comboRef.current = 0
          comboRemainingRef.current = 0
          changed = true
        }
      }

      if (isFeverRef.current) {
        feverRemainingRef.current -= TICK_MS
        if (feverRemainingRef.current <= 0) {
          isFeverRef.current = false
          feverRemainingRef.current = 0
          gaugeRef.current = 0
        } else {
          gaugeRef.current = ARCADE_CONFIG.feverGaugeMax
            * (feverRemainingRef.current / ARCADE_CONFIG.feverDurationMs)
        }
        changed = true
      }

      if (changed) sync()
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [isRunning, sync])

  return {
    combo: snapshot.combo,
    comboMultiplier: getComboMultiplier(snapshot.combo),
    maxCombo: snapshot.maxCombo,
    feverGauge: snapshot.feverGauge,
    isFever: snapshot.isFever,
    feverCount: snapshot.feverCount,
    best,
    rank: getRank(best),
    rankProgress: getRankProgress(best),
    registerHarvest,
    registerMiss,
    commitResult,
    reset,
  }
}

/** アーケードの獲得点数（フックの外からも使えるよう再輸出） */
export { calculateArcadePoints }
