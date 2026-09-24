import { translations } from '../i18n/translations'

/**
 * 用語の統一（v1.1 計画 G10・D4、docs/game-spec.md §8）。
 *
 * 同じ「続けて取ること」を「連続」「連続成功」「コンボ」、同じ「自己最高」を「最高得点」「ベスト」と
 * 呼び分けていて、初見テストで「連続成功と連続が二重」「最高得点とベストが二重」と指摘された。
 *
 * - 続けて取ること → 「コンボ」 / "Combo"
 * - 自己最高 → 「ベスト」 / "Best"
 * - 毎日続けて遊んだ日数 → 「◯日れんぞく」 / "day streak"（別の概念なので残す）
 * - 記録を比べる遊び（arcade） → 「チャレンジ」 / "Challenge"（v1.2 D5）
 * - 得点が2倍になる時間（fever） → 「ボーナスタイム」 / "Bonus Time"（v1.2 D5）
 */

/** 毎日続けた日数を表すキー（ここでだけ「れんぞく」「streak」を使ってよい） */
const DAY_STREAK_KEYS = new Set([
  'gamification.daysStreakLabel',
  'gamification.daysStreakUnit',
  'gamification.practiceStreakLabel',
])

function collectStrings(value: unknown, path: string[] = []): { key: string; text: string }[] {
  if (typeof value === 'string') return [{ key: path.join('.'), text: value }]
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => collectStrings(v, [...path, k]))
  }
  return []
}

describe('用語の統一', () => {
  const ja = collectStrings(translations.ja)
  const en = collectStrings(translations.en)

  it('日本語: 「連続」「最高得点」「ハイスコア」「ストリーク」「アーケード」「フィーバー」を使わない', () => {
    const offenders = ja.filter(({ text }) => /連続|最高得点|ハイスコア|ストリーク|アーケード|フィーバー/.test(text))
    expect(offenders).toEqual([])
  })

  it('日本語: 「れんぞく」は毎日続けた日数のところだけ', () => {
    const offenders = ja.filter(({ key, text }) => text.includes('れんぞく') && !DAY_STREAK_KEYS.has(key))
    expect(offenders).toEqual([])
  })

  it('英語: "High Score" "Arcade" "Fever" を使わず、"streak" は毎日続けた日数のところだけ', () => {
    const offenders = en.filter(
      ({ key, text }) =>
        /high score|arcade|fever/i.test(text) || (/streak/i.test(text) && !DAY_STREAK_KEYS.has(key))
    )
    expect(offenders).toEqual([])
  })
})
