import type {
  DailyGoal,
  DailyPracticeData,
  DateString,
  PracticeStampData,
  SessionOperationStats,
} from '@/types/gamification'
import { DAILY_PRACTICE_STORAGE_KEY, DAILY_PRACTICE_VERSION } from '@/types/gamification'

export { DAILY_PRACTICE_STORAGE_KEY, DAILY_PRACTICE_VERSION }

export function getTodayString(now?: Date): DateString {
  const d = now ?? new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function createDefaultDailyPracticeData(today?: DateString): DailyPracticeData {
  const t = today ?? getTodayString()
  return {
    version: DAILY_PRACTICE_VERSION,
    todayDate: t,
    todayGoals: { click: false, doubleClick: false, rightClick: false, drop: false },
    stamps: { stamps: [] },
  }
}

export function evaluateDailyGoals(sessionStats: SessionOperationStats): DailyGoal {
  return {
    click: sessionStats.click.success > 0,
    doubleClick: sessionStats.doubleClick.success > 0,
    rightClick: sessionStats.rightClick.success > 0,
    drop: sessionStats.drop.success > 0,
  }
}

export function isDailyGoalComplete(goals: DailyGoal): boolean {
  return goals.click && goals.doubleClick && goals.rightClick && goals.drop
}

/** CP-10: 重複排除のみ（スタンプ配列は減らない） */
export function addStamp(stamps: PracticeStampData, date: DateString): PracticeStampData {
  if (stamps.stamps.includes(date)) {
    return stamps
  }
  return { stamps: [...stamps.stamps, date].sort() }
}

function prevDayString(dateStr: DateString): DateString {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() - 1)
  return getTodayString(d)
}

/** CP-11: today を含む連続日（今日にスタンプがない場合は 0） */
export function calculateStreak(stamps: PracticeStampData, today: DateString): number {
  if (!stamps.stamps.includes(today)) {
    return 0
  }
  let count = 0
  let day: DateString = today
  const set = new Set(stamps.stamps)
  while (set.has(day)) {
    count++
    day = prevDayString(day)
  }
  return count
}

/** CP-12: 不正入力でクラッシュせずデフォルト値を返す */
export function parseDailyPracticeData(raw: string | null | undefined): DailyPracticeData {
  if (raw == null || raw === '') {
    return createDefaultDailyPracticeData()
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DailyPracticeData>
    if (typeof parsed !== 'object' || parsed == null) {
      return createDefaultDailyPracticeData()
    }
    if (typeof parsed.version !== 'number') {
      return createDefaultDailyPracticeData()
    }
    const base = createDefaultDailyPracticeData(
      typeof parsed.todayDate === 'string' ? parsed.todayDate : undefined
    )
    if (parsed.stamps && Array.isArray(parsed.stamps.stamps)) {
      base.stamps = { stamps: [...parsed.stamps.stamps] }
    }
    if (parsed.todayGoals) {
      base.todayGoals = {
        click: !!parsed.todayGoals.click,
        doubleClick: !!parsed.todayGoals.doubleClick,
        rightClick: !!parsed.todayGoals.rightClick,
        drop: !!parsed.todayGoals.drop,
      }
    }
    return base
  } catch {
    return createDefaultDailyPracticeData()
  }
}

export function loadDailyPracticeData(
  storage?: Pick<Storage, 'getItem'>
): DailyPracticeData {
  const s = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!s) {
    return createDefaultDailyPracticeData()
  }
  try {
    const raw = s.getItem(DAILY_PRACTICE_STORAGE_KEY)
    return parseDailyPracticeData(raw)
  } catch {
    return createDefaultDailyPracticeData()
  }
}

export function saveDailyPracticeData(
  data: DailyPracticeData,
  storage?: Pick<Storage, 'setItem'>
): void {
  const s = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null)
  if (!s) return
  try {
    s.setItem(DAILY_PRACTICE_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // CP-12: クォータ超過等は握りつぶし
  }
}
