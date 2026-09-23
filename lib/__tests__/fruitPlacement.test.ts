import {
  generateFruit,
  generateFruits,
  generateBalancedFruits,
  generateFruitForField,
  fruitFootprint,
  footprintsOverlap,
} from '../gameLogic'
import { PLACEMENT_CONFIG, PLAY_AREA_WIDTH, type Fruit } from '@/types/game'

/**
 * 果物の配置（v1.1 計画 G5、docs/game-spec.md §3）。
 *
 * ベースライン（841e919、アーケード20回×12個）: 果物同士の重なり 25 組、
 * 中心が他の果物に覆われて取れないもの 15 個、凡例と重なるもの 16 個。
 */
describe('果物の配置', () => {
  const countOverlaps = (fruits: Fruit[]) => {
    let pairs = 0
    for (let i = 0; i < fruits.length; i++) {
      for (let j = i + 1; j < fruits.length; j++) {
        if (footprintsOverlap(fruitFootprint(fruits[i]), fruitFootprint(fruits[j]))) pairs++
      }
    }
    return pairs
  }

  const insideAllowedArea = (fruit: Fruit) => {
    const r = fruitFootprint(fruit)
    return (
      r.left >= 0 &&
      r.right <= PLAY_AREA_WIDTH &&
      // 上端は収穫カウンター、下端は操作の凡例のために空けておく
      r.top >= PLACEMENT_CONFIG.reservedTopPercent &&
      r.bottom <= 100 - PLACEMENT_CONFIG.reservedBottomPercent
    )
  }

  it('アーケードの最大数（20個）まで並べても、果物どうしが重ならない（200回試行）', () => {
    for (let run = 0; run < 200; run++) {
      const field = generateBalancedFruits(20)
      expect(countOverlaps(field)).toBe(0)
    }
  })

  it('れんしゅうの最大数（15個）でも重ならない（200回試行）', () => {
    for (let run = 0; run < 200; run++) {
      expect(countOverlaps(generateFruits(15))).toBe(0)
    }
  })

  it('すべての果物が、凡例・カウンター・ドロップエリアを避けた範囲に収まる', () => {
    for (let run = 0; run < 200; run++) {
      generateBalancedFruits(20).forEach((fruit) => {
        expect(insideAllowedArea(fruit)).toBe(true)
      })
    }
  })

  it('補充した果物は、いまある果物と重ならない', () => {
    for (let run = 0; run < 200; run++) {
      const field = generateBalancedFruits(15)
      const added = generateFruitForField(field)
      field.forEach((f) => expect(footprintsOverlap(fruitFootprint(added), fruitFootprint(f))).toBe(false))

      const practiceAdded = generateFruit(undefined, field)
      field.forEach((f) => expect(footprintsOverlap(fruitFootprint(practiceAdded), fruitFootprint(f))).toBe(false))
    }
  })

  it('空きが無いほど詰まっていても、止まらずに範囲内の位置を返す', () => {
    const packed = generateFruits(200)
    const fruit = generateFruit('apple', packed)
    expect(insideAllowedArea(fruit)).toBe(true)
  })

  it('大きさの見積もりは、実際の表示（1280×800 での実測 39/47/62px）以上ある', () => {
    // 1280×800 でのプレイエリアは 1144×660px（2026-09-23 実測）
    const px = { small: 39, medium: 47, large: 62 }
    ;(['small', 'medium', 'large'] as const).forEach((size) => {
      const r = fruitFootprint({ size, x: 0, y: 0 })
      expect(((r.right - r.left) / 100) * 1144).toBeGreaterThanOrEqual(px[size])
      expect(((r.bottom - r.top) / 100) * 660).toBeGreaterThanOrEqual(px[size])
    })
  })
})
