import { arcadeTimeGain, addHarvestTime, subtractMissTime, nextArcadeTarget } from '../arcadeManager'
import { ARCADE_CONFIG } from '@/types/arcade'

/**
 * チャレンジは「時間をかせぐ型」（v1.2 D1、docs/game-spec.md §4.2）。
 * 正しく取ると残り時間が増え、ミスで減る。上手なほど長く遊べる（チェックリスト 7-2）。
 * ベースライン: 腕前に関係なく全員 60 秒（docs/v1.2-plan.md §2）。
 */
describe('チャレンジの残り時間', () => {
  it('開始は 35 秒、ミスで 2 秒減る、上限 60 秒', () => {
    // 開始は計算で 30 秒としたが、実測で beginner が 56 秒と目標（60〜90 秒）を下回ったので 35 秒に決め直した（docs/v1.2-plan.md）
    expect(ARCADE_CONFIG.startTimeSec).toBe(35)
    expect(ARCADE_CONFIG.missPenaltySec).toBe(2)
    expect(ARCADE_CONFIG.maxTimeSec).toBe(60)
  })

  it('増える時間は 1.8 秒から、取った数が増えるほど減り、最低 0.3 秒', () => {
    expect(arcadeTimeGain(0)).toBeCloseTo(1.8)
    expect(arcadeTimeGain(50)).toBeCloseTo(1.3)
    expect(arcadeTimeGain(150)).toBeCloseTo(0.3)
    expect(arcadeTimeGain(1000)).toBeCloseTo(0.3)
    for (let n = 1; n < 200; n++) expect(arcadeTimeGain(n)).toBeLessThanOrEqual(arcadeTimeGain(n - 1))
  })

  it('正しく取ると増える。上限は超えない', () => {
    expect(addHarvestTime(20, 0)).toBeCloseTo(21.8)
    expect(addHarvestTime(59.5, 0)).toBe(60)
  })

  it('ミスで減る。0 より下にはならない', () => {
    expect(subtractMissTime(10)).toBe(8)
    expect(subtractMissTime(1)).toBe(0)
  })
})

/** 結果画面の「つぎは ◯てんを めざそう」（v1.2 D6） */
describe('nextArcadeTarget', () => {
  it('0点なら最初の目標 100 点', () => {
    expect(nextArcadeTarget(0, 0)).toBe(100)
  })

  it('ベスト（今回を含む）の 1.1 倍を 50 点単位で切り上げる', () => {
    expect(nextArcadeTarget(1000, 800)).toBe(1100)
    expect(nextArcadeTarget(800, 1000)).toBe(1100)
    expect(nextArcadeTarget(1234, 0)).toBe(1400)
    expect(nextArcadeTarget(30, 30)).toBe(50)
  })

  it('目標はいつも今回とベストより大きい', () => {
    for (const [score, best] of [[1, 1], [49, 0], [50, 50], [9999, 12000]]) {
      expect(nextArcadeTarget(score, best)).toBeGreaterThan(Math.max(score, best))
    }
  })
})
