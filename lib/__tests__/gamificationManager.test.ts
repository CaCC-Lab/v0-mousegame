/**
 * テスト観点表（gamificationManager / 要件・CP）
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---------|----------------------|-------------|-----------------|-------|
 * | TC-N-01 | cleared=true, 残り20%以上, ミス率0 | AC-1.1 正常 | ★3 | - |
 * | TC-N-02 | cleared=true, 残り20%未満 | 境界 | ★1 | ★2未達 |
 * | TC-B-01 | timeLimit=0 | 境界・ゼロ除算 | timeRatio=0 → ★1のみ | - |
 * | TC-B-02 | totalAttempts=0 | 境界 | missRate=0 | - |
 * | TC-A-01 | cleared=false | 異常 | ★0 | - |
 * | TC-CP-1 | 低い星→高い星へcommit | CP-1 | 星が下がらない | - |
 * | TC-CP-7 | 不正JSON | CP-7 | デフォルト | - |
 */

import {
  addSessionToCumulative,
  calculateStarRating,
  checkBadgeEarned,
  compareSessionSuccess,
  createDefaultGamificationData,
  createEmptySessionStats,
  loadGamificationData,
  mergeStageStarsMonotonic,
  parseGamificationData,
  saveGamificationData,
  sumAllAttempts,
  sumAllFails,
} from '../gamificationManager'
import {
  BADGE_DEFINITIONS,
  CumulativeOperationStats,
  DEFAULT_STAR_CRITERIA,
  GAMIFICATION_STORAGE_KEY,
  SessionOperationStats,
} from '@/types/gamification'

function session(partial: Partial<SessionOperationStats>): SessionOperationStats {
  const base = createEmptySessionStats()
  return {
    click: { ...base.click, ...partial.click },
    doubleClick: { ...base.doubleClick, ...partial.doubleClick },
    rightClick: { ...base.rightClick, ...partial.rightClick },
    drop: { ...base.drop, ...partial.drop },
  }
}

