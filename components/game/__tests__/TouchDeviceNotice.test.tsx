import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TouchDeviceNotice } from '../TouchDeviceNotice'
import { translations } from '@/lib/i18n/translations'

/**
 * TouchDeviceNoticeの実装テスト（モックなし・matchMediaのみ環境差し替え）
 *
 * タッチのみの端末（hover:none かつ pointer:coarse）に、操作のヒントを一度だけ出す。
 * 4つの操作はタッチでも成立するが「長押しが右クリックの代わり」であることは
 * 触ってみないと分からないため、最初に伝える。
 * iPad+マウスやChromebookのようにポインタがある端末には表示しない。
 */

/** matchMedia を任意の判定結果に差し替える */
function setMatchMedia(matchesTouchOnly: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('hover: none') ? matchesTouchOnly : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as typeof window.matchMedia
}

describe('TouchDeviceNotice', () => {
  it('タッチのみの端末では操作のヒントを表示する', () => {
    setMatchMedia(true)
    render(<TouchDeviceNotice t={translations.ja} />)

    expect(screen.getByRole('note')).toBeInTheDocument()
    // 長押し（右クリックの代わり）とドラッグの案内が要点
    expect(screen.getByText(/ながおし/)).toBeInTheDocument()
  })

  it('ポインタのある端末では何も表示しない', () => {
    setMatchMedia(false)
    render(<TouchDeviceNotice t={translations.ja} />)

    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('閉じるボタンで案内を消せる', () => {
    setMatchMedia(true)
    render(<TouchDeviceNotice t={translations.ja} />)

    fireEvent.click(screen.getByRole('button', { name: /閉じる|close/i }))

    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('英語でも案内を表示できる', () => {
    setMatchMedia(true)
    render(<TouchDeviceNotice t={translations.en} />)

    expect(screen.getByText(/long-press/i)).toBeInTheDocument()
  })
})
