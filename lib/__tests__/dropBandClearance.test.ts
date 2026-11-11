import { generateBalancedFruits, fruitFootprint, playableRightPercent, relayoutFruits, updateFruitPosition } from '../gameLogic'
import { DROP_BAND_PX } from '../dropBand'
import { PLAY_AREA_WIDTH, type Fruit } from '@/types/game'

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
