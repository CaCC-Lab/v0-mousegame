import {
  getComboMultiplier,
  isComboExpired,
  calculateArcadePoints,
  gainFeverGauge,
  drainFeverGauge,
  isFeverReady,
  getRank,
  getRankProgress,
  isNewBest,
} from '@/lib/arcadeManager'
import { ARCADE_CONFIG, RANK_TIERS } from '@/types/arcade'

describe('arcadeManager - コンボ倍率', () => {
  it('コンボ0〜2は等倍', () => {
    expect(getComboMultiplier(0)).toBe(1)
    expect(getComboMultiplier(1)).toBe(1)
    expect(getComboMultiplier(2)).toBe(1)
  })

  it('コンボが伸びるほど倍率が上がる', () => {
    expect(getComboMultiplier(3)).toBe(2)
    expect(getComboMultiplier(5)).toBe(2)
    expect(getComboMultiplier(6)).toBe(3)
    expect(getComboMultiplier(9)).toBe(3)
    expect(getComboMultiplier(10)).toBe(4)
    expect(getComboMultiplier(14)).toBe(4)
    expect(getComboMultiplier(15)).toBe(5)
  })

  it('最大倍率で頭打ちになる', () => {
    expect(getComboMultiplier(100)).toBe(5)
  })

  it('倍率は単調非減少', () => {
    let prev = 0
    for (let i = 0; i <= 30; i++) {
      const m = getComboMultiplier(i)
      expect(m).toBeGreaterThanOrEqual(prev)
      prev = m
    }
  })
})

describe('arcadeManager - コンボ持続時間', () => {
  it('猶予時間内なら継続する', () => {
    expect(isComboExpired(1000, 1000 + ARCADE_CONFIG.comboTimeoutMs - 1)).toBe(false)
  })

  it('猶予時間を超えたら切れる', () => {
    expect(isComboExpired(1000, 1000 + ARCADE_CONFIG.comboTimeoutMs + 1)).toBe(true)
  })

  it('まだ1度も収穫していない場合は切れていない扱い', () => {
    expect(isComboExpired(0, 999999)).toBe(false)
  })
})

describe('arcadeManager - スコア計算', () => {
  it('コンボ倍率が乗る', () => {
    expect(calculateArcadePoints(10, 1, false)).toBe(10)
    expect(calculateArcadePoints(10, 3, false)).toBe(30)
  })

  it('フィーバー中はさらに倍率が乗る', () => {
    expect(calculateArcadePoints(10, 1, true)).toBe(10 * ARCADE_CONFIG.feverScoreMultiplier)
    expect(calculateArcadePoints(10, 3, true)).toBe(30 * ARCADE_CONFIG.feverScoreMultiplier)
  })

  it('端数は切り捨てて整数を返す', () => {
    const points = calculateArcadePoints(15, 2, true)
    expect(Number.isInteger(points)).toBe(true)
  })

  it('基礎点0なら0点', () => {
    expect(calculateArcadePoints(0, 5, true)).toBe(0)
  })
})

describe('arcadeManager - フィーバーゲージ', () => {
  it('収穫でゲージが増える', () => {
    expect(gainFeverGauge(0, 1)).toBeGreaterThan(0)
  })

  it('コンボ倍率が高いほど多く増える', () => {
    expect(gainFeverGauge(0, 5)).toBeGreaterThan(gainFeverGauge(0, 1))
  })

  it('最大値を超えない', () => {
    expect(gainFeverGauge(ARCADE_CONFIG.feverGaugeMax, 5)).toBe(ARCADE_CONFIG.feverGaugeMax)
  })

  it('満タンでフィーバー突入可能になる', () => {
    expect(isFeverReady(ARCADE_CONFIG.feverGaugeMax)).toBe(true)
    expect(isFeverReady(ARCADE_CONFIG.feverGaugeMax - 1)).toBe(false)
  })

  it('フィーバー中はゲージが時間で減る', () => {
    const drained = drainFeverGauge(ARCADE_CONFIG.feverGaugeMax, 1000)
    expect(drained).toBeLessThan(ARCADE_CONFIG.feverGaugeMax)
    expect(drained).toBeGreaterThan(0)
  })

  it('フィーバー継続時間ぶん経過すると0になる', () => {
    expect(drainFeverGauge(ARCADE_CONFIG.feverGaugeMax, ARCADE_CONFIG.feverDurationMs)).toBe(0)
  })

  it('ゲージは負にならない', () => {
    expect(drainFeverGauge(10, ARCADE_CONFIG.feverDurationMs * 10)).toBe(0)
  })
})

describe('arcadeManager - 段位', () => {
  it('0点はBronze', () => {
    expect(getRank(0)).toBe('bronze')
  })

  it('スコアに応じて段位が上がる', () => {
    const tiers = RANK_TIERS.map(t => getRank(t.minScore))
    expect(tiers).toEqual(RANK_TIERS.map(t => t.id))
  })

  it('最高段位で頭打ちになる', () => {
    const top = RANK_TIERS[RANK_TIERS.length - 1]
    expect(getRank(top.minScore * 100)).toBe(top.id)
  })

  it('しきい値の1点下は下位段位のまま', () => {
    const second = RANK_TIERS[1]
    expect(getRank(second.minScore - 1)).toBe(RANK_TIERS[0].id)
  })

  it('次段位までの残りスコアを返す', () => {
    const progress = getRankProgress(0)
    expect(progress.current).toBe('bronze')
    expect(progress.next).toBe(RANK_TIERS[1].id)
    expect(progress.pointsToNext).toBe(RANK_TIERS[1].minScore)
    expect(progress.ratio).toBe(0)
  })

  it('最高段位では次がnullで進捗は満タン', () => {
    const top = RANK_TIERS[RANK_TIERS.length - 1]
    const progress = getRankProgress(top.minScore + 500)
    expect(progress.next).toBeNull()
    expect(progress.pointsToNext).toBe(0)
    expect(progress.ratio).toBe(1)
  })

  it('進捗率は0〜1に収まる', () => {
    for (let score = 0; score <= 12000; score += 137) {
      const { ratio } = getRankProgress(score)
      expect(ratio).toBeGreaterThanOrEqual(0)
      expect(ratio).toBeLessThanOrEqual(1)
    }
  })
})

describe('arcadeManager - 自己ベスト', () => {
  it('ベスト超えを判定する', () => {
    expect(isNewBest(100, 90)).toBe(true)
  })

  it('同点は更新扱いにしない', () => {
    expect(isNewBest(100, 100)).toBe(false)
  })

  it('0点は自己ベスト更新にしない（プレイしていないのと区別する）', () => {
    expect(isNewBest(0, 0)).toBe(false)
  })
})
