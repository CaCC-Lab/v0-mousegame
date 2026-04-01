/**
 * AC-3.1〜3.4: 結果画面
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResultModal } from '@/components/game/ResultModal'
import { createEmptySessionStats } from '@/lib/gamificationManager'

describe('ResultModal', () => {
  const base = createEmptySessionStats()

  it('AC-3.1: 操作別成功回数が表示される', () => {
    const session = createEmptySessionStats()
    session.click.success = 3
    session.doubleClick.success = 2
    render(
      <ResultModal
        open
        sessionStats={session}
        starRating={2}
        lastSessionStats={null}
        onClose={() => {}}
      />
    )
    expect(screen.getByTestId('success-click')).toHaveTextContent('3')
    expect(screen.getByTestId('success-doubleClick')).toHaveTextContent('2')
  })

  it('AC-3.4: 星評価が表示される', () => {
    render(
      <ResultModal open sessionStats={base} starRating={3} lastSessionStats={null} onClose={() => {}} />
    )
    expect(screen.getByTestId('star-rating-display').textContent).toContain('★')
  })

  it('AC-3.2: 前回比較の矢印が表示される', () => {
    const prev = createEmptySessionStats()
    prev.click.success = 1
    const cur = createEmptySessionStats()
    cur.click.success = 4
    render(
      <ResultModal open sessionStats={cur} starRating={1} lastSessionStats={prev} onClose={() => {}} />
    )
    expect(screen.getByTestId('delta-click')).toHaveTextContent('↑')
  })

  it('AC-3.3: 励ましメッセージが成績に応じて変わる', () => {
    const { rerender } = render(
      <ResultModal open sessionStats={base} starRating={0} lastSessionStats={null} onClose={() => {}} />
    )
    expect(screen.getByTestId('encouragement-message')).toBeInTheDocument()
    rerender(
      <ResultModal open sessionStats={base} starRating={3} lastSessionStats={null} onClose={() => {}} />
    )
    expect(screen.getByTestId('encouragement-message').textContent).toMatch(/すごい/)
  })

  it('open=false のときは何も表示しない', () => {
    const { container } = render(
      <ResultModal open={false} sessionStats={base} starRating={1} lastSessionStats={null} onClose={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('閉じるボタンで onClose', () => {
    const onClose = jest.fn()
    render(
      <ResultModal open sessionStats={base} starRating={1} lastSessionStats={null} onClose={onClose} />
    )
    fireEvent.click(screen.getByRole('button', { name: /とじる/ }))
    expect(onClose).toHaveBeenCalled()
  })
})
