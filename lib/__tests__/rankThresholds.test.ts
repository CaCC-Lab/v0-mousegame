import { getRank } from '../arcadeManager'

/**
 * 段位のしきい値（v1.2 D3「構造を入れた後に、腕前つき自動プレイで測って決める」）。
 *
 * 2026-09-24 の実測（Chromium、各5回、docs/v1.2-plan.md）:
 * - beginner（1.5 秒ごと・ミス 20%）: 2,170〜3,155 点
 * - normal（0.8 秒ごと・ミス 10%）: 10,765〜17,875 点
 * - expert（0.4 秒ごと・ミスなし）: 116,360 点（5回とも同じ）
 *
 * 合格条件 G2: normal の1回目はシルバー〜ゴールド、expert でも1回目はダイヤに届かない。
 * （v1.1 までは 7,000 点でダイヤ。normal が1回目でプラチナ、expert は上限の約3倍だった）
 */
describe('段位のしきい値', () => {
  it('beginner の実測はシルバー（1回目で1つ上がる手応え）', () => {
    for (const score of [2170, 2615, 2620, 3115, 3155]) expect(getRank(score)).toBe('silver')
  })

  it('normal の実測はゴールド（シルバー〜ゴールドの範囲）', () => {
    for (const score of [10765, 14465, 15875, 16005, 17875]) expect(getRank(score)).toBe('gold')
  })

  it('expert（ミスなしの上限）でも1回目はダイヤに届かない', () => {
    expect(getRank(116360)).toBe('platinum')
  })

  it('0点はブロンズ', () => {
    expect(getRank(0)).toBe('bronze')
  })
})
