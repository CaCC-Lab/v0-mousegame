/**
 * Task 11 / design.md §12.2 — lib/dailyPracticeManager
 * CP-10（スタンプ不可逆）, CP-11（連続日数）, CP-12（日付境界安全）
 *
 * テスト観点表（抜粋）
 * | Case ID | Perspective | Expected |
 * |---------|-------------|----------|
 * | TC-CP-10 | スタンプ追加 | 重複排除・削除なし |
 * | TC-CP-11 | 連続日 | today から遡って連続日数 |
 * | TC-CP-12 | parse/load | 不正入力でクラッシュしない・既定値 |
 */

import {
  addStamp,
  calculateStreak,
  createDefaultDailyPracticeData,
  evaluateDailyGoals,
  getTodayString,
  isDailyGoalComplete,
  loadDailyPracticeData,
  parseDailyPracticeData,
  saveDailyPracticeData,
} from '../dailyPracticeManager'
import { createEmptySessionStats } from '../gamificationManager'

describe('dailyPracticeManager (Task 11 / design §12.2)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('CP-10: スタンプ不可逆（重複排除・減少なし）', () => {
    it('同一日付を二重に追加してもスタンプ数は増えない', () => {
      // Given: 既に 2026-04-01 がある
      const s0: { stamps: string[] } = { stamps: ['2026-04-01'] }
      // When: 同じ日付を追加
      const s1 = addStamp(s0, '2026-04-01')
      // Then: 重複排除
      expect(s1.stamps).toEqual(['2026-04-01'])
      expect(s1.stamps.length).toBe(1)
    })

    it('異なる日付を追加すると昇順で増える（既存は消えない）', () => {
      // Given
      const s0 = addStamp({ stamps: [] }, '2026-04-03')
      // When
      const s1 = addStamp(s0, '2026-04-01')
      // Then: ソート・不可逆
      expect(s1.stamps).toEqual(['2026-04-01', '2026-04-03'])
    })

    it('スタンプ列に対する addStamp 列でユニーク日数は単調非減少', () => {
      let data = { stamps: [] as string[] }
      const levels: number[] = []
      const dates = ['2026-01-01', '2026-01-01', '2026-01-02', '2026-01-02', '2026-01-03']
      for (const d of dates) {
        data = addStamp(data, d)
        levels.push(new Set(data.stamps).size)
      }
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1])
      }
    })
  })

  describe('CP-11: 連続日数', () => {
    it('今日のスタンプのみなら 1', () => {
      const today = '2026-06-10'
      expect(calculateStreak({ stamps: [today] }, today)).toBe(1)
    })

    it('今日が含まれない場合は 0', () => {
      expect(calculateStreak({ stamps: ['2026-06-09'] }, '2026-06-10')).toBe(0)
    })

    it('3日連続で 3', () => {
      const today = '2026-06-10'
      const stamps = ['2026-06-08', '2026-06-09', today]
      expect(calculateStreak({ stamps }, today)).toBe(3)
    })

    it('ギャップがあると今日から見て連続は途切れる', () => {
      const today = '2026-06-10'
      const stamps = ['2026-06-07', '2026-06-10']
      expect(calculateStreak({ stamps }, today)).toBe(1)
    })
  })

  describe('CP-12: 日付境界・永続化の安全', () => {
    it('parseDailyPracticeData(null / undefined / 空) は例外なく既定値', () => {
      expect(() => parseDailyPracticeData(null)).not.toThrow()
      expect(() => parseDailyPracticeData(undefined)).not.toThrow()
      expect(() => parseDailyPracticeData('')).not.toThrow()
      expect(parseDailyPracticeData(null).version).toBeGreaterThanOrEqual(1)
    })

    it('不正JSONでも例外を投げず既定値', () => {
      expect(() => parseDailyPracticeData('{not json')).not.toThrow()
      expect(parseDailyPracticeData('{not json').stamps.stamps).toEqual([])
    })

    it('loadDailyPracticeData が getItem で例外を投げても既定値', () => {
      const badStorage = {
        getItem: () => {
          throw new Error('quota')
        },
      }
      expect(() => loadDailyPracticeData(badStorage as Storage)).not.toThrow()
      expect(loadDailyPracticeData(badStorage as Storage).version).toBeGreaterThanOrEqual(1)
    })

    it('getTodayString が固定 Date で YYYY-MM-DD を返す', () => {
      expect(getTodayString(new Date('2026-03-15T15:00:00'))).toBe('2026-03-15')
    })
  })

  describe('evaluateDailyGoals / isDailyGoalComplete', () => {
    it('各操作 success>0 で true', () => {
      const s = createEmptySessionStats()
      s.click.success = 1
      s.doubleClick.success = 1
      s.rightClick.success = 1
      s.drop.success = 1
      const g = evaluateDailyGoals(s)
      expect(isDailyGoalComplete(g)).toBe(true)
    })

    it('一つでも 0 なら未完了', () => {
      const s = createEmptySessionStats()
      s.click.success = 1
      expect(isDailyGoalComplete(evaluateDailyGoals(s))).toBe(false)
    })
  })

  describe('save/load 整合', () => {
    it('save → load で同等（CP-12）', () => {
      const mem: Record<string, string> = {}
      const storage = {
        getItem: (k: string) => mem[k] ?? null,
        setItem: (k: string, v: string) => {
          mem[k] = v
        },
      }
      const d = createDefaultDailyPracticeData('2026-01-01')
      d.stamps = addStamp(d.stamps, '2026-01-01')
      saveDailyPracticeData(d, storage)
      const loaded = loadDailyPracticeData(storage)
      expect(loaded.todayDate).toBe(d.todayDate)
      expect(loaded.stamps.stamps).toEqual(d.stamps.stamps)
    })
  })
})
