import { gainFeverGauge, isFeverReady, getComboMultiplier } from '../arcadeManager'
import { ARCADE_CONFIG } from '@/types/arcade'

/**
 * 初見プレイヤーが60秒で1回はフィーバーに到達できることの検証。
 *
 * 4人目のプレイテストで、60秒のアーケードを通して一度も発動できなかった。
 * 「FEVERのバーは半分くらいまで行ったけど、最後まで発動しなかった。
 * 　60秒で一度も起きないなら、出さない方がいい」
 *
 * 実績（1プレイ80〜100点 ≒ 成功5〜6回）に対し、当時の設定では
 * コンボが切れ続けると13回の成功が必要で、届きようがなかった。
 *
 * 説明を足すだけでは意味がないので、届く数値に調整する。
 * ここは「何回の成功で届くか」を数値として固定しておく回帰テスト。
 */

/** missEvery 回に1回ミスする想定で、満タンまでに必要な成功回数を数える */
function successesUntilFever(missEvery: number): number {
  let gauge = 0
  let combo = 0
  let successes = 0

  for (let action = 1; action <= 500 && !isFeverReady(gauge); action++) {
    if (missEvery > 0 && action % missEvery === 0) {
      combo = 0 // ミス: コンボだけ切れる（ゲージは減らない）
      continue
    }
    combo++
    successes++
    gauge = gainFeverGauge(gauge, getComboMultiplier(combo))
  }

  return successes
}

describe('フィーバーへの到達しやすさ', () => {
  it('コンボが一度も続かなくても、7回の成功で届く', () => {
    // 初見はミスが多くコンボが育たない。この最悪ケースが上限になる
    const worstCase = Math.ceil(
      ARCADE_CONFIG.feverGaugeMax /
        (ARCADE_CONFIG.feverGainBase + ARCADE_CONFIG.feverGainPerMultiplier)
    )

    expect(worstCase).toBe(7)
  })

  it('3回に1回ミスしても7回の成功で届く', () => {
    expect(successesUntilFever(3)).toBe(7)
  })

  it('うまくつなげば6回の成功で届く（コンボを繋ぐ意味は残す）', () => {
    expect(successesUntilFever(0)).toBe(6)
  })

  it('初見の実績（60秒で成功5〜6回）から見て、手が届く範囲にある', () => {
    // 届かない設定に戻ってしまったら気づけるようにしておく
    expect(successesUntilFever(3)).toBeLessThanOrEqual(8)
  })

  it('コンボを繋いだほうが早く溜まる', () => {
    expect(successesUntilFever(0)).toBeLessThan(successesUntilFever(3))
  })
})
