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

  describe('子どもに伝わる表示', () => {
    it('操作名が日本語で表示される', () => {
      const session = createEmptySessionStats()
      render(
        <ResultModal open sessionStats={session} starRating={1} lastSessionStats={null} onClose={() => {}} />
      )

      // click / doubleClick のような英語の識別子をそのまま見せない
      expect(screen.getByText('クリック')).toBeInTheDocument()
      expect(screen.getByText('ダブルクリック')).toBeInTheDocument()
      expect(screen.getByText('右クリック')).toBeInTheDocument()
      expect(screen.getByText('ドラッグ')).toBeInTheDocument()
      expect(screen.queryByText(/doubleClick|rightClick/)).not.toBeInTheDocument()
    })

    it('成功回数に単位がつく', () => {
      const session = createEmptySessionStats()
      session.click.success = 5
      render(
        <ResultModal open sessionStats={session} starRating={1} lastSessionStats={null} onClose={() => {}} />
      )

      expect(screen.getByTestId('success-click')).toHaveTextContent('5かい')
    })

    it('前回比較は矢印だけでなく言葉でも伝える', () => {
      const prev = createEmptySessionStats()
      prev.click.success = 1
      prev.doubleClick.success = 5
      const cur = createEmptySessionStats()
      cur.click.success = 4
      cur.doubleClick.success = 2

      render(
        <ResultModal open sessionStats={cur} starRating={1} lastSessionStats={prev} onClose={() => {}} />
      )

      expect(screen.getByTestId('delta-click')).toHaveTextContent('ふえた')
      expect(screen.getByTestId('delta-doubleClick')).toHaveTextContent('へった')
      expect(screen.getByTestId('delta-rightClick')).toHaveTextContent('おなじ')
    })

    it('初回プレイでは前回比較を出さない', () => {
      // 比べる相手がいないのに「おなじ」と出ると誤解を生む
      render(
        <ResultModal
          open
          sessionStats={createEmptySessionStats()}
          starRating={1}
          lastSessionStats={null}
          onClose={() => {}}
        />
      )

      expect(screen.queryByTestId('delta-click')).not.toBeInTheDocument()
    })

    it('星は獲得数にかかわらず3つ分の枠を見せる', () => {
      render(
        <ResultModal open sessionStats={base} starRating={1} lastSessionStats={null} onClose={() => {}} />
      )

      const stars = screen.getByTestId('star-rating-display').textContent ?? ''
      expect(stars).toBe('★☆☆')
    })

    it('星0でも枠は3つ表示する', () => {
      render(
        <ResultModal open sessionStats={base} starRating={0} lastSessionStats={null} onClose={() => {}} />
      )

      expect(screen.getByTestId('star-rating-display')).toHaveTextContent('☆☆☆')
    })
  })
})
