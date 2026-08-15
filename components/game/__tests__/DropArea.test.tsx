import React from 'react'
import { render, screen } from '@testing-library/react'
import { DropArea } from '../DropArea'
import { translations } from '@/lib/i18n/translations'

/**
 * ドロップエリアの見え方（プレイテストの指摘への対応）。
 *
 * 「右端の Drop Area も縦書きで潰れてて、最初は飾りに見えた」
 *
 * 原因は writing-vertical というクラスが CSS に存在せず、
 * 幅80pxの中で文字が折り返して「ドロッ / プエリ / ア」と割れていたこと。
 * 文字を1行ずつ縦に積み、スイカの絵を添えて「ここへ運ぶ場所」だと分かるようにする。
 */
describe('DropArea', () => {
  it('横書きで読める短い語を出す', () => {
    render(<DropArea t={translations.ja} />)

    const label = screen.getByTestId('drop-area-label')
    expect(label).toHaveTextContent('ここへ')
    // 縦積みにすると読みにくいので、1行に収まる語だけを出す
    expect(label).not.toHaveClass('flex-col')
  })

  it('読み上げには何の場所か分かる語を伝える', () => {
    render(<DropArea t={translations.ja} />)

    expect(screen.getByTestId('drop-area')).toHaveAccessibleName(translations.ja.dropArea)
  })

  it('スイカを運ぶ場所だと絵でも分かる', () => {
    const { container } = render(<DropArea t={translations.ja} />)

    expect(container.querySelector('img[src*="watermelon"]')).toBeInTheDocument()
  })

  it('英語でも読める', () => {
    render(<DropArea t={translations.en} />)

    expect(screen.getByTestId('drop-area-label')).toHaveTextContent(/DROP/i)
  })

  it('ドロップ判定に使う目印を持つ', () => {
    render(<DropArea t={translations.ja} />)

    expect(screen.getByTestId('drop-area')).toBeInTheDocument()
  })
})
