/**
 * Task 10.2 / design.md §10.1–10.2 / tasks.md 10.7（CP-8, CP-9）
 *
 * テスト観点表（抜粋）
 * | Case ID | Input / Precondition | Perspective | Expected | Notes |
 * |---------|----------------------|-------------|----------|-------|
 * | TC-10.2a | totalSuccess 境界 | Boundary | Lv 一致 | 0,9,10,30,60,99,100 |
 * | TC-10.2b | getProgressToNextLevel | 正常/境界 | remaining / null | Lv5 は null |
 * | TC-CP-8 | a≤b の totalSuccess | 単調性 | Lv 非減少 | - |
 * | TC-CP-9 | 同一 cumulativeStats | 決定性 | 同一 OperationMasteryData | - |
 */

import * as gm from '../gamificationManager'
import type { CumulativeOperationStats } from '@/types/gamification'

/** design §10.1（実装後は types/gamification から import） */
type MasteryLevel = 1 | 2 | 3 | 4 | 5
type OperationMasteryData = {
  click: MasteryLevel
  doubleClick: MasteryLevel
  rightClick: MasteryLevel
  drop: MasteryLevel
}

type MasteryExports = {
  calculateMasteryLevel: (totalSuccess: number) => MasteryLevel
  calculateAllMasteryLevels: (cumulativeStats: CumulativeOperationStats) => OperationMasteryData
  getProgressToNextLevel: (
    totalSuccess: number
  ) => { current: number; nextThreshold: number; remaining: number } | null
}

const {
  calculateMasteryLevel,
  calculateAllMasteryLevels,
  getProgressToNextLevel,
} = gm as typeof gm & MasteryExports

describe('mastery level (Task 10.2 / CP-8 / CP-9)', () => {
  describe('calculateMasteryLevel — 閾値境界（design §10.1 MASTERY_THRESHOLDS）', () => {
    it.each([
      // Given: totalSuccess / Then: 期待レベル（design §10.1）
      [0, 1],
      [9, 1],
      [10, 2],
      [30, 3],
      [60, 4],
      [99, 4],
      [100, 5],
    ] as const)('totalSuccess=%i → Lv%i', (totalSuccess, expected) => {
      // Given: 上表の累計成功数
      // When: calculateMasteryLevel(totalSuccess)
      // Then: 境界どおり
      expect(calculateMasteryLevel(totalSuccess)).toBe(expected)
    })
  })

  describe('getProgressToNextLevel', () => {
    it('残り回数が nextThreshold に向けて計算される', () => {
      // Given: Lv1 手前（0 成功）
      // When
      const p0 = getProgressToNextLevel(0)
      // Then
      expect(p0).toEqual({ current: 0, nextThreshold: 10, remaining: 10 })

      // Given: あと 1 回で Lv2
      expect(getProgressToNextLevel(9)).toEqual({ current: 9, nextThreshold: 10, remaining: 1 })

      // Given: Lv2 到達直後 → 次は 30
      expect(getProgressToNextLevel(10)).toEqual({ current: 10, nextThreshold: 30, remaining: 20 })

      // Given: Lv4 手前
      expect(getProgressToNextLevel(99)).toEqual({ current: 99, nextThreshold: 100, remaining: 1 })
    })

    it('Lv5（max）では null を返す', () => {
      // Given: マスター到達
      // When / Then
      expect(getProgressToNextLevel(100)).toBeNull()
      expect(getProgressToNextLevel(150)).toBeNull()
    })
  })

  describe('calculateAllMasteryLevels', () => {
    it('各操作の totalSuccess から熟達が導出される', () => {
      const c: CumulativeOperationStats = {
        click: { totalSuccess: 10, totalFail: 0 },
        doubleClick: { totalSuccess: 30, totalFail: 0 },
        rightClick: { totalSuccess: 0, totalFail: 0 },
        drop: { totalSuccess: 100, totalFail: 0 },
      }
      const all = calculateAllMasteryLevels(c)
      expect(all).toEqual({
        click: 2,
        doubleClick: 3,
        rightClick: 1,
        drop: 5,
      })
    })
  })

  describe('CP-8: 累計増加でレベルが減少しない', () => {
    it('totalSuccess 0〜200 の任意 a≤b で calculateMasteryLevel(b) >= calculateMasteryLevel(a)', () => {
      // Given: 任意の非負 a≤b
      // When / Then: レベルが単調非減少
      for (let a = 0; a <= 200; a++) {
        for (let b = a; b <= 200; b++) {
          const la = calculateMasteryLevel(a)
          const lb = calculateMasteryLevel(b)
          expect(lb).toBeGreaterThanOrEqual(la)
        }
      }
    })
  })

  describe('CP-9: 同じ cumulativeStats から同じレベルが導出される', () => {
    it('calculateAllMasteryLevels を同一オブジェクトで複数回呼んでも同じ結果', () => {
      // Given: 固定の累計統計
      // When: 同一参照で複数回
      // Then: 結果が同一
      const c: CumulativeOperationStats = {
        click: { totalSuccess: 42, totalFail: 1 },
        doubleClick: { totalSuccess: 7, totalFail: 0 },
        rightClick: { totalSuccess: 0, totalFail: 3 },
        drop: { totalSuccess: 15, totalFail: 0 },
      }
      const once = calculateAllMasteryLevels(c)
      const twice = calculateAllMasteryLevels(c)
      expect(twice).toEqual(once)
    })

    it('浅いコピーでも同じ値なら同じ結果', () => {
      // Given: 値が等しい別オブジェクト
      // When / Then: 導出結果が等しい
      const base: CumulativeOperationStats = {
        click: { totalSuccess: 5, totalFail: 0 },
        doubleClick: { totalSuccess: 5, totalFail: 0 },
        rightClick: { totalSuccess: 5, totalFail: 0 },
        drop: { totalSuccess: 5, totalFail: 0 },
      }
      const a = { ...base, click: { ...base.click } }
      const b = { ...base, click: { ...base.click } }
      expect(calculateAllMasteryLevels(a)).toEqual(calculateAllMasteryLevels(b))
    })
  })
})
