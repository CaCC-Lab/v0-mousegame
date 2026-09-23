import {
  generateFruit,
  generateFruits,
  generateBalancedFruits,
  generateFruitForField,
  fruitFootprint,
  footprintsOverlap,
  relayoutFruits,
  reservedBandsPercent,
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

/**
 * 実際のプレイエリアの大きさで配置する（v1.1 の残作業「1280×800 より小さい画面」）。
 *
 * 800×600 の画面ではプレイエリアが 768×312px しかなく、1280×800 基準の見積もりでは
 * 果物が相対的に大きくなって、15回開始×12個で重なり 29 組・凡例と重なり 18 個が出た（2026-09-24 実測）。
 */
describe('果物の配置: 小さいプレイエリア', () => {
  const small = { width: 768, height: 312 }
  const countOverlapsIn = (fruits: Fruit[], area: { width: number; height: number }) => {
    let pairs = 0
    for (let i = 0; i < fruits.length; i++) {
      for (let j = i + 1; j < fruits.length; j++) {
        if (footprintsOverlap(fruitFootprint(fruits[i], area), fruitFootprint(fruits[j], area))) pairs++
      }
    }
    return pairs
  }

  it('768×312px でも、開始時の12個は重ならない（200回試行）', () => {
    for (let run = 0; run < 200; run++) {
      expect(countOverlapsIn(generateBalancedFruits(12, small), small)).toBe(0)
    }
  })

  it('768×312px でも、凡例とカウンターの帯・ドロップエリアを避ける', () => {
    for (let run = 0; run < 200; run++) {
      generateBalancedFruits(12, small).forEach((fruit) => {
        const r = fruitFootprint(fruit, small)
        expect(r.top).toBeGreaterThanOrEqual(PLACEMENT_CONFIG.reservedTopPercent)
        expect(r.bottom).toBeLessThanOrEqual(100 - PLACEMENT_CONFIG.reservedBottomPercent)
        expect(r.right).toBeLessThanOrEqual(PLAY_AREA_WIDTH)
      })
    }
  })

  it('大きさの見積もりは、渡したプレイエリアに対する割合になる', () => {
    const r = fruitFootprint({ size: 'large', x: 0, y: 0 }, small)
    expect(((r.bottom - r.top) / 100) * small.height).toBeGreaterThanOrEqual(62)
  })
})

/**
 * 遊んでいる途中でプレイエリアの大きさが変わったとき（v1.1 残作業）。
 *
 * 800×600 では、遊び始めるとヘッダが折り返して 44→160px になり、プレイエリアが 476→308px に縮む。
 * 果物は開始時点の大きさで配置されるので、縮んだ後に重なっていた（2026-09-24 実測）。
 */
describe('relayoutFruits: 大きさが変わったら、重なった果物だけを置き直す', () => {
  const before = { width: 753, height: 476 }
  const after = { width: 753, height: 308 }

  const overlapsIn = (fruits: Fruit[], area: { width: number; height: number }) => {
    let pairs = 0
    for (let i = 0; i < fruits.length; i++) {
      for (let j = i + 1; j < fruits.length; j++) {
        if (footprintsOverlap(fruitFootprint(fruits[i], area), fruitFootprint(fruits[j], area))) pairs++
      }
    }
    return pairs
  }

  it('縮んだプレイエリアで、重なりも帯へのはみ出しも無くなる（200回試行）', () => {
    for (let run = 0; run < 200; run++) {
      const relaid = relayoutFruits(generateBalancedFruits(12, before), after)
      expect(overlapsIn(relaid, after)).toBe(0)
      relaid.forEach((fruit) => {
        const r = fruitFootprint(fruit, after)
        expect(r.top).toBeGreaterThanOrEqual(reservedBandsPercent(after).top)
        expect(r.bottom).toBeLessThanOrEqual(100 - reservedBandsPercent(after).bottom)
      })
    }
  })

  it('置き直すのは問題のある果物だけ。種類・id・数は変えない', () => {
    const field = generateBalancedFruits(12, before)
    const relaid = relayoutFruits(field, before)
    // 同じ大きさなら何も動かさない
    expect(relaid).toEqual(field)

    const shrunk = relayoutFruits(field, after)
    expect(shrunk.map((f) => [f.id, f.type, f.size])).toEqual(field.map((f) => [f.id, f.type, f.size]))
  })

  it('上下の帯は px でも確保する（低いプレイエリアでは百分率だけでは凡例の高さに足りない）', () => {
    const bands = reservedBandsPercent(after)
    expect((bands.bottom / 100) * after.height).toBeGreaterThanOrEqual(PLACEMENT_CONFIG.reservedBottomPx - 1e-6)
    expect((bands.top / 100) * after.height).toBeGreaterThanOrEqual(PLACEMENT_CONFIG.reservedTopPx - 1e-6)
    // 1280×800 の基準では、これまでの百分率より狭くしない
    const ref = reservedBandsPercent(PLACEMENT_CONFIG.referenceAreaPx)
    expect(ref.top).toBeGreaterThanOrEqual(PLACEMENT_CONFIG.reservedTopPercent)
    expect(ref.bottom).toBeGreaterThanOrEqual(PLACEMENT_CONFIG.reservedBottomPercent)
  })
})
