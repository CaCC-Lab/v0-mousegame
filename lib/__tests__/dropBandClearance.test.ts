import { generateBalancedFruits, fruitFootprint, playableRightPercent, relayoutFruits, reservedBandsPercent, updateFruitPosition } from '../gameLogic'
import { DROP_BAND_PX } from '../dropBand'
import { PLACEMENT_CONFIG, PLAY_AREA_WIDTH, type Fruit } from '@/types/game'

/**
 * 右端の帯（7.5rem = 120px）と果物の右境界（レビュー #84）。
 *
 * 配置の 16% は、幅 600px では 96px にしかならない。帯は 120px なので、
 * 小さい果物が帯の裏に入り、中心まで隠れて押せなくなる。
 *
 * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
 * |---|---|---|---|---|
 * | DB-N-01 | 幅 1144px | Equivalence – normal | 右端は 16%（84）のまま | 帯 120px は 16% より狭い |
 * | DB-N-02 | 幅 600px で 12 個 | Equivalence – normal | 右端が帯の左（480px）を越えない | レビューの例 |
 * | DB-N-03 | 広い位置から 600px へ置き直し | Equivalence – normal | 帯の裏に残らない | relayout |
 * | DB-N-04 | 幅 600px で右へ動く | Equivalence – normal | 帯に入る前に跳ね返る | 移動 |
 * | DB-A-01 | 幅 0 | Boundary – 0 | 落ちず、16% を使う | ゼロ除算 |
 * | DB-A-02 | 幅が負 | Boundary – 負 | 落ちず、16% を使う | 不正な計測 |
 * | DB-B-01 | 幅 750px（120/0.16） | Boundary – 一致 | 右端は 84 | 16% と帯が同じ |
 * | DB-B-02 | 幅 749px | Boundary – -1 | 右端は 84 より狭い | 帯のほうが広い |
 */

const rightEdgePx = (fruit: Fruit, area: { width: number; height: number }) =>
  (fruitFootprint(fruit, area).right / 100) * area.width

