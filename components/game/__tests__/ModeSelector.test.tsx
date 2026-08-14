import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModeSelector } from '../ModeSelector'
import { translations } from '@/lib/i18n/translations'

/**
 * モード選択の入口（プレイテストの指摘への対応）。
 *
 * 「Arcade と Practice のカードを押した瞬間にタイマーが走り出して、
 * 　下にある Start ボタンは何だったのか分からないまま時間を溶かす」
 *
 * カードは「選ぶ」だけ、開始は「はじめる」に分ける。
 */
describe('ModeSelector', () => {
  const baseProps = {
    arcadeBest: 0,
    arcadeRank: 'bronze' as const,
    language: 'ja' as const,
    t: translations.ja,
  }

  it('カードを押しても開始しない（選ぶだけ）', async () => {
    const user = userEvent.setup()
    const onSelectMode = jest.fn()
    const onStart = jest.fn()
    render(<ModeSelector {...baseProps} selectedMode="arcade" onSelectMode={onSelectMode} onStart={onStart} />)

    await user.click(screen.getByTestId('mode-select-practice'))

    expect(onSelectMode).toHaveBeenCalledWith('practice')
    expect(onStart).not.toHaveBeenCalled()
  })

  it('「はじめる」を押すと開始する', async () => {
    const user = userEvent.setup()
    const onStart = jest.fn()
    render(<ModeSelector {...baseProps} selectedMode="arcade" onSelectMode={jest.fn()} onStart={onStart} />)

    await user.click(screen.getByTestId('mode-start'))

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('選んでいるモードが見た目で分かる', () => {
    const { rerender } = render(
      <ModeSelector {...baseProps} selectedMode="arcade" onSelectMode={jest.fn()} onStart={jest.fn()} />
    )

    expect(screen.getByTestId('mode-select-arcade')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('mode-select-practice')).toHaveAttribute('aria-pressed', 'false')

    rerender(<ModeSelector {...baseProps} selectedMode="practice" onSelectMode={jest.fn()} onStart={jest.fn()} />)

    expect(screen.getByTestId('mode-select-arcade')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('mode-select-practice')).toHaveAttribute('aria-pressed', 'true')
  })

  it('開始ボタンには「はじめる」と書いてある', () => {
    render(<ModeSelector {...baseProps} selectedMode="arcade" onSelectMode={jest.fn()} onStart={jest.fn()} />)

    expect(screen.getByTestId('mode-start')).toHaveTextContent(translations.ja.start)
  })

  it('英語でも開始ボタンが読める', () => {
    render(
      <ModeSelector {...baseProps} t={translations.en} selectedMode="arcade" onSelectMode={jest.fn()} onStart={jest.fn()} />
    )

    expect(screen.getByTestId('mode-start')).toHaveTextContent(translations.en.start)
  })
})
