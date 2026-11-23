/**
 * ダブルクリックの「はやさ」設定（ゆっくりダブルクリック）。
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---|---|---|---|---|
 * | DC-N-01 | 'normal' | Equivalence – normal | マウス 500ms・タッチ 300ms（従来どおり） | - |
 * | DC-N-02 | 'slow' / 'verySlow' | Equivalence – normal | ふつうより長く、順に長くなる | - |
 * | DC-N-03 | classifyTap 窓ちょうど | Boundary – 窓ちょうど | double | - |
 * | DC-N-04 | classifyTap 窓 +1ms | Boundary – +1 | single | - |
 * | DC-A-01 | 未知の文字列 | Invalid | 'normal' | 古い保存データ |
 * | DC-A-02 | null / undefined | Boundary – NULL | 'normal' | - |
 * | DC-A-03 | 数値・オブジェクト | Invalid type | 'normal' | - |
 * | DC-A-04 | 空文字 | Boundary – 空 | 'normal' | - |
 * | DC-A-05 | classifyTap 直前0 | Boundary – 0 | single | 初回タップ |
 */
import {
  DOUBLE_CLICK_SPEEDS,
  DOUBLE_CLICK_SPEED_ORDER,
  MOUSE_CONFIG,
  TOUCH_CONFIG,
  classifyTap,
  normalizeDoubleClickSpeed,
} from '../touchGestures'

describe('DOUBLE_CLICK_SPEEDS', () => {
  it('DC-N-01: ふつうは従来の待ち時間のまま', () => {
    // Given: ふつう When: 値を見る Then: マウス 500ms・タッチ 300ms
    expect(DOUBLE_CLICK_SPEEDS.normal).toEqual({ mouseWaitMs: MOUSE_CONFIG.doubleClickWaitMs, touchWindowMs: TOUCH_CONFIG.doubleTapMs })
  })

  it('DC-N-02: ゆっくり・もっとゆっくりは、順に長くなる', () => {
    // Given: 並び順 When: 前と比べる Then: マウスもタッチも長くなる
    expect(DOUBLE_CLICK_SPEED_ORDER).toEqual(['normal', 'slow', 'verySlow'])
    for (let i = 1; i < DOUBLE_CLICK_SPEED_ORDER.length; i++) {
      const prev = DOUBLE_CLICK_SPEEDS[DOUBLE_CLICK_SPEED_ORDER[i - 1]]
      const cur = DOUBLE_CLICK_SPEEDS[DOUBLE_CLICK_SPEED_ORDER[i]]
      expect(cur.mouseWaitMs).toBeGreaterThan(prev.mouseWaitMs)
      expect(cur.touchWindowMs).toBeGreaterThan(prev.touchWindowMs)
    }
  })
})

describe('normalizeDoubleClickSpeed', () => {
  it('正しい値はそのまま', () => {
    // Given: 3つの値 When: 正規化 Then: そのまま
    for (const speed of DOUBLE_CLICK_SPEED_ORDER) expect(normalizeDoubleClickSpeed(speed)).toBe(speed)
  })
  it('DC-A-01: 未知の文字列は normal', () => {
    // Given: 'fast' When: 正規化 Then: normal
    expect(normalizeDoubleClickSpeed('fast')).toBe('normal')
  })
  it('DC-A-02: null / undefined は normal', () => {
    // Given: null, undefined When: 正規化 Then: normal
    expect(normalizeDoubleClickSpeed(null)).toBe('normal')
    expect(normalizeDoubleClickSpeed(undefined)).toBe('normal')
  })
  it('DC-A-03: 数値・オブジェクトは normal', () => {
    // Given: 900, {} When: 正規化 Then: normal
    expect(normalizeDoubleClickSpeed(900)).toBe('normal')
    expect(normalizeDoubleClickSpeed({ speed: 'slow' })).toBe('normal')
  })
  it('DC-A-04: 空文字は normal', () => {
    // Given: '' When: 正規化 Then: normal
    expect(normalizeDoubleClickSpeed('')).toBe('normal')
  })
})

describe('classifyTap の判定窓', () => {
  it('DC-N-03: 窓ちょうどは double', () => {
    // Given: 窓 600ms、間隔 600ms When: 判定 Then: double
    expect(classifyTap(1000, 1600, 600)).toBe('double')
  })
  it('DC-N-04: 窓 +1ms は single', () => {
    // Given: 窓 600ms、間隔 601ms When: 判定 Then: single
    expect(classifyTap(1000, 1601, 600)).toBe('single')
  })
  it('窓を省略すると従来の 300ms', () => {
    // Given: 間隔 301ms When: 窓省略で判定 Then: single
    expect(classifyTap(1000, 1000 + TOUCH_CONFIG.doubleTapMs + 1)).toBe('single')
    expect(classifyTap(1000, 1000 + TOUCH_CONFIG.doubleTapMs)).toBe('double')
  })
  it('DC-A-05: 直前のタップが無い（0）なら single', () => {
    // Given: lastTapAt=0 When: 判定 Then: single
    expect(classifyTap(0, 100, 1000)).toBe('single')
  })
})
