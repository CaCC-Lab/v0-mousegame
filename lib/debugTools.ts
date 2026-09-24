/**
 * 検証用の入口（v1.1 計画 G12、docs/game-spec.md §10）。
 *
 * - `?debug=1`: 画面の隅に診断を出す。スマホやヘッドレスでは開発者ツールが開けないので、
 *   「いま何が起きているか」を画面で読めるようにする（出荷前チェックリスト 3-3・6-5）
 * - `?test=1`: 自動プレイ。人が遊ばなくても、4つの操作と結果画面までを通す
 *
 * 遊ぶ人には影響しない（URL で指定したときだけ動く）。
 */
import type { Fruit, FruitType, InteractionType } from '@/types/game'
import { getRequiredInteraction, isValidHarvestAction } from './gameLogic'

export interface DebugFlags {
  debug: boolean
  test: boolean
}

export function readDebugFlags(search: string): DebugFlags {
  const params = new URLSearchParams(search)
  return {
    debug: params.get('debug') === '1',
    test: params.get('test') === '1',
  }
}

export interface DebugStats {
  successes: Record<InteractionType, number>
  misses: number
  last: { fruitType: FruitType; action: InteractionType; ok: boolean } | null
}

export function createDebugStats(): DebugStats {
  return {
    successes: { click: 0, doubleClick: 0, rightClick: 0, drop: 0 },
    misses: 0,
    last: null,
  }
}

export function recordInteraction(stats: DebugStats, fruitType: FruitType, action: InteractionType): DebugStats {
  const ok = isValidHarvestAction(fruitType, action)
  return {
    successes: ok ? { ...stats.successes, [action]: stats.successes[action] + 1 } : stats.successes,
    misses: ok ? stats.misses : stats.misses + 1,
    last: { fruitType, action, ok },
  }
}

/** 自動プレイで取る種類の順番。4つの操作をかならず一巡する */
export const AUTOPLAY_ORDER: readonly FruitType[] = ['apple', 'blueberry', 'lemon', 'watermelon']

/** 自動プレイの1手の間隔（ミリ秒） */
export const AUTOPLAY_INTERVAL_MS = 400

/** 自動プレイの次の1手。その順番の種類が畑に無ければ、ある種類で代わりに取る */
export function chooseAutoPlayMove(
  fruits: readonly Fruit[],
  step: number
): { fruit: Fruit; action: InteractionType } | null {
  if (fruits.length === 0) return null
  const wanted = AUTOPLAY_ORDER[step % AUTOPLAY_ORDER.length]
  const fruit = fruits.find((f) => f.type === wanted) ?? fruits[0]
  return { fruit, action: getRequiredInteraction(fruit.type) }
}
