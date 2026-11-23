/**
 * clearOperationRecords: せいこう率の記録（操作ごとの累計と前回）だけを消す。
 *
 * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
 * |---|---|---|---|---|
 * | COR-N-01 | 累計・前回・星・バッジあり | Equivalence – normal | 累計は全操作0、前回は null。星・バッジ・version は残る | - |
 * | COR-A-01 | 入力オブジェクト | 不変性 | 入力は書き換えない | 呼び出し元の state を壊さない |
 * | COR-B-01 | 既定データ（記録0・前回 null） | Boundary – 0 / NULL | 既定データと同じ内容 | 何度押しても同じ |
 * | COR-A-02 | 2回続けて消す | 冪等 | 1回目と同じ結果 | - |
 */
import { clearOperationRecords, createDefaultCumulativeStats, createDefaultGamificationData } from '../gamificationManager'
import type { GamificationSaveData } from '@/types/gamification'

const filled = (): GamificationSaveData => ({
  stageStars: { 1: 3, 2: 1 },
  badges: { earnedBadges: ['clickMaster'], earnedAt: { clickMaster: 123 } },
  cumulativeStats: {
    click: { totalSuccess: 30, totalFail: 10 }, doubleClick: { totalSuccess: 5, totalFail: 15 },
    rightClick: { totalSuccess: 2, totalFail: 1 }, drop: { totalSuccess: 4, totalFail: 4 },
  },
  lastSessionStats: {
    click: { success: 4, fail: 0 }, doubleClick: { success: 1, fail: 3 },
    rightClick: { success: 0, fail: 0 }, drop: { success: 0, fail: 1 },
  },
  version: 1,
})

describe('clearOperationRecords', () => {
  it('COR-N-01: 操作の記録だけを消し、星とバッジは残す', () => {
    // Given: 記録・星・バッジがある
    const data = filled()
    // When: 消す
    const next = clearOperationRecords(data)
    // Then: 累計0・前回なし、星とバッジと version はそのまま
    expect(next.cumulativeStats).toEqual(createDefaultCumulativeStats())
    expect(next.lastSessionStats).toBeNull()
    expect(next.stageStars).toEqual({ 1: 3, 2: 1 })
    expect(next.badges).toEqual({ earnedBadges: ['clickMaster'], earnedAt: { clickMaster: 123 } })
    expect(next.version).toBe(1)
  })

  it('COR-A-01: 入力は書き換えない', () => {
    // Given: 記録がある When: 消す Then: 元のオブジェクトは同じ値のまま
    const data = filled()
    clearOperationRecords(data)
    expect(data).toEqual(filled())
  })

  it('COR-B-01: 記録0・前回 null なら既定データと同じ', () => {
    // Given: 既定データ When: 消す Then: 既定データと同じ内容
    expect(clearOperationRecords(createDefaultGamificationData())).toEqual(createDefaultGamificationData())
  })

  it('COR-A-02: 2回続けても結果は同じ', () => {
    // Given: 1回消した When: もう1回 Then: 同じ内容
    const once = clearOperationRecords(filled())
    expect(clearOperationRecords(once)).toEqual(once)
  })
})
