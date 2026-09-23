import {
  readDebugFlags,
  createDebugStats,
  recordInteraction,
  chooseAutoPlayMove,
  AUTOPLAY_ORDER,
  AUTOPLAY_INTERVAL_MS,
  BOT_PROFILES,
} from '../debugTools'
import type { Fruit } from '@/types/game'

/**
 * 検証用の入口（v1.1 計画 G12、docs/game-spec.md §10、チェックリスト 3-3）。
 * `?debug=1` で画面に診断を出し、`?test=1` で自動プレイする。
 */
describe('readDebugFlags', () => {
  it('?debug=1 と ?test=1 を読む', () => {
    expect(readDebugFlags('?debug=1')).toMatchObject({ debug: true, test: false })
    expect(readDebugFlags('?test=1&lang=ja')).toMatchObject({ debug: false, test: true })
    expect(readDebugFlags('?test=1&debug=1')).toMatchObject({ debug: true, test: true })
  })

  it('指定が無い・1 以外なら無効', () => {
    expect(readDebugFlags('')).toMatchObject({ debug: false, test: false })
    expect(readDebugFlags('?debug=0&test=yes')).toMatchObject({ debug: false, test: false })
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

/**
 * 自動プレイの腕前（v1.2 計画のベースライン計測用）。
 * `?test=1&bot=beginner|normal|expert`。指定なしは expert（これまでどおり：0.4 秒ごと・ミスなし）
 */
describe('自動プレイの腕前', () => {
  const fruit = (id: number, type: Fruit['type']): Fruit => ({ id, type, size: 'medium', x: 10, y: 10, dx: 0, dy: 0 })
  const field = [fruit(1, 'apple'), fruit(2, 'blueberry'), fruit(3, 'lemon'), fruit(4, 'watermelon')]

  it('?bot= を読む。指定なし・不明な値は expert', () => {
    expect(readDebugFlags('?test=1&bot=beginner').bot).toBe('beginner')
    expect(readDebugFlags('?test=1&bot=normal').bot).toBe('normal')
    expect(readDebugFlags('?test=1').bot).toBe('expert')
    expect(readDebugFlags('?test=1&bot=wizard').bot).toBe('expert')
  })

  it('腕前ごとに間隔とミス率が違い、上手なほど速くミスが少ない', () => {
    expect(BOT_PROFILES.beginner.intervalMs).toBeGreaterThan(BOT_PROFILES.normal.intervalMs)
    expect(BOT_PROFILES.normal.intervalMs).toBeGreaterThan(BOT_PROFILES.expert.intervalMs)
    expect(BOT_PROFILES.beginner.missRate).toBeGreaterThan(BOT_PROFILES.normal.missRate)
    expect(BOT_PROFILES.expert.missRate).toBe(0)
    expect(BOT_PROFILES.expert.intervalMs).toBe(AUTOPLAY_INTERVAL_MS)
  })

  it('ミス率に応じて、まちがった操作を選ぶ（乱数を渡して決める）', () => {
    const correct = chooseAutoPlayMove(field, 0, { missRate: 0.5, random: () => 0.9 })!
    expect(correct.action).toBe('click') // りんご＝クリック（0.9 ≥ 0.5 なので正しい操作）
    const wrong = chooseAutoPlayMove(field, 0, { missRate: 0.5, random: () => 0.1 })!
    expect(wrong.fruit.type).toBe('apple')
    expect(wrong.action).not.toBe('click')
  })
})
