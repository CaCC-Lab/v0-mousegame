/**
 * リワード広告の差し込み口（枠だけ）。
 *
 * CrazyGames の SDK は Full Launch 後に入れるため、ここでは
 * 「広告を出す主体」を差し替えられる形だけ用意しておく。
 * プロバイダが登録されるまで isRewardedBoostAvailable() は false を返し、
 * UI 側は該当ボタンを描画しない（動かないボタンを見せない）。
 */

export type RewardedAdResult = 'rewarded' | 'dismissed' | 'error'

export interface RewardedAdProvider {
  /** 今この瞬間に広告を出せるか */
  isAvailable(): boolean
  /** 広告を表示し、結果を返す */
  show(): Promise<RewardedAdResult>
}

/** 報酬として付与されるスペシャルフルーツ（スコア2倍タイム）の内容 */
export const REWARDED_BOOST = {
  durationMs: 15000,
  scoreMultiplier: 2,
} as const

let provider: RewardedAdProvider | null = null

export function registerRewardedAdProvider(next: RewardedAdProvider): void {
  provider = next
}

export function clearRewardedAdProvider(): void {
  provider = null
}

export function isRewardedBoostAvailable(): boolean {
  return provider !== null && provider.isAvailable()
}

/**
 * 広告を要求し、報酬を付与してよいかを返す。
 * 広告側の失敗でゲームが止まらないよう、例外は握りつぶして false を返す。
 */
export async function requestRewardedBoost(): Promise<boolean> {
  if (!isRewardedBoostAvailable() || !provider) return false

  try {
    const result = await provider.show()
    return result === 'rewarded'
  } catch {
    return false
  }
}
