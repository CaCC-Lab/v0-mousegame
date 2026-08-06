import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TouchDeviceNotice } from '../TouchDeviceNotice'
import { translations } from '@/lib/i18n/translations'

/**
 * TouchDeviceNoticeの実装テスト（モックなし・matchMediaのみ環境差し替え）
 *
 * このゲームはマウス操作の練習ツールなので、マウスのない端末
 * （タッチのみ: hover:none かつ pointer:coarse）で開いた人には
 * 「マウスのあるパソコンで開いてね」と案内する。
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
  it('マウスのない端末では案内を表示する', () => {
    setMatchMedia(true)
    render(<TouchDeviceNotice t={translations.ja} />)

    expect(screen.getByRole('note')).toBeInTheDocument()
    expect(screen.getByText(/マウス/)).toBeInTheDocument()
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

    expect(screen.getByText(/mouse/i)).toBeInTheDocument()
  })
})