describe('gamificationManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('calculateStarRating (AC-1.1)', () => {
    // Given: クリア済み・残り時間十分・ミスなし
    // When: 星を計算
    // Then: ★3
    it('AC-1.1: ★1はクリア、★2は残り20%以上、★3はミス率10%以下（★2条件も満たす）', () => {
      const stats = session({
        click: { success: 10, fail: 0 },
      })
      const stars = calculateStarRating(true, 20, 100, stats, DEFAULT_STAR_CRITERIA)
      expect(stars).toBe(3)
    })

    it('★2のみ: 残り20%以上だがミス率が高い場合は★2止まり', () => {
      const stats = session({
        click: { success: 5, fail: 5 },
      })
      const stars = calculateStarRating(true, 30, 100, stats, DEFAULT_STAR_CRITERIA)
      expect(stars).toBe(2)
    })

    it('★1: クリアだが残り20%未満', () => {
      const stats = session({
        click: { success: 10, fail: 0 },
      })
      const stars = calculateStarRating(true, 10, 100, stats, DEFAULT_STAR_CRITERIA)
      expect(stars).toBe(1)
    })

    it('未クリアは★0', () => {
      const stats = createEmptySessionStats()
      expect(calculateStarRating(false, 50, 100, stats)).toBe(0)
    })
  })

  describe('境界・ゼロ除算', () => {
    it('timeLimit=0 のとき timeRemainingRatio は 0 扱いで★1', () => {
      const stats = session({ click: { success: 1, fail: 0 } })
      expect(calculateStarRating(true, 0, 0, stats)).toBe(1)
    })

    it('totalAttempts=0 でも missRate=0 として扱われる', () => {
      const empty = createEmptySessionStats()
      expect(calculateStarRating(true, 100, 100, empty)).toBe(3)
    })

    it('sessionStats が空オブジェクトに近い形でも落ちない', () => {
      const minimal = createEmptySessionStats()
      expect(() => calculateStarRating(true, 1, 1, minimal)).not.toThrow()
    })
  })

  describe('sumAllAttempts / sumAllFails', () => {
    it('null/undefined 混在は型上なし—空は0', () => {
      const s = createEmptySessionStats()
      expect(sumAllAttempts(s)).toBe(0)
      expect(sumAllFails(s)).toBe(0)
    })
  })

  describe('checkBadgeEarned (AC-2.1)', () => {
    it('各閾値: クリック30 / ダブル20 / 右20 / ドロップ15', () => {
      const thresholds = Object.fromEntries(BADGE_DEFINITIONS.map(d => [d.type, d.threshold]))
      expect(thresholds.clickMaster).toBe(30)
      expect(thresholds.doubleClickExpert).toBe(20)
      expect(thresholds.rightClickPro).toBe(20)
      expect(thresholds.dragDoctor).toBe(15)
    })

    it('閾値未満は null', () => {
      const c = createDefaultGamificationData().cumulativeStats
      expect(checkBadgeEarned(c, [])).toBeNull()
    })

    it('既取得はスキップされ次の未獲得を返す', () => {
      let c: CumulativeOperationStats = {
        click: { totalSuccess: 30, totalFail: 0 },
        doubleClick: { totalSuccess: 0, totalFail: 0 },
        rightClick: { totalSuccess: 0, totalFail: 0 },
        drop: { totalSuccess: 0, totalFail: 0 },
      }
      expect(checkBadgeEarned(c, [])).toBe('clickMaster')
      expect(checkBadgeEarned(c, ['clickMaster'])).toBeNull()
      c = {
        ...c,
        doubleClick: { totalSuccess: 20, totalFail: 0 },
      }
      expect(checkBadgeEarned(c, ['clickMaster'])).toBe('doubleClickExpert')
    })
  })

  describe('mergeStageStarsMonotonic (CP-1)', () => {
    it('星は低下しない', () => {
      const s = mergeStageStarsMonotonic({ 1: 3 }, 1, 1)
      expect(s[1]).toBe(3)
    })

    it('より高い星で上書き', () => {
      const s = mergeStageStarsMonotonic({ 1: 1 }, 1, 3)
      expect(s[1]).toBe(3)
    })
  })

  describe('addSessionToCumulative (CP-5)', () => {
    it('累計は各カウンタが加算される', () => {
      const cum = createDefaultGamificationData().cumulativeStats
      const sess = session({ click: { success: 2, fail: 1 } })
      const next = addSessionToCumulative(cum, sess)
      expect(next.click.totalSuccess).toBe(2)
      expect(next.click.totalFail).toBe(1)
    })

    it('空セッション加算でも減少しない', () => {
      const cum = createDefaultGamificationData().cumulativeStats
      const next = addSessionToCumulative(cum, createEmptySessionStats())
      expect(next.click.totalSuccess).toBe(0)
    })
  })

  describe('parseGamificationData / loadGamificationData (CP-7, AC-6.2, AC-6.3)', () => {
    it('CP-7: 不正JSONはデフォルト', () => {
      const d = parseGamificationData('{not json')
      expect(d).toEqual(createDefaultGamificationData())
    })

    it('null / undefined はデフォルト', () => {
      expect(parseGamificationData(null)).toEqual(createDefaultGamificationData())
      expect(parseGamificationData(undefined)).toEqual(createDefaultGamificationData())
    })

    it('空文字はデフォルト', () => {
      expect(parseGamificationData('')).toEqual(createDefaultGamificationData())
    })

    it('配列トップレベルはデフォルト扱い', () => {
      const d = parseGamificationData('[]')
      expect(d.version).toBeGreaterThanOrEqual(1)
    })

    it('loadGamificationData: getItem が投げてもデフォルト (AC-6.2)', () => {
      const storage = {
        getItem: () => {
          throw new Error('quota')
        },
      }
      expect(loadGamificationData(storage as Storage)).toEqual(createDefaultGamificationData())
    })

    it('壊れた部分オブジェクトは正規化される', () => {
      const raw = JSON.stringify({
        stageStars: { a: 'x' },
        badges: null,
        cumulativeStats: {},
        lastSessionStats: [],
        version: 1,
      })
      const d = parseGamificationData(raw)
      expect(d).toBeDefined()
      expect(() => JSON.stringify(d)).not.toThrow()
    })
  })

  describe('save/load 冪等性 (CP-6, AC-1.3)', () => {
    it('CP-6: save→load→save→load で同一', () => {
      const data = createDefaultGamificationData()
      data.stageStars[1] = 2
      saveGamificationData(data)
      const once = loadGamificationData()
      saveGamificationData(once)
      const twice = loadGamificationData()
      expect(twice).toEqual(once)
    })

    it('AC-6.4: 既存キー stageProgress は触らない', () => {
      localStorage.setItem('stageProgress', '{"currentStage":2}')
      const data = createDefaultGamificationData()
      saveGamificationData(data)
      expect(localStorage.getItem('stageProgress')).toBe('{"currentStage":2}')
      expect(localStorage.getItem(GAMIFICATION_STORAGE_KEY)).toBeTruthy()
    })
  })

  describe('compareSessionSuccess (AC-3.2)', () => {
    it('前回なしはすべて same', () => {
      const cur = createEmptySessionStats()
      cur.click.success = 3
      const d = compareSessionSuccess(cur, null)
      expect(d.click).toBe('same')
    })

    it('増加は up、減少は down', () => {
      const prev = createEmptySessionStats()
      prev.click.success = 1
      const cur = createEmptySessionStats()
      cur.click.success = 3
      expect(compareSessionSuccess(cur, prev).click).toBe('up')
      expect(compareSessionSuccess(prev, cur).click).toBe('down')
    })
  })

  describe('CP-6 / CP-7 追加', () => {
    it('CP-6: 同一オブジェクトを複数回 save しても load が一致', () => {
      const d = createDefaultGamificationData()
      d.cumulativeStats.click.totalSuccess = 42
      saveGamificationData(d)
      saveGamificationData(d)
      expect(loadGamificationData()).toEqual(loadGamificationData())
    })

    it('CP-7: 任意の文字列を parse しても例外にならない', () => {
      const samples = ['', 'null', 'undefined', '{"bad":', String.raw`{"x":0e999}`, '😀'.repeat(200)]
      for (const s of samples) {
        expect(() => parseGamificationData(s)).not.toThrow()
        expect(parseGamificationData(s).version).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('CP プロパティ簡易ストレス', () => {
    it('CP-1: ランダムな星更新列でも単調非減少', () => {
      let stage: Record<number, number> = {}
      const updates = [1, 3, 2, 1, 3, 0]
      for (const r of updates) {
        const next = mergeStageStarsMonotonic(stage, 1, r as 0 | 1 | 2 | 3)
        stage = next
      }
      expect(stage[1]).toBe(3)
    })

    it('CP-5: 複数回加算でも累計が減らない', () => {
      let cum = createDefaultGamificationData().cumulativeStats
      for (let i = 0; i < 5; i++) {
        const s = session({ click: { success: 1, fail: 0 } })
        cum = addSessionToCumulative(cum, s)
      }
      expect(cum.click.totalSuccess).toBe(5)
    })
  })
})
