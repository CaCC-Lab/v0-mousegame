import React from 'react'
import { render, screen } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import { FruitHarvestGame } from '../FruitHarvestGame'

/**
 * タイトルのりんごをスプライト画像で描く検証。
 *
 * 以前は絵文字フォント（Noto Color Emoji から4文字を抜いた woff）を同梱して
 * 絵柄を揃えていたが、Firefox は CBDT/CBLC のWebフォントを読めず
 * 「downloadable font: rejected by sanitizer」でコンソールエラーになっていた。
 * フォントが担っていた4文字のうち実際に画面へ出るのはタイトルのりんごだけなので、
 * 他のフルーツと同じスプライト画像に統一してフォントごと廃止する。
 */
describe('タイトルのりんご', () => {
  it('絵文字ではなくスプライト画像で描画する', () => {
    render(<FruitHarvestGame />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.querySelector('img[src*="apple"]')).toBeInTheDocument()
    // 環境で絵柄が変わる絵文字は残さない
    expect(heading.textContent).not.toMatch(/🍎/)
  })

  it('絵文字フォントを同梱しない', () => {
    const root = path.join(__dirname, '..', '..')
    expect(fs.existsSync(path.join(root, 'app/fonts/fruit-emoji.woff'))).toBe(false)

    const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf-8')
    expect(layout).not.toMatch(/fruit-emoji|fruitEmoji/)

    const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf-8')
    expect(css).not.toMatch(/--font-fruit-emoji/)
  })
})