describe('ドロップ帯の実幅を配置の右端にする', () => {
  it('DB-N-01: 広い画面では、これまでの 16% を空ける', () => {
    // Given: 埋め込み幅
    // When: 右端の百分率を求める
    // Then: 84 のまま（帯は 16% より狭い）
    expect(playableRightPercent({ width: 1144, height: 660 })).toBe(PLAY_AREA_WIDTH)
  })

  it('DB-N-02: 幅 600px では、果物の右端が帯の左で止まる', () => {
    // Given: 帯が 16% より広いプレイエリア
    const area = { width: 600, height: 400 }
    // When: 畑を作る
    const field = generateBalancedFruits(12, area)
    // Then: どの果物も帯（右端 120px）に入らない
    field.forEach((fruit) => {
      expect(rightEdgePx(fruit, area)).toBeLessThanOrEqual(area.width - DROP_BAND_PX)
    })
  })

  it('DB-N-03: 狭くなったら、帯の裏にいた果物を置き直す', () => {
    // Given: 広い画面では帯の外だった位置
    const wide = { width: 1144, height: 660 }
    const narrow = { width: 600, height: 400 }
    const parked: Fruit = {
      id: 1, type: 'apple', size: 'small', x: 78, y: 20, dx: 0, dy: 0,
    }
    expect(rightEdgePx(parked, wide)).toBeLessThanOrEqual(wide.width - DROP_BAND_PX)
    // When: 600px に縮む
    const [moved] = relayoutFruits([parked], narrow)
    // Then: 帯の裏から出る
    expect(rightEdgePx(moved, narrow)).toBeLessThanOrEqual(narrow.width - DROP_BAND_PX)
  })

  it('DB-N-04: 動いている果物も、帯に入る前に跳ね返る', () => {
    // Given: 600px で、次の一歩が帯に入る
    const area = { width: 600, height: 400 }
    const fruit: Fruit = {
      id: 1, type: 'apple', size: 'small', x: 70, y: 40, dx: 40, dy: 0,
    }
    // When: 右へ進める
    const next = updateFruitPosition(fruit, 0.5, area)
    // Then: 右端は帯の左で止まり、向きが反転する
    expect(rightEdgePx(next, area)).toBeLessThanOrEqual(area.width - DROP_BAND_PX)
    expect(next.dx).toBeLessThan(0)
  })

  it('DB-A-01: 幅 0 でも落ちず、16% を使う', () => {
    // Given: 測れなかった幅
    // When: 右端を求める
    // Then: ゼロ除算せず 84
    expect(playableRightPercent({ width: 0, height: 400 })).toBe(PLAY_AREA_WIDTH)
  })

  it('DB-A-02: 負の幅でも 16% を使う', () => {
    // Given: 不正な幅
    // When: 右端を求める
    // Then: 84
    expect(playableRightPercent({ width: -600, height: 400 })).toBe(PLAY_AREA_WIDTH)
  })

  it('DB-B-01: 帯と 16% が同じ幅のとき、右端は 84', () => {
    // Given: 120px がちょうど 16% になる幅
    const width = DROP_BAND_PX / (1 - PLAY_AREA_WIDTH / 100)
    // When: 右端を求める
    // Then: 84
    expect(playableRightPercent({ width, height: 400 })).toBeCloseTo(PLAY_AREA_WIDTH)
  })

  it('DB-N-05: 文字を大きくして帯が 180px になっても、果物はその左で止まる', () => {
    // Given: 根の文字サイズ 24px では 7.5rem が 180px になる
    const area = { width: 600, height: 400, dropBandPx: 180 }
    // When: 右端を求め、畑を作る
    // Then: 120px ではなく、測った 180px を空ける
    expect(playableRightPercent(area)).toBeCloseTo(100 - (180 / 600) * 100)
    generateBalancedFruits(12, area).forEach((fruit) => {
      expect(rightEdgePx(fruit, area)).toBeLessThanOrEqual(area.width - 180)
    })
  })

  it('DB-N-06: 折り返した凡例の高さまで、果物の下端を止める', () => {
    // Given: 凡例が 2 行になり、下の余白を含めて 90px を占める
    const area = { width: 320, height: 400, reservedBottomPx: 90 }
    // When: 畑を作る
    // Then: どの果物も凡例の上で止まる（固定の 36px では足りない）
    generateBalancedFruits(12, area).forEach((fruit) => {
      const bottomPx = (fruitFootprint(fruit, area).bottom / 100) * area.height
      expect(bottomPx).toBeLessThanOrEqual(area.height - 90 + 1e-6)
    })
  })

  it('DB-N-07: 下へ動いても、凡例の中には入らない', () => {
    // Given: 凡例が 90px。次の一歩でその中に入る
    const area = { width: 600, height: 400, reservedBottomPx: 90 }
    const fruit: Fruit = {
      id: 1, type: 'apple', size: 'small', x: 20, y: 70, dx: 0, dy: 40,
    }
    // When: 下へ進める
    const next = updateFruitPosition(fruit, 0.5, area)
    // Then: 本体の下端は凡例の上で止まり、上へ跳ね返る
    const bottomPx = (fruitFootprint(next, area).bottom / 100) * area.height
    expect(bottomPx).toBeLessThanOrEqual(area.height - 90 + 1e-6)
    expect(next.dy).toBeLessThan(0)
  })

  it('DB-N-08: 文字が 1.5 倍なら、果物の見積もりも 1.5 倍にして帯の外に置く', () => {
    // Given: 根の文字サイズ 24px（16px の 1.5 倍）。果物の表示も rem で大きくなる
    const area = { width: 600, height: 400, dropBandPx: 180, fontScale: 1.5 }
    const large = { id: 1, type: 'watermelon' as const, size: 'large' as const, x: 0, y: 0, dx: 0, dy: 0 }
    // When: 大きさを見積もり、畑を作る
    // Then: 64px の 1.5 倍で見積もり、その本体が帯に入らない
    expect((fruitFootprint(large, area).right / 100) * area.width).toBeCloseTo(64 * 1.5)
    generateBalancedFruits(12, area).forEach((fruit) => {
      expect(rightEdgePx(fruit, area)).toBeLessThanOrEqual(area.width - 180)
    })
  })

  it('DB-A-06: 文字の倍率が 0 や負なら、1 倍に戻す', () => {
    // Given: 測れなかった倍率
    const large = { id: 1, type: 'apple' as const, size: 'large' as const, x: 0, y: 0, dx: 0, dy: 0 }
    // When: 大きさを見積もる
    // Then: 基準の 64px
    for (const fontScale of [0, -1]) {
      const area = { width: 600, height: 400, fontScale }
      expect((fruitFootprint(large, area).right / 100) * area.width).toBeCloseTo(64)
    }
  })

  it('DB-A-03: 帯の幅が 0 や負なら、120px に戻す', () => {
    // Given: 測れなかった帯
    // When: 右端を求める
    // Then: ゼロ除算せず、既定の 120px を使う
    const width = 600
    const expected = 100 - (DROP_BAND_PX / width) * 100
    expect(playableRightPercent({ width, height: 400, dropBandPx: 0 })).toBeCloseTo(expected)
    expect(playableRightPercent({ width, height: 400, dropBandPx: -180 })).toBeCloseTo(expected)
  })

  it('DB-A-04: 帯がプレイエリアより広くても落ちない', () => {
    // Given: 帯の幅がエリアより大きい
    const area = { width: 100, height: 400, dropBandPx: 180 }
    // When: 右端を求め、畑を作る
    // Then: 百分率は 0 以上で、例外にならない
    expect(playableRightPercent(area)).toBeGreaterThanOrEqual(0)
    expect(() => generateBalancedFruits(4, area)).not.toThrow()
  })

  it('DB-A-05: 凡例の高さが 0 や負なら、既定の 36px に戻す', () => {
    // Given: 測れなかった凡例
    // When: 下端の予約を求める
    // Then: 0 で割らず、既定の高さを使う
    const area = { width: 600, height: 200 }
    const fallback = (PLACEMENT_CONFIG.reservedBottomPx / area.height) * 100
    expect(reservedBandsPercent({ ...area, reservedBottomPx: 0 }).bottom).toBeCloseTo(
      Math.max(PLACEMENT_CONFIG.reservedBottomPercent, fallback)
    )
    expect(reservedBandsPercent({ ...area, reservedBottomPx: -90 }).bottom).toBeCloseTo(
      Math.max(PLACEMENT_CONFIG.reservedBottomPercent, fallback)
    )
  })

  it('DB-B-02: それより 1px 狭いと、帯の幅のほうを空ける', () => {
    // Given: 境界の 1px 内側
    const width = DROP_BAND_PX / (1 - PLAY_AREA_WIDTH / 100) - 1
    // When: 右端を求める
    const right = playableRightPercent({ width, height: 400 })
    // Then: 84 より狭く、帯の左と一致する
    expect(right).toBeLessThan(PLAY_AREA_WIDTH)
    expect(right).toBeCloseTo(100 - (DROP_BAND_PX / width) * 100)
  })
})
