import {
  REWARDED_BOOST,
  registerRewardedAdProvider,
  clearRewardedAdProvider,
  isRewardedBoostAvailable,
  requestRewardedBoost,
} from '@/lib/ads/rewardedBoost'

describe('rewardedBoost - 広告プロバイダの差し込み口', () => {
  afterEach(() => {
    clearRewardedAdProvider()
  })

  it('プロバイダ未登録では利用不可（SDK導入前はUIを出さない）', () => {
    expect(isRewardedBoostAvailable()).toBe(false)
  })

  it('プロバイダを登録すると利用可能になる', () => {
    registerRewardedAdProvider({
      isAvailable: () => true,
      show: async () => 'rewarded',
    })
    expect(isRewardedBoostAvailable()).toBe(true)
  })

  it('プロバイダが自身を利用不可と申告したら利用不可', () => {
    registerRewardedAdProvider({
      isAvailable: () => false,
      show: async () => 'rewarded',
    })
    expect(isRewardedBoostAvailable()).toBe(false)
  })

  it('未登録のまま要求しても報酬は付与されない', async () => {
    await expect(requestRewardedBoost()).resolves.toBe(false)
  })

  it('視聴完了で報酬が付与される', async () => {
    registerRewardedAdProvider({
      isAvailable: () => true,
      show: async () => 'rewarded',
    })
    await expect(requestRewardedBoost()).resolves.toBe(true)
  })

  it('途中で閉じられたら報酬なし', async () => {
    registerRewardedAdProvider({
      isAvailable: () => true,
      show: async () => 'dismissed',
    })
    await expect(requestRewardedBoost()).resolves.toBe(false)
  })

  it('広告側が例外を投げてもゲームを巻き込まない', async () => {
    registerRewardedAdProvider({
      isAvailable: () => true,
      show: async () => {
        throw new Error('ad network down')
      },
    })
    await expect(requestRewardedBoost()).resolves.toBe(false)
  })

  it('ブースト設定が定義されている', () => {
    expect(REWARDED_BOOST.durationMs).toBeGreaterThan(0)
    expect(REWARDED_BOOST.scoreMultiplier).toBeGreaterThan(1)
  })
})
