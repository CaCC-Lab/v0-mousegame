import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TouchDeviceNotice } from '../TouchDeviceNotice'
import { translations } from '@/lib/i18n/translations'

/**
 * TouchDeviceNoticeの実装テスト（モックなし・matchMediaのみ環境差し替え）
 *
 * Issue #42 でタッチ操作（タップ／ダブルタップ／長押し／なぞる）に対応したため、
 * この案内は「マウスのあるパソコンで開いてね」という排除の案内ではなく、
 * タッチのみの端末（hover:none かつ pointer:coarse）で開いた人への
 * 操作ヒントとして出す。ポインタのある端末には出さない。
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
  it('タッチのみの端末では操作ヒントを表示する', () => {
    setMatchMedia(true)
    render(<TouchDeviceNotice t={translations.ja} />)

    expect(screen.getByRole('note')).toBeInTheDocument()
    expect(screen.getByText(translations.ja.touchDeviceNotice)).toBeInTheDocument()
  })

  it('ヒントには長押し（右クリックの代わり）が含まれる', () => {
    setMatchMedia(true)
    render(<TouchDeviceNotice t={translations.ja} />)

    expect(screen.getByRole('note')).toHaveTextContent(/ながおし/)
  })

  it('マウスのある端末では何も表示しない', () => {
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

    expect(screen.getByRole('note')).toHaveTextContent(/long-press/i)
  })
})
