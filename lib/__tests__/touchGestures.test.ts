import {
  TOUCH_CONFIG,
  classifyTap,
  exceedsDragThreshold,
  isGhostClick,
  isLongPressReached,
} from '@/lib/touchGestures'

describe('touchGestures - タップ判定', () => {
  it('前回タップがなければシングルタップ', () => {
    expect(classifyTap(0, 1000)).toBe('single')
  })

  it('猶予内の2回目はダブルタップ', () => {
    expect(classifyTap(1000, 1000 + TOUCH_CONFIG.doubleTapMs - 1)).toBe('double')
  })

  it('猶予を超えたらシングルタップ', () => {
    expect(classifyTap(1000, 1000 + TOUCH_CONFIG.doubleTapMs + 1)).toBe('single')
  })
})

describe('touchGestures - ドラッグ判定', () => {
  it('わずかな指ブレはドラッグにしない', () => {
    expect(exceedsDragThreshold(1, 1)).toBe(false)
  })

  it('しきい値を超えた移動はドラッグ', () => {
    expect(exceedsDragThreshold(TOUCH_CONFIG.dragThresholdPx + 1, 0)).toBe(true)
    expect(exceedsDragThreshold(0, -(TOUCH_CONFIG.dragThresholdPx + 1))).toBe(true)
  })

  it('斜め移動も距離で判定する', () => {
    expect(exceedsDragThreshold(TOUCH_CONFIG.dragThresholdPx, TOUCH_CONFIG.dragThresholdPx)).toBe(true)
  })
})

describe('touchGestures - 長押し判定', () => {
  it('規定時間に達したら長押し', () => {
    expect(isLongPressReached(0, TOUCH_CONFIG.longPressMs)).toBe(true)
  })

  it('規定時間未満は長押しではない', () => {
    expect(isLongPressReached(0, TOUCH_CONFIG.longPressMs - 1)).toBe(false)
  })
})

describe('touchGestures - ゴーストクリック抑止', () => {
  it('タッチ直後に来たマウスイベントは無視する', () => {
    expect(isGhostClick(1000, 1000 + 50)).toBe(true)
  })

  it('十分に時間が空いていれば本物のマウス操作として扱う', () => {
    expect(isGhostClick(1000, 1000 + TOUCH_CONFIG.ghostClickSuppressMs + 1)).toBe(false)
  })

  it('タッチ履歴がなければ抑止しない', () => {
    expect(isGhostClick(0, 1000)).toBe(false)
  })
})
