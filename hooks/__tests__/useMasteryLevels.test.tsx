/**
 * Task 10.3 / design.md §10.3 — useGamification の masteryLevels / masteryProgress
 *
 * テスト観点表（抜粋）
 * | Case ID | Input | Expected |
 * |---------|-------|----------|
 * | TC-10.3 | cumulativeStats | masteryLevels / masteryProgress が derive される |
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useGamification } from '../useGamification'
import { GAMIFICATION_STORAGE_KEY } from '@/types/gamification'
import { createEmptySessionStats } from '@/lib/gamificationManager'
import * as gm from '@/lib/gamificationManager'
import type { CumulativeOperationStats } from '@/types/gamification'

type MasteryLevel = 1 | 2 | 3 | 4 | 5
type OperationMasteryData = {
  click: MasteryLevel
  doubleClick: MasteryLevel
  rightClick: MasteryLevel
  drop: MasteryLevel
}

type MasteryExports = {
  calculateAllMasteryLevels: (c: CumulativeOperationStats) => OperationMasteryData
}

const { calculateAllMasteryLevels } = gm as typeof gm & MasteryExports

type UseGamificationWithMastery = ReturnType<typeof useGamification> & {
  masteryLevels?: OperationMasteryData
  masteryProgress?: Record<
    'click' | 'doubleClick' | 'rightClick' | 'drop',
    { current: number; nextThreshold: number; remaining: number } | null
  >
}

describe('useGamification mastery (Task 10.3)', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('masteryLevels / masteryProgress が cumulativeStats から導出される', async () => {
    // Given: useGamification が永続化済み
    // When: commitSession で累計が変化
    // Then: masteryLevels が calculateAllMasteryLevels(cumulativeStats) と一致し、progress.current が累計成功と整合
    const { result } = renderHook(() => useGamification())
    await waitFor(() => expect(result.current.isHydrated).toBe(true))

    const extended = result.current as UseGamificationWithMastery

    expect(extended).toHaveProperty('masteryLevels')
    expect(extended).toHaveProperty('masteryProgress')

    const session = createEmptySessionStats()
    session.click.success = 25
    session.drop.success = 100

    act(() => {
      result.current.commitSession(1, 2, session)
      jest.runAllTimers()
    })

    expect(localStorage.getItem(GAMIFICATION_STORAGE_KEY)).toBeTruthy()

    const updated = result.current as UseGamificationWithMastery
    expect(updated.masteryLevels).toEqual(calculateAllMasteryLevels(result.current.cumulativeStats))

    const clickProg = updated.masteryProgress!.click
    expect(clickProg).not.toBeNull()
    expect(clickProg!.current).toBe(result.current.cumulativeStats.click.totalSuccess)
  })
})
