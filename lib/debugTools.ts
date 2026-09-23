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

/**
 * 自動プレイの腕前（`?bot=`）。v1.2 計画のベースライン計測で「腕前ごとの遊ばれ方」を測るために使う。
 * 数値は仮置き。人の実測と比べて決め直してよい（決め直した値と理由は docs/v1.2-plan.md に残す）
 */
export type BotLevel = 'beginner' | 'normal' | 'expert'

export const BOT_PROFILES: Record<BotLevel, { intervalMs: number; missRate: number }> = {
  /** 初めてマウスを触る子の想定: 1.5 秒に1回、5回に1回は操作をまちがえる */
  beginner: { intervalMs: 1500, missRate: 0.2 },
  /** 慣れてきた子の想定: 0.8 秒に1回、10回に1回まちがえる */
  normal: { intervalMs: 800, missRate: 0.1 },
  /** 上手な大人の上限の想定: 0.4 秒に1回、まちがえない（v1.1 の ?test=1 と同じ） */
  expert: { intervalMs: 400, missRate: 0 },
}

export interface DebugFlags {
  debug: boolean
  test: boolean
  bot: BotLevel
}

export function readDebugFlags(search: string): DebugFlags {
  const params = new URLSearchParams(search)
  const bot = params.get('bot')
  return {
    debug: params.get('debug') === '1',
    test: params.get('test') === '1',
    bot: bot === 'beginner' || bot === 'normal' ? bot : 'expert',
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

const ALL_ACTIONS: readonly InteractionType[] = ['click', 'doubleClick', 'rightClick', 'drop']

/**
 * 自動プレイの次の1手。その順番の種類が畑に無ければ、ある種類で代わりに取る。
 * missRate を渡すと、その割合でまちがった操作を選ぶ（random は 0 以上 1 未満を返す関数）
 */
export function chooseAutoPlayMove(
  fruits: readonly Fruit[],
  step: number,
  options: { missRate?: number; random?: () => number } = {}
): { fruit: Fruit; action: InteractionType } | null {
  if (fruits.length === 0) return null
  const { missRate = 0, random = Math.random } = options
  const wanted = AUTOPLAY_ORDER[step % AUTOPLAY_ORDER.length]
  const fruit = fruits.find((f) => f.type === wanted) ?? fruits[0]
  const correct = getRequiredInteraction(fruit.type)
  if (missRate > 0 && random() < missRate) {
    const wrong = ALL_ACTIONS.filter((a) => a !== correct)
    return { fruit, action: wrong[step % wrong.length] }
  }
  return { fruit, action: correct }
}
