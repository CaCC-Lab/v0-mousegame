/**
 * れんしゅうのステージは、操作を1つずつ覚える順に果物を出す。
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---|---|---|---|---|
 * | SF-N-01 | 1面 | Equivalence – normal | りんごだけ出る | クリックだけで遊べる |
 * | SF-N-02 | 2〜4面 | Equivalence – normal | 1面ずつ果物が1種類増える | 新しい果物が focusFruit |
 * | SF-N-03 | rng < 比率 | Boundary – 比率の直前 | focusFruit | - |
 * | SF-N-04 | rng = 比率 | Boundary – 比率ちょうど | fruitTypes から均等 | 比率ちょうどは focus にしない |
 * | SF-N-05 | 1000回抽選 | Equivalence – 分布 | focusFruit が半分以上 | 多めに出る |
 * | SF-N-06 | 各ステージの目標 | Boundary – 最小の点 | 目標の果物をいちばん安く取った点で targetScore に届く | 点だけが足りず終わらない |
 * | SF-A-01 | fruitTypes が空 | Boundary – 空 | 4種類のどれか | 壊れたデータでも遊べる |
 * | SF-A-02 | focusFruit なし | Boundary – undefined | fruitTypes から選ぶ | 5・6面 |
 * | SF-A-03 | focusFruit が fruitTypes に無い | Invalid | focusFruit を出さない | - |
 * | SF-A-04 | rng = 0.999… | Boundary – 最大 | 配列の外に出ない | - |
 * | SF-A-05 | 比率 0 | Boundary – 0 | focusFruit を優先しない | - |
 */
import { pickStageFruitType, generateFruits } from '../gameLogic'
import { STAGES, STAGE_FOCUS_RATIO } from '../../types/stage'
import { GAME_SCORES, type FruitType } from '../../types/game'

const ALL: FruitType[] = ['apple', 'blueberry', 'lemon', 'watermelon']

describe('れんしゅうのステージ構成', () => {
  it('SF-N-01: 1面はりんごだけ', () => {
    // Given: 1面
    // When:  出す果物を見る
    // Then:  りんごだけ
    expect(STAGES[0].fruitTypes).toEqual(['apple'])
  })

  it('SF-N-02: 2〜4面で1つずつ果物が増え、増えた果物を覚える', () => {
    // Given: 1〜4面
    // When:  前の面と比べる
    // Then:  1種類ずつ増え、増えた果物が focusFruit
    for (let i = 1; i < 4; i++) {
      const prev = STAGES[i - 1].fruitTypes
      const cur = STAGES[i].fruitTypes
      const added = cur.filter(f => !prev.includes(f))
      expect(cur.length).toBe(prev.length + 1)
      expect(added).toEqual([STAGES[i].focusFruit])
    }
    expect(STAGES[3].fruitTypes).toEqual(ALL)
  })

  it('SF-N-06: 目標の果物をいちばん安く取っても目標スコアに届く', () => {
    // Given: 各ステージの目標
    // When:  指定された果物を必要数、残りを出る中でいちばん安い果物で取る
    // Then:  targetScore 以上になる（点だけ足りずにクリアできないことがない）
    for (const stage of STAGES) {
      const { total = 0, ...specific } = stage.targetFruits
      let points = 0
      let count = 0
      for (const [type, n] of Object.entries(specific) as [FruitType, number][]) {
        expect(stage.fruitTypes).toContain(type)
        points += GAME_SCORES[type] * n
        count += n
      }
      const cheapest = Math.min(...stage.fruitTypes.map(f => GAME_SCORES[f]))
      points += cheapest * Math.max(0, total - count)
      expect(points).toBeGreaterThanOrEqual(stage.targetScore)
    }
  })
})

describe('pickStageFruitType', () => {
  it('SF-N-03: 乱数が比率より小さいと focusFruit', () => {
    // Given: rng が比率の直前 When: 選ぶ Then: focusFruit
    expect(pickStageFruitType(ALL, 'lemon', 0.5, () => 0.4999)).toBe('lemon')
  })

  it('SF-N-04: 乱数が比率ちょうどなら均等に選ぶ', () => {
    // Given: rng が 0.5 ちょうど（2回目は 0 → 先頭）
    const values = [0.5, 0]
    // When: 選ぶ Then: 先頭の apple
    expect(pickStageFruitType(ALL, 'lemon', 0.5, () => values.shift()!)).toBe('apple')
  })

  it('SF-N-05: focusFruit は半分以上出る', () => {
    // Given: 4種類の4面相当、比率 STAGE_FOCUS_RATIO
    let seed = 1
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    // When: 1000回選ぶ
    let focus = 0
    for (let i = 0; i < 1000; i++) if (pickStageFruitType(ALL, 'watermelon', STAGE_FOCUS_RATIO, rng) === 'watermelon') focus++
    // Then: 半分以上
    expect(focus).toBeGreaterThan(500)
  })

  it('SF-A-01: fruitTypes が空なら4種類から選ぶ', () => {
    // Given: 空 When: 選ぶ Then: 4種類のどれか
    expect(ALL).toContain(pickStageFruitType([], undefined, 0.5, () => 0.7))
  })

  it('SF-A-02: focusFruit が無ければ fruitTypes から選ぶ', () => {
    // Given: focus なし When: rng 0 Then: 先頭
    expect(pickStageFruitType(['lemon', 'apple'], undefined, 0.5, () => 0)).toBe('lemon')
  })

  it('SF-A-03: fruitTypes に無い focusFruit は出さない', () => {
    // Given: apple だけのステージに watermelon を指定
    // When: rng 0 で選ぶ Then: apple
    expect(pickStageFruitType(['apple'], 'watermelon', 1, () => 0)).toBe('apple')
  })

  it('SF-A-04: 乱数が 1 に近くても配列の外に出ない', () => {
    // Given: rng 0.9999999 When: 選ぶ Then: 最後の要素
    expect(pickStageFruitType(['apple', 'blueberry'], undefined, 0, () => 0.9999999)).toBe('blueberry')
  })

  it('SF-A-05: 比率 0 なら focusFruit を優先しない', () => {
    // Given: 比率 0、rng 0 When: 選ぶ Then: 先頭（focus ではない）
    expect(pickStageFruitType(['apple', 'lemon'], 'lemon', 0, () => 0)).toBe('apple')
  })
})

describe('generateFruits と種類の指定', () => {
  it('pickType を渡すとその種類だけになる', () => {
    // Given: りんごだけ選ぶ関数 When: 6個作る Then: 全部りんご
    const fruits = generateFruits(6, [], undefined, () => 'apple')
    expect(fruits).toHaveLength(6)
    expect(fruits.every(f => f.type === 'apple')).toBe(true)
  })

  it('pickType を渡さないと従来どおり（4種類のどれか）', () => {
    // Given: 指定なし When: 作る Then: 4種類のどれか
    const fruits = generateFruits(8)
    expect(fruits.every(f => ALL.includes(f.type))).toBe(true)
  })
})
