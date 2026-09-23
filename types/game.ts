export type FruitType = 'apple' | 'blueberry' | 'lemon' | 'watermelon'
export type FruitSize = 'small' | 'medium' | 'large'
export type GameState = 'idle' | 'playing' | 'paused'
export type InteractionType = 'click' | 'doubleClick' | 'rightClick' | 'drop'

export interface Fruit {
  id: number
  type: FruitType
  size: FruitSize
  x: number
  y: number
  dx: number
  dy: number
}

export interface HarvestAnimation {
  id: number
  type: FruitType
  x: number
  y: number
}

export interface HarvestedFruits {
  apple: number
  blueberry: number
  lemon: number
  watermelon: number
}

export interface GameScore {
  apple: 10
  blueberry: 20
  lemon: 15
  watermelon: 25
}

export interface GameConfig {
  gameWidth: 100
  gameHeight: 100
  dropAreaWidth: 16
  fruitCount: 10
  gameDuration: 180 // seconds
}

/**
 * 画像の代替テキストや読み上げに使うフルーツの日本語名。
 * フルーツの見た目は絵文字ではなく public/sprites/ のスプライト画像
 * （components/game/FruitSprite.tsx）で描画する。
 */
export const FRUIT_NAME: Record<FruitType, string> = {
  apple: 'りんご',
  blueberry: 'ブルーベリー',
  lemon: 'レモン',
  watermelon: 'スイカ',
}

export const GAME_SCORES: GameScore = {
  apple: 10,
  blueberry: 20,
  lemon: 15,
  watermelon: 25,
}

export const GAME_CONFIG: GameConfig = {
  gameWidth: 100,
  gameHeight: 100,
  dropAreaWidth: 16,
  fruitCount: 10,
  gameDuration: 180,
}

export const PLAY_AREA_WIDTH = GAME_CONFIG.gameWidth - GAME_CONFIG.dropAreaWidth

/**
 * 果物の配置規則（docs/game-spec.md §3、v1.1 計画 G5）。
 *
 * 果物の位置はプレイエリアに対する百分率だが、大きさは px（Tailwind の text-3xl/4xl/5xl）。
 * 百分率に直すための基準は、itch.io の埋め込み（1280×800）でのプレイエリア 1144×660px（2026-09-23 実測）。
 * これより小さい画面では果物が相対的に大きくなるので、gapPercent で余白を取る。
 */
export const PLACEMENT_CONFIG = {
  referenceAreaPx: { width: 1144, height: 660 },
  /** 実測の表示サイズ（39/47/62px）に、影・枠のぶん 2px を足した値 */
  fruitSizePx: { small: 41, medium: 49, large: 64 },
  /** 上端: 収穫カウンター（とステージ目標）の帯 */
  reservedTopPercent: 7,
  /** 下端: 操作の凡例（とりかた）の帯 */
  reservedBottomPercent: 6,
  /**
   * 上下の帯の最低限の高さ（px）。低いプレイエリアでは百分率だけでは足りないので、大きいほうを使う。
   * 実測（2026-09-24）: カウンターの帯 30px、凡例の帯 31px に余白を足した値
   */
  reservedTopPx: 36,
  reservedBottomPx: 36,
  /** 左端からの余白 */
  minLeftPercent: 5,
  /** 果物どうしのすき間 */
  gapPercent: 1,
  /**
   * すき間の最低限（px）。低いプレイエリアでは高さの 1% が 3px しかなく、
   * ブラウザによる描画の大きさの差を吸収できなかった（WebKit で 15 回中1回重なった）
   */
  gapPx: 6,
  /** 空きを探す回数。見つからなければ最も重なりの少ない候補を使う */
  maxAttempts: 150,
} as const

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`
}
/**
 * 誤操作したときに出すヒント。
 *
 * 「そのフルーツには何をすればよかったのか」をその場で伝えるためのもの。
 * 同じ間違いを繰り返しても表示し直せるよう、毎回ちがう id を持たせる。
 */
export interface MissHint {
  id: number
  fruitType: FruitType
  requiredAction: InteractionType
}
