import React from 'react'
import { render, screen } from '@testing-library/react'
import { FeverIntro } from '../FeverIntro'
import { translations } from '@/lib/i18n/translations'

/**
 * はじめてフィーバーに入ったときだけ、何が起きたのかを説明する。
 *
 * 説明文は translations.ts の arcadeFever に元からあるのに、
 * ゲーム画面へ出す実装が無かった（#51 で直した操作説明と同じ配線漏れ）。
 * ゲージのラベルだけでは伝わりきらない「何が起きるのか」をここで補う。
 */
describe('FeverIntro', () => {
  it('出さないときは何も描かない', () => {
    const { container } = render(<FeverIntro show={false} t={translations.ja} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('元からある説明文をそのまま見せる', () => {
    render(<FeverIntro show t={translations.ja} />)

    expect(screen.getByTestId('fever-intro')).toHaveTextContent(
      translations.ja.helpContent.arcadeFever
    )
  })

  it('英語でも読める', () => {
    render(<FeverIntro show t={translations.en} />)

    const intro = screen.getByTestId('fever-intro')
    expect(intro).toHaveTextContent(translations.en.helpContent.arcadeFever)
    expect(intro.textContent).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
  })

  it('読み上げにも伝わるよう status として通知する', () => {
    render(<FeverIntro show t={translations.ja} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
