import { getNextFocusOperation } from '../gamificationManager'
import type { SessionOperationStats } from '@/types/gamification'

/**
 * 「次は何を練習すればいいか」を1つ選ぶ（プレイテストの指摘への対応）。
 *
 * 「練習結果も星0個で『Here is your practice record』だけ。
 * 　何がダメだったか言われないのに減点される感じ」
 *
 * 責める代わりに、次にやることを1つだけ示す。
 */
const stats = (o: Partial<Record<keyof SessionOperationStats, { success: number; fail: number }>> = {}): SessionOperationStats => ({
  click: { success: 0, fail: 0 },
  doubleClick: { success: 0, fail: 0 },
  rightClick: { success: 0, fail: 0 },
  drop: { success: 0, fail: 0 },
  ...o,
})

describe('getNextFocusOperation', () => {
  it('何もしていないなら、いちばん基本のクリックを勧める', () => {
    expect(getNextFocusOperation(stats())).toBe('click')
  })

  it('まだ一度も成功していない操作を勧める（基本の順に）', () => {
    const s = stats({ click: { success: 5, fail: 0 } })

    expect(getNextFocusOperation(s)).toBe('doubleClick')
  })

  it('クリックとダブルクリックができていれば右クリックを勧める', () => {
    const s = stats({
      click: { success: 3, fail: 0 },
      doubleClick: { success: 2, fail: 0 },
    })

    expect(getNextFocusOperation(s)).toBe('rightClick')
  })

  it('全部成功していれば、いちばん失敗が多かった操作を勧める', () => {
    const s = stats({
      click: { success: 5, fail: 1 },
      doubleClick: { success: 2, fail: 4 },
      rightClick: { success: 1, fail: 2 },
      drop: { success: 1, fail: 0 },
    })

    expect(getNextFocusOperation(s)).toBe('doubleClick')
  })

  it('全部成功していて失敗も無ければ、基本のクリックに戻す', () => {
    const s = stats({
      click: { success: 5, fail: 0 },
      doubleClick: { success: 5, fail: 0 },
      rightClick: { success: 5, fail: 0 },
      drop: { success: 5, fail: 0 },
    })

    expect(getNextFocusOperation(s)).toBe('click')
  })
})
