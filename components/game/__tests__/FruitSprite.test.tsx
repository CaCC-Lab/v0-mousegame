import React from 'react'
import { render, screen } from '@testing-library/react'
import { FruitSprite } from '../FruitSprite'
import { FRUIT_NAME } from '@/types/game'

/**
 * FruitSpriteの実装テスト（モックなし）
 *
 * フルーツは絵文字ではなく同梱のスプライト画像で描画する。
 * 絵文字はOSごとに絵柄が変わるうえ、支援技術には「赤いりんご」のような
 * 汎用的な読み上げしかできない。画像にして日本語の名前をaltに持たせる。
 */
describe('FruitSprite', () => {
  it.each([
    ['apple', 'りんご'],
    ['blueberry', 'ブルーベリー'],
    ['lemon', 'レモン'],
    ['watermelon', 'スイカ'],
  ] as const)('%s のスプライトを名前つきで描画する', (type, name) => {
    render(<FruitSprite type={type} />)

    const img = screen.getByRole('img', { name })
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain(type)
  })

  it('サイズを指定すると幅と高さに反映される', () => {
    render(<FruitSprite type="apple" size={48} />)

    const img = screen.getByRole('img', { name: 'りんご' })
    expect(img).toHaveAttribute('width', '48')
    expect(img).toHaveAttribute('height', '48')
  })

  it('装飾用途では読み上げ対象から外せる', () => {
    // 隣に文字で名前が出ている場合など、二重読み上げを避けたいとき
    render(<FruitSprite type="lemon" decorative />)

    expect(screen.queryByRole('img', { name: 'レモン' })).not.toBeInTheDocument()
    expect(screen.getByAltText('')).toBeInTheDocument()
  })

  it('追加のclassNameを受け取れる', () => {
    render(<FruitSprite type="watermelon" className="drop-shadow" />)

    expect(screen.getByRole('img', { name: 'スイカ' })).toHaveClass('drop-shadow')
  })

  it('FRUIT_NAME は4種類すべての日本語名を持つ', () => {
    expect(FRUIT_NAME).toEqual({
      apple: 'りんご',
      blueberry: 'ブルーベリー',
      lemon: 'レモン',
      watermelon: 'スイカ',
    })
  })
})
