/**
 * useGamification.resetOperationRecords（先生・保護者むけ せいこう率の「きろくを けす」）
 *
 * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
 * |---|---|---|---|---|
 * | UGR-N-01 | 保存済みの累計・前回・星・バッジ | Equivalence – normal | 累計0・前回 null・前回比較 null。localStorage も同じ。星とバッジは残る | - |
 * | UGR-N-02 | 消したあとに1回遊ぶ | Equivalence – normal | 累計は0から数え直す | - |
 * | UGR-B-01 | 何も保存されていない | Boundary – 0 / NULL | エラーなし、既定のまま | - |
 * | UGR-A-01 | localStorage.setItem が投げる | 外部依存の失敗 | 画面の記録は消え、例外は外に出ない | クォータ超過など |
 * | UGR-A-02 | 壊れた保存データ | Invalid format | エラーなし、0のまま保存し直す | - |
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGamification } from '../useGamification'
import { GAMIFICATION_STORAGE_KEY, GAMIFICATION_SAVE_VERSION } from '@/types/gamification'
import { createDefaultCumulativeStats, createEmptySessionStats } from '@/lib/gamificationManager'

const saved = {
  stageStars: { 1: 3 },
  badges: { earnedBadges: ['clickMaster'], earnedAt: { clickMaster: 1 } },
  cumulativeStats: {
    click: { totalSuccess: 120, totalFail: 10 }, doubleClick: { totalSuccess: 5, totalFail: 15 },
    rightClick: { totalSuccess: 0, totalFail: 0 }, drop: { totalSuccess: 0, totalFail: 0 },
  },
  lastSessionStats: {
    click: { success: 4, fail: 0 }, doubleClick: { success: 1, fail: 3 },
    rightClick: { success: 0, fail: 0 }, drop: { success: 0, fail: 0 },
  },
  version: GAMIFICATION_SAVE_VERSION,
}

const stored = () => JSON.parse(localStorage.getItem(GAMIFICATION_STORAGE_KEY) ?? 'null')

describe('useGamification.resetOperationRecords', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  const hydrated = async () => {
    const hook = renderHook(() => useGamification())
    await waitFor(() => expect(hook.result.current.isHydrated).toBe(true))
    return hook
  }

  it('UGR-N-01: 操作の記録を消して保存し、星とバッジは残す', async () => {
    // Given: 記録・星・バッジを保存済み。1回遊んで前回比較もある
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(saved))
    const { result } = await hydrated()
    act(() => result.current.commitSession(2, 1, createEmptySessionStats()))
    expect(result.current.previousSessionStats).not.toBeNull()
    // When: 記録を消す
    act(() => result.current.resetOperationRecords())
    // Then: 画面も保存も0、星とバッジは残る
    expect(result.current.cumulativeStats).toEqual(createDefaultCumulativeStats())
    expect(result.current.lastSessionStats).toBeNull()
    expect(result.current.previousSessionStats).toBeNull()
    expect(stored().cumulativeStats).toEqual(createDefaultCumulativeStats())
    expect(stored().lastSessionStats).toBeNull()
    expect(result.current.stageStars[1]).toBe(3)
    expect(result.current.earnedBadges).toEqual(['clickMaster'])
    expect(stored().badges.earnedBadges).toEqual(['clickMaster'])
  })

  it('UGR-N-02: 消したあとに遊ぶと 0 から数え直す', async () => {
    // Given: 記録を消した
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(saved))
    const { result } = await hydrated()
    act(() => result.current.resetOperationRecords())
    // When: クリック 2回成功で1回遊ぶ
    const s = createEmptySessionStats()
    s.click.success = 2
    act(() => result.current.commitSession(1, 1, s))
    // Then: 累計はクリック 2
    expect(result.current.cumulativeStats.click).toEqual({ totalSuccess: 2, totalFail: 0 })
  })

  it('UGR-B-01: 何も保存されていなくても消せる', async () => {
    // Given: 保存なし When: 消す Then: エラーなし、0 のまま
    const { result } = await hydrated()
    expect(() => act(() => result.current.resetOperationRecords())).not.toThrow()
    expect(result.current.cumulativeStats).toEqual(createDefaultCumulativeStats())
    expect(result.current.lastSessionStats).toBeNull()
  })

  it('UGR-A-01: 保存に失敗しても画面の記録は消え、例外は出ない', async () => {
    // Given: 記録あり、localStorage.setItem が失敗する
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(saved))
    const { result } = await hydrated()
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError') })
    // When: 消す
    expect(() => act(() => result.current.resetOperationRecords())).not.toThrow()
    // Then: 画面上は0
    expect(result.current.cumulativeStats).toEqual(createDefaultCumulativeStats())
  })

  it('UGR-A-02: 保存データが壊れていても消せて、0 で保存し直す', async () => {
    // Given: 壊れた JSON When: 消す Then: 0 の正しいデータで保存
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, '{broken')
    const { result } = await hydrated()
    act(() => result.current.resetOperationRecords())
    expect(stored().cumulativeStats).toEqual(createDefaultCumulativeStats())
  })
})
