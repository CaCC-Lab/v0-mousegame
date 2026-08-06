/**
 * タッチ操作をマウス4操作へ対応づけるための純粋ロジック。
 *
 * 対応づけ:
 *   タップ         → クリック（りんご）
 *   すばやく2回タップ → ダブルクリック（ブルーベリー）
 *   長押し         → 右クリック相当（レモン）
 *   なぞって運ぶ    → ドラッグ＆ドロップ（スイカ）
 *
 * 判定そのものはここに閉じ込め、React 側（components/Fruit.tsx など）は
 * ポインタイベントを渡すだけにする。
 */

export interface TouchConfig {
  /** 長押しと見なす押下時間（ミリ秒） */
  longPressMs: number
  /** ダブルタップと見なす2回目までの猶予（ミリ秒） */
  doubleTapMs: number
  /** タップではなくドラッグと見なす移動距離（px） */
  dragThresholdPx: number
  /** タッチ後に飛んでくる合成マウスイベントを無視する時間（ミリ秒） */
  ghostClickSuppressMs: number
}

export const TOUCH_CONFIG: TouchConfig = {
  longPressMs: 450,
  doubleTapMs: 300,
  dragThresholdPx: 8,
  ghostClickSuppressMs: 700,
}

export type TapKind = 'single' | 'double'

/**
 * 直前のタップ時刻から、今回のタップがシングルかダブルかを判定する。
 */
export function classifyTap(lastTapAt: number, now: number): TapKind {
  if (lastTapAt <= 0) return 'single'
  return now - lastTapAt <= TOUCH_CONFIG.doubleTapMs ? 'double' : 'single'
}

/**
 * 指の移動量がドラッグ開始のしきい値を超えたか。
 */
export function exceedsDragThreshold(dx: number, dy: number): boolean {
  return Math.sqrt(dx * dx + dy * dy) >= TOUCH_CONFIG.dragThresholdPx
}

/**
 * 押下開始からの経過時間が長押しに達したか。
 */
export function isLongPressReached(pressStartAt: number, now: number): boolean {
  return now - pressStartAt >= TOUCH_CONFIG.longPressMs
}

/**
 * タッチ直後にブラウザが合成するマウスイベント（ゴーストクリック）かどうか。
 * 同じ1回の操作を2回数えてしまうのを防ぐ。
 */
export function isGhostClick(lastTouchAt: number, now: number): boolean {
  if (lastTouchAt <= 0) return false
  return now - lastTouchAt <= TOUCH_CONFIG.ghostClickSuppressMs
}
