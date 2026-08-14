import React from 'react'
import { render, screen } from '@testing-library/react'
import { MissHintToast } from '../MissHintToast'
import { translations } from '@/lib/i18n/translations'

/**
 * 誤操作したときに正解を伝える表示（プレイテストの離脱要因への対応）。
 *
 * 初見プレイヤーの証言:「そのブルーベリーの上に『ダブルクリック』でも、
 * 単語がひとつ出てたら続けた。沈黙が引き金」
 * フルーツの名前と、必要な操作の一語が読み取れることが要件。
 */
describe('MissHintToast', () => {
  it('ヒントが無いときは何も出さない', () => {
    const { container } = render(<MissHintToast hint={null} t={translations.ja} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('ブルーベリーを間違えたら「ダブルクリック」と出す', () => {
    render(
      <MissHintToast
        hint={{ id: 1, fruitType: 'blueberry', requiredAction: 'doubleClick' }}
        t={translations.ja}
      />
    )

    const toast = screen.getByTestId('miss-hint')
    expect(toast).toHaveTextContent('ブルーベリー')
    expect(toast).toHaveTextContent('ダブルクリック')
  })

  it('4種類すべてで正解の操作名を出す', () => {
    const cases = [
      { fruitType: 'apple', requiredAction: 'click', word: 'クリック' },
      { fruitType: 'blueberry', requiredAction: 'doubleClick', word: 'ダブルクリック' },
      { fruitType: 'lemon', requiredAction: 'rightClick', word: '右クリック' },
      { fruitType: 'watermelon', requiredAction: 'drop', word: 'ドラッグ' },
    ] as const

    cases.forEach(({ fruitType, requiredAction, word }, i) => {
      const { unmount } = render(
        <MissHintToast hint={{ id: i, fruitType, requiredAction }} t={translations.ja} />
      )
      expect(screen.getByTestId('miss-hint')).toHaveTextContent(word)
      unmount()
    })
  })

  it('英語でも正解の操作名を出す', () => {
    render(
      <MissHintToast
        hint={{ id: 1, fruitType: 'lemon', requiredAction: 'rightClick' }}
        t={translations.en}
      />
    )

    const toast = screen.getByTestId('miss-hint')
    expect(toast).toHaveTextContent(/Right-click/i)
    expect(toast.textContent).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
  })

  it('読み上げにも伝わるよう status として通知する', () => {
    render(
      <MissHintToast
        hint={{ id: 1, fruitType: 'apple', requiredAction: 'click' }}
        t={translations.ja}
      />
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
