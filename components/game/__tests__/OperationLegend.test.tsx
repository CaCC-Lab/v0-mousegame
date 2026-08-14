import React from 'react'
import { render, screen } from '@testing-library/react'
import { OperationLegend } from '../OperationLegend'
import { translations } from '@/lib/i18n/translations'

/**
 * どのフルーツに何をすればいいかを常時見せる凡例（プレイテストの指摘への対応）。
 *
 * 「『どのフルーツに何をすればいいか』は最後まで画面から読めなかった」
 * 「ただのクリックゲーだと思ってた。気づいたのはタイマー残り十数秒で、もう遅い」
 *
 * 説明文は translations.ts に元からあったが、ゲーム画面に出す実装が無かった。
 */
describe('OperationLegend', () => {
  it('4種類すべての操作を示す', () => {
    render(<OperationLegend t={translations.ja} />)

    const legend = screen.getByTestId('operation-legend')
    expect(legend).toHaveTextContent('クリック')
    expect(legend).toHaveTextContent('ダブルクリック')
    expect(legend).toHaveTextContent('右クリック')
    expect(legend).toHaveTextContent('ドラッグ')
  })

  it('フルーツの絵柄を添えて、どれの話か分かるようにする', () => {
    const { container } = render(<OperationLegend t={translations.ja} />)

    const sprites = container.querySelectorAll('img[src*="sprites/"]')
    expect(sprites).toHaveLength(4)
  })

  it('フルーツと操作の対応が得点計算と一致する', () => {
    render(<OperationLegend t={translations.ja} />)

    // りんご=クリック / ブルーベリー=ダブルクリック / レモン=右クリック / スイカ=ドラッグ
    expect(screen.getByTestId('legend-apple')).toHaveTextContent('クリック')
    expect(screen.getByTestId('legend-blueberry')).toHaveTextContent('ダブルクリック')
    expect(screen.getByTestId('legend-lemon')).toHaveTextContent('右クリック')
    expect(screen.getByTestId('legend-watermelon')).toHaveTextContent('ドラッグ')
  })

  it('英語でも読める', () => {
    render(<OperationLegend t={translations.en} />)

    const legend = screen.getByTestId('operation-legend')
    expect(legend).toHaveTextContent(/Double-click/i)
    expect(legend.textContent).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
  })
})
