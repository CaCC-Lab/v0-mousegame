import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModeSelector } from '@/components/game/ModeSelector'
import { translations } from '@/lib/i18n/translations'

const t = translations.ja

function setup(overrides: Partial<React.ComponentProps<typeof ModeSelector>> = {}) {
  const onSelectMode = jest.fn()
  render(
    <ModeSelector
      onSelectMode={onSelectMode}
      arcadeBest={0}
      arcadeRank="bronze"
      language="ja"
      t={t}
      {...overrides}
    />
  )
  return { onSelectMode }
}

describe('ModeSelector', () => {
  it('アーケードと練習の2つを選べる', () => {
    setup()
    expect(screen.getByTestId('mode-select-arcade')).toBeInTheDocument()
    expect(screen.getByTestId('mode-select-practice')).toBeInTheDocument()
  })

  it('アーケードを選ぶと arcade で通知される', async () => {
    const user = userEvent.setup()
    const { onSelectMode } = setup()

    await user.click(screen.getByTestId('mode-select-arcade'))

    expect(onSelectMode).toHaveBeenCalledWith('arcade')
  })

  it('練習を選ぶと practice で通知される', async () => {
    const user = userEvent.setup()
    const { onSelectMode } = setup()

    await user.click(screen.getByTestId('mode-select-practice'))

    expect(onSelectMode).toHaveBeenCalledWith('practice')
  })

  it('自己ベストと段位を表示する', () => {
    setup({ arcadeBest: 3200, arcadeRank: 'gold' })
    expect(screen.getByTestId('mode-select-arcade')).toHaveTextContent('3,200')
    expect(screen.getByTestId('mode-select-arcade')).toHaveTextContent('ゴールド')
  })

  it('まだ遊んでいなければベストは表示しない', () => {
    setup({ arcadeBest: 0 })
    expect(screen.getByTestId('mode-select-arcade')).not.toHaveTextContent(t.best)
  })

  it('英語表示では英語の段位名になる', () => {
    setup({ arcadeBest: 3200, arcadeRank: 'gold', language: 'en', t: translations.en })
    expect(screen.getByTestId('mode-select-arcade')).toHaveTextContent('Gold')
  })

  it('アーケードが主役として先に置かれる', () => {
    setup()
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('data-testid', 'mode-select-arcade')
  })
})
