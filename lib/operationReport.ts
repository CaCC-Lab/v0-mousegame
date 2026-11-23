import type { FruitType, InteractionType } from '@/types/game'
import type { CumulativeOperationStats, SessionOperationStats } from '@/types/gamification'
import { getRequiredFruit } from '@/lib/gameLogic'

export const REPORT_OPERATIONS: readonly InteractionType[] = ['click', 'doubleClick', 'rightClick', 'drop']

export interface OperationTally {
  success: number
  fail: number
  attempts: number
  /** せいこう率（0〜100 の整数）。まだ1回もしていなければ null */
  rate: number | null
}

export interface OperationReportRow {
  operation: InteractionType
  fruit: FruitType
  total: OperationTally
  /** 最後に遊んだ1回。まだ遊んでいなければ null */
  last: OperationTally | null
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

/** 成功 ÷（成功＋ミス）を四捨五入した百分率。0回なら null（ゼロで割らない） */
export function successRate(success: number, fail: number): number | null {
  const s = count(success)
  const attempts = s + count(fail)
  return attempts === 0 ? null : Math.round((s / attempts) * 100)
}

function tally(success: unknown, fail: unknown): OperationTally {
  const s = count(success)
  const f = count(fail)
  return { success: s, fail: f, attempts: s + f, rate: successRate(s, f) }
}

/** 先生・保護者むけに、操作ごとの累計と前回のせいこう率をならべる。壊れた保存データは0回として扱う */
export function buildOperationReport(
  cumulative: CumulativeOperationStats | null | undefined,
  lastSession: SessionOperationStats | null | undefined
): OperationReportRow[] {
  return REPORT_OPERATIONS.map(operation => {
    const total = cumulative?.[operation]
    const last = lastSession?.[operation]
    return {
      operation,
      fruit: getRequiredFruit(operation),
      total: tally(total?.totalSuccess, total?.totalFail),
      last: lastSession ? tally(last?.success, last?.fail) : null,
    }
  })
}
