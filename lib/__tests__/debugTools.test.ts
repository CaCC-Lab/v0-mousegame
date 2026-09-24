import {
  readDebugFlags,
  createDebugStats,
  recordInteraction,
  chooseAutoPlayMove,
  AUTOPLAY_ORDER,
} from '../debugTools'
import type { Fruit } from '@/types/game'

/**
 * 検証用の入口（v1.1 計画 G12、docs/game-spec.md §10、チェックリスト 3-3）。
 * `?debug=1` で画面に診断を出し、`?test=1` で自動プレイする。
 */
describe('readDebugFlags', () => {
  it('?debug=1 と ?test=1 を読む', () => {
    expect(readDebugFlags('?debug=1')).toEqual({ debug: true, test: false })
    expect(readDebugFlags('?test=1&lang=ja')).toEqual({ debug: false, test: true })
    expect(readDebugFlags('?test=1&debug=1')).toEqual({ debug: true, test: true })
  })

  it('指定が無い・1 以外なら無効', () => {
    expect(readDebugFlags('')).toEqual({ debug: false, test: false })
    expect(readDebugFlags('?debug=0&test=yes')).toEqual({ debug: false, test: false })
  })
})

describe('recordInteraction', () => {
  it('正しい操作は操作ごとの成功に、まちがいはミスに数え、最後の入力を残す', () => {
    let stats = createDebugStats()
    stats = recordInteraction(stats, 'apple', 'click')
    stats = recordInteraction(stats, 'lemon', 'click')
    stats = recordInteraction(stats, 'watermelon', 'drop')

    expect(stats.successes).toEqual({ click: 1, doubleClick: 0, rightClick: 0, drop: 1 })
    expect(stats.misses).toBe(1)
    expect(stats.last).toEqual({ fruitType: 'watermelon', action: 'drop', ok: true })
  })

  it('元の集計を書き換えない', () => {
    const before = createDebugStats()
    recordInteraction(before, 'apple', 'click')
    expect(before.successes.click).toBe(0)
  })
})

describe('chooseAutoPlayMove', () => {
  const fruit = (id: number, type: Fruit['type']): Fruit => ({ id, type, size: 'medium', x: 10, y: 10, dx: 0, dy: 0 })

  it('4つの操作を順番に使う（自動プレイで全操作を通すため）', () => {
    const field = [fruit(1, 'apple'), fruit(2, 'blueberry'), fruit(3, 'lemon'), fruit(4, 'watermelon')]
    const actions = AUTOPLAY_ORDER.map((_, step) => chooseAutoPlayMove(field, step)!.action)
    expect(new Set(actions)).toEqual(new Set(['click', 'doubleClick', 'rightClick', 'drop']))
  })

  it('選んだ果物に正しい操作を返す', () => {
    const field = [fruit(1, 'apple'), fruit(2, 'blueberry'), fruit(3, 'lemon'), fruit(4, 'watermelon')]
    for (let step = 0; step < 8; step++) {
      const move = chooseAutoPlayMove(field, step)!
      const expected = { apple: 'click', blueberry: 'doubleClick', lemon: 'rightClick', watermelon: 'drop' }[move.fruit.type]
      expect(move.action).toBe(expected)
    }
  })

  it('その順番の種類が畑に無ければ、ある種類で代わりに取る。畑が空なら null', () => {
    expect(chooseAutoPlayMove([fruit(1, 'lemon')], 0)).toEqual({ fruit: fruit(1, 'lemon'), action: 'rightClick' })
    expect(chooseAutoPlayMove([], 0)).toBeNull()
  })
})
