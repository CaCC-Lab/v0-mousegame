/**
 * チャレンジの「にがてな そうさ」から、その果物が出るれんしゅうステージを選ぶ。
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---|---|---|---|---|
 * | SFF-N-01 | 1面のまま、ブルーベリー | Equivalence – normal | 2面（ブルーベリーの面）を開けて選ぶ | 1面はりんごだけ |
 * | SFF-N-02 | 1面のまま、スイカ | Equivalence – normal | 4面を開けて選ぶ | - |
 * | SFF-N-03 | 5面を選択中、レモン | Equivalence – normal | 5面のまま | 今の面に出るなら動かさない |
 * | SFF-N-04 | 1面、りんご | Boundary – 今の面に出る | 1面のまま | - |
 * | SFF-N-05 | 2面を開けたあと | Persistence | 保存され、作り直しても開いている | - |
 * | SFF-A-01 | 未知の果物 | Invalid | null・ステージは変わらない | 古いデータ |
 * | SFF-A-02 | undefined | Boundary – undefined | null・ステージは変わらない | - |
 */
import { StageManager } from '../stageManager'
import type { FruitType } from '@/types/game'

describe('StageManager.selectStageForFruit', () => {
  beforeEach(() => localStorage.clear())

  it('SFF-N-01: 1面にいてブルーベリーが苦手なら、2面を開けて選ぶ', () => {
    // Given: 1面だけ開いている When: ブルーベリーで選ぶ Then: 2面が選ばれ開く
    const m = new StageManager()
    expect(m.selectStageForFruit('blueberry')).toBe(2)
    expect(m.getCurrentStage()).toBe(2)
    expect(m.getStageInfo(2)?.unlocked).toBe(true)
  })

  it('SFF-N-02: スイカなら4面', () => {
    // Given: 1面 When: スイカ Then: 4面
    const m = new StageManager()
    expect(m.selectStageForFruit('watermelon')).toBe(4)
    expect(m.getStageInfo(4)?.fruitTypes).toContain('watermelon')
  })

  it('SFF-N-03: 今の面にその果物が出るなら動かさない', () => {
    // Given: 5面を選択中 When: レモン Then: 5面のまま
    const m = new StageManager()
    for (let n = 1; n <= 4; n++) m.completeStage(n, 1000)
    m.selectStage(5)
    expect(m.selectStageForFruit('lemon')).toBe(5)
    expect(m.getCurrentStage()).toBe(5)
  })

  it('SFF-N-04: 1面でりんごなら1面のまま', () => {
    // Given: 1面 When: りんご Then: 1面、2面は開かない
    const m = new StageManager()
    expect(m.selectStageForFruit('apple')).toBe(1)
    expect(m.getStageInfo(2)?.unlocked).toBe(false)
  })

  it('SFF-N-05: 開けた面は保存される', () => {
    // Given: ブルーベリーで2面を開けた When: 作り直す Then: 2面が開いていて選べる
    new StageManager().selectStageForFruit('blueberry')
    const again = new StageManager()
    expect(again.getStageInfo(2)?.unlocked).toBe(true)
    expect(again.selectStage(2)).toBe(true)
  })

  it('SFF-A-01: 未知の果物は null で、ステージは変わらない', () => {
    // Given: 1面 When: 'banana' Then: null・1面のまま
    const m = new StageManager()
    expect(m.selectStageForFruit('banana' as FruitType)).toBeNull()
    expect(m.getCurrentStage()).toBe(1)
  })

  it('SFF-A-02: undefined は null で、ステージは変わらない', () => {
    // Given: 1面 When: undefined Then: null・1面のまま
    const m = new StageManager()
    expect(m.selectStageForFruit(undefined as unknown as FruitType)).toBeNull()
    expect(m.getCurrentStage()).toBe(1)
  })
})

describe('1面の目標スコア', () => {
  it('かんたん（0.8倍）でも、目標の10こ（りんご）で届く', () => {
    // Given: 1面 When: りんご10こを かんたんで取る（8点×10） Then: 目標スコアに届く
    const m = new StageManager()
    const stage1 = m.getStageInfo(1)!
    const total = stage1.targetFruits.total ?? 0
    expect(Math.round(10 * 0.8) * total).toBeGreaterThanOrEqual(stage1.targetScore)
    expect(m.isStageCompleted(1, Math.round(10 * 0.8) * total, { apple: total, blueberry: 0, lemon: 0, watermelon: 0 })).toBe(true)
  })
})
