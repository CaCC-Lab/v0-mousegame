import React from 'react'
import { render, screen } from '@testing-library/react'
import { StreakIndicator } from '../StreakIndicator'
import { translations } from '@/lib/i18n/translations'

/**
 * 連続成功が途切れたことに気づけるようにする（2人目のプレイテストの指摘）。
 *
 * 「Streak表示が薄い枠で、ミスって0になったのに気づくのが遅れた」
 *
 * 積み上げていたものが失われた瞬間だけ、はっきり伝える。
 */
describe('StreakIndicator の途切れ表示', () => {
  it('ふつうに増えているときは何も起きない', () => {
    const { rerender } = render(<StreakIndicator streak={3} lastBonus={null} />)
    rerender(<StreakIndicator streak={4} lastBonus={null} />)

    expect(screen.getByTestId('streak-count')).not.toHaveAttribute('data-broken', 'true')
  })

  it('積み上げていたのに0になったら、途切れたことを示す', () => {
    const { rerender } = render(<StreakIndicator streak={5} lastBonus={null} />)
    rerender(<StreakIndicator streak={0} lastBonus={null} />)

    expect(screen.getByTestId('streak-count')).toHaveAttribute('data-broken', 'true')
  })

  it('もともと0なら、0のままでも途切れとは言わない', () => {
    const { rerender } = render(<StreakIndicator streak={0} lastBonus={null} />)
    rerender(<StreakIndicator streak={0} lastBonus={null} />)

    expect(screen.getByTestId('streak-count')).not.toHaveAttribute('data-broken', 'true')
  })

  it('次に成功したら、途切れの表示は消える', () => {
    const { rerender } = render(<StreakIndicator streak={5} lastBonus={null} />)
    rerender(<StreakIndicator streak={0} lastBonus={null} />)
    expect(screen.getByTestId('streak-count')).toHaveAttribute('data-broken', 'true')

    rerender(<StreakIndicator streak={1} lastBonus={null} />)

    expect(screen.getByTestId('streak-count')).not.toHaveAttribute('data-broken', 'true')
  })

  it('途切れたことを読み上げにも伝える', () => {
    const { rerender } = render(<StreakIndicator streak={5} lastBonus={null} t={translations.ja} />)
    rerender(<StreakIndicator streak={0} lastBonus={null} t={translations.ja} />)

    expect(screen.getByTestId('streak-broken')).toHaveTextContent('とぎれた')
  })

  it('英語でも読める', () => {
    const { rerender } = render(<StreakIndicator streak={5} lastBonus={null} t={translations.en} />)
    rerender(<StreakIndicator streak={0} lastBonus={null} t={translations.en} />)

    const broken = screen.getByTestId('streak-broken')
    expect(broken.textContent).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
  })
})
