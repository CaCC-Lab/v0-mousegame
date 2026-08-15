import React from 'react'
import { render, screen } from '@testing-library/react'
import { ArcadeHUD } from '../ArcadeHUD'
import { translations } from '@/lib/i18n/translations'

/**
 * フィーバーゲージが何なのかを画面から読めるようにする（2人目のプレイテストの指摘）。
 *
 * 「右上のオレンジの細い横バー（🖱アイコン付き）。じわじわ伸びるけど満タンに
 * 　なっても何も起きない。あと何で発動するかは画面から読めない」
 * 「Feverが何なのか最後まで分からなかったのも『まあいいや』になった」
 *
 * 説明文は translations.ts の arcadeFever に元からあるが、画面へ出していなかった。
 */
describe('ArcadeHUD のフィーバーゲージ', () => {
  const base = { combo: 0, comboMultiplier: 1, isFever: false, t: translations.ja }

  it('何のゲージなのか名前が読める', () => {
    render(<ArcadeHUD {...base} feverGauge={0} />)

    expect(screen.getByTestId('fever-label')).toHaveTextContent('フィーバー')
  })

  it('溜まっていないときは、どうすれば溜まるのかを示す', () => {
    render(<ArcadeHUD {...base} feverGauge={0} />)

    // 「コンボをつなぐと溜まる」ことが読める
    expect(screen.getByTestId('fever-hint')).toHaveTextContent('コンボ')
  })

  it('フィーバー中は何が起きているのかを示す', () => {
    render(<ArcadeHUD {...base} feverGauge={100} isFever />)

    // 得点が2倍になっていることが読める
    expect(screen.getByTestId('fever-hint')).toHaveTextContent('2ばい')
  })

  it('英語でも読める', () => {
    render(<ArcadeHUD {...base} t={translations.en} feverGauge={0} />)

    expect(screen.getByTestId('fever-label')).toHaveTextContent(/Fever/i)
    expect(screen.getByTestId('fever-hint').textContent).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
  })

  it('ゲージの進みが数でも分かる', () => {
    render(<ArcadeHUD {...base} feverGauge={40} />)

    const gauge = screen.getByTestId('arcade-fever-gauge')
    expect(gauge).toHaveAttribute('aria-valuenow', '40')
  })
})
