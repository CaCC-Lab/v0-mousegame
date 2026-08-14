import { getRequiredInteraction, calculateScore } from '../gameLogic'
import type { FruitType, InteractionType } from '@/types/game'

/**
 * 誤操作したときに「正解は何だったか」を引ける必要がある。
 *
 * プレイテストで、ブルーベリーを右クリックして0点になった初見プレイヤーが
 * 「正解が何か一切出ない」ことを理由に離脱した。
 * 得点計算と同じ対応表から正解を引けるようにして、その場で伝えられるようにする。
 */
describe('getRequiredInteraction', () => {
  const cases: [FruitType, InteractionType][] = [
    ['apple', 'click'],
    ['blueberry', 'doubleClick'],
    ['lemon', 'rightClick'],
    ['watermelon', 'drop'],
  ]

  it.each(cases)('%s の正解操作は %s', (fruit, action) => {
    expect(getRequiredInteraction(fruit)).toBe(action)
  })

  it('返した操作でそのフルーツを取ると必ず得点になる', () => {
    // 得点計算と同じ対応表を見ていることの検証（ずれると誤ったヒントを出す）
    const fruits: FruitType[] = ['apple', 'blueberry', 'lemon', 'watermelon']
    fruits.forEach(fruit => {
      expect(calculateScore(fruit, getRequiredInteraction(fruit))).toBeGreaterThan(0)
    })
  })
})
