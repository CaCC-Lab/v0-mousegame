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

export interface MouseConfig {
  /**
   * ブルーベリーへの1回目のクリックを、ダブルクリックの2回目が来るまで保留する時間（ミリ秒）。
   *
   * ブラウザはダブルクリックのとき click → click → dblclick の順に発火するので、
   * 1回目の click をすぐ判定すると、正しいダブルクリックの途中がミスとして数えられる。
   * OS の標準的なダブルクリック間隔（Windows 既定 500ms）より短いと、
   * ゆっくりダブルクリックする子の1回目が先にミスとして確定するので、それ以上にする。
   */
  doubleClickWaitMs: number
}

export const MOUSE_CONFIG: MouseConfig = {
  doubleClickWaitMs: 500,
}

/** ダブルクリックの「はやさ」設定。ゆっくりダブルクリックする子のために待ち時間を長くする */
export type DoubleClickSpeed = 'normal' | 'slow' | 'verySlow'

export interface DoubleClickTiming {
  /** マウス: ブルーベリーへの1回目のクリックを保留する時間（ミリ秒）。この間の2回目はダブルクリック */
  mouseWaitMs: number
  /** タッチ: ダブルタップとみなす2回のタップの間隔（ミリ秒） */
  touchWindowMs: number
}

export const DOUBLE_CLICK_SPEED_ORDER: readonly DoubleClickSpeed[] = ['normal', 'slow', 'verySlow']

export const DOUBLE_CLICK_SPEEDS: Record<DoubleClickSpeed, DoubleClickTiming> = {
  normal: { mouseWaitMs: MOUSE_CONFIG.doubleClickWaitMs, touchWindowMs: 300 },
  slow: { mouseWaitMs: 900, touchWindowMs: 600 },
  verySlow: { mouseWaitMs: 1400, touchWindowMs: 1000 },
}

/** 保存データなど信用できない値を DoubleClickSpeed にそろえる。知らない値は 'normal' */
export function normalizeDoubleClickSpeed(value: unknown): DoubleClickSpeed {
  return typeof value === 'string' && (DOUBLE_CLICK_SPEED_ORDER as readonly string[]).includes(value)
    ? (value as DoubleClickSpeed)
    : 'normal'
}

export type TapKind = 'single' | 'double'

/**
 * 直前のタップ時刻から、今回のタップがシングルかダブルかを判定する。
 */
export function classifyTap(lastTapAt: number, now: number, windowMs: number = TOUCH_CONFIG.doubleTapMs): TapKind {
  if (lastTapAt <= 0) return 'single'
  return now - lastTapAt <= windowMs ? 'double' : 'single'
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
