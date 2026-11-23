/**
 * 先生・保護者むけの「そうさごとの せいこう率」（docs/game-spec.md §5）。
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---|---|---|---|---|
 * | OR-N-01 | 成功 3・ミス 1 | Equivalence – normal | 75% | - |
 * | OR-N-02 | 成功 2・ミス 1 | Equivalence – 端数 | 67%（四捨五入） | - |
 * | OR-N-03 | 成功 5・ミス 0 | Boundary – 最大 | 100% | - |
 * | OR-N-04 | 成功 0・ミス 4 | Boundary – 最小 | 0% | - |
 * | OR-N-05 | 累計と前回 | Equivalence – normal | 4操作の行を固定順で返す | - |
 * | OR-A-01 | 成功 0・ミス 0 | Boundary – 0（ゼロ除算） | null（まだ記録なし） | - |
 * | OR-A-02 | 負の数・NaN・Infinity | Invalid | 0 として数える | 壊れた保存データ |
 * | OR-A-03 | 前回が null | Boundary – NULL | 前回の列は null | 初回 |
 * | OR-A-04 | 操作が欠けたデータ | Invalid format | 欠けた操作は 0 回 | 古い保存データ |
 * | OR-A-05 | 成功 1・ミス 1 | Boundary – 0.5 | 50% | - |
 */
import { buildOperationReport, successRate } from '../operationReport'
import type { CumulativeOperationStats, SessionOperationStats } from '@/types/gamification'

const cumulative = (c: [number, number], d: [number, number], r: [number, number], dr: [number, number]): CumulativeOperationStats => ({
  click: { totalSuccess: c[0], totalFail: c[1] },
  doubleClick: { totalSuccess: d[0], totalFail: d[1] },
  rightClick: { totalSuccess: r[0], totalFail: r[1] },
  drop: { totalSuccess: dr[0], totalFail: dr[1] },
})

describe('successRate', () => {
  it('OR-N-01: 成功3・ミス1は75%', () => {
    // Given: 3/4 When: 計算 Then: 75
    expect(successRate(3, 1)).toBe(75)
  })
  it('OR-N-02: 成功2・ミス1は67%（四捨五入）', () => {
    // Given: 2/3 When: 計算 Then: 67
    expect(successRate(2, 1)).toBe(67)
  })
  it('OR-N-03: ミス0なら100%', () => {
    // Given: 5/5 When: 計算 Then: 100
    expect(successRate(5, 0)).toBe(100)
  })
  it('OR-N-04: 成功0なら0%', () => {
    // Given: 0/4 When: 計算 Then: 0
    expect(successRate(0, 4)).toBe(0)
  })
  it('OR-A-05: 成功1・ミス1は50%', () => {
    // Given: 1/2 When: 計算 Then: 50
    expect(successRate(1, 1)).toBe(50)
  })
  it('OR-A-01: 0回なら null（ゼロで割らない）', () => {
    // Given: 0/0 When: 計算 Then: null
    expect(successRate(0, 0)).toBeNull()
  })
  it('OR-A-02: 負の数・NaN・Infinity は0として数える', () => {
    // Given: 壊れた値 When: 計算 Then: 0 として扱う
    expect(successRate(-3, 1)).toBe(0)
    expect(successRate(2, -5)).toBe(100)
    expect(successRate(Number.NaN, Number.NaN)).toBeNull()
    expect(successRate(Number.POSITIVE_INFINITY, 1)).toBe(0)
  })
})

describe('buildOperationReport', () => {
  it('OR-N-05: 4操作を固定の順で、累計と前回をならべる', () => {
    // Given: 累計と前回 When: 組み立て Then: click→doubleClick→rightClick→drop、果物と率つき
    const last: SessionOperationStats = {
      click: { success: 4, fail: 0 }, doubleClick: { success: 1, fail: 3 },
      rightClick: { success: 0, fail: 0 }, drop: { success: 2, fail: 2 },
    }
    const rows = buildOperationReport(cumulative([30, 10], [5, 15], [0, 0], [9, 1]), last)
    expect(rows.map(r => r.operation)).toEqual(['click', 'doubleClick', 'rightClick', 'drop'])
    expect(rows.map(r => r.fruit)).toEqual(['apple', 'blueberry', 'lemon', 'watermelon'])
    expect(rows[0].total).toEqual({ success: 30, fail: 10, attempts: 40, rate: 75 })
    expect(rows[1].total.rate).toBe(25)
    expect(rows[2].total).toEqual({ success: 0, fail: 0, attempts: 0, rate: null })
    expect(rows[1].last).toEqual({ success: 1, fail: 3, attempts: 4, rate: 25 })
    expect(rows[2].last?.rate).toBeNull()
  })
  it('OR-A-03: 前回が無ければ前回の列は null', () => {
    // Given: lastSession=null When: 組み立て Then: last は null
    const rows = buildOperationReport(cumulative([1, 0], [0, 0], [0, 0], [0, 0]), null)
    expect(rows.every(r => r.last === null)).toBe(true)
  })
  it('OR-A-04: 操作が欠けた古いデータでも 0 回として出す', () => {
    // Given: doubleClick が無い累計 When: 組み立て Then: 0回・null
    const broken = { click: { totalSuccess: 2, totalFail: 0 } } as unknown as CumulativeOperationStats
    const rows = buildOperationReport(broken, undefined)
    expect(rows[1].total).toEqual({ success: 0, fail: 0, attempts: 0, rate: null })
    expect(rows[0].total.rate).toBe(100)
  })
})
