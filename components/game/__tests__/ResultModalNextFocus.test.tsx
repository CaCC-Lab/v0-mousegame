import React from 'react'
import { render, screen } from '@testing-library/react'
import { ResultModal } from '../ResultModal'
import { translations } from '@/lib/i18n/translations'
import type { SessionOperationStats } from '@/types/gamification'

/**
 * 星が付かなかったときに「次はこれを」を一言そえる（プレイテストの指摘への対応）。
 *
 * 「練習結果も星0個で『Here is your practice record』だけ。
 * 　何がダメだったか言われないのに減点される感じ」
 */
const stats = (o: Partial<SessionOperationStats> = {}): SessionOperationStats => ({
  click: { success: 0, fail: 0 },
  doubleClick: { success: 0, fail: 0 },
  rightClick: { success: 0, fail: 0 },
  drop: { success: 0, fail: 0 },
  ...o,
})

describe('ResultModal の次の一歩', () => {
  it('星0のときは次に練習する操作を示す', () => {
    render(
      <ResultModal
        open
        t={translations.ja}
        sessionStats={stats({ click: { success: 3, fail: 0 } })}
        starRating={0}
        lastSessionStats={null}
        onClose={() => {}}
      />
    )

    // クリックはできているので、次はダブルクリック
    const next = screen.getByTestId('result-next-focus')
    expect(next).toHaveTextContent('ダブルクリック')
    expect(next).toHaveTextContent('ブルーベリー')
  })

  it('星が付いたときは出さない（水を差さない）', () => {
    render(
      <ResultModal
        open
        t={translations.ja}
        sessionStats={stats({ click: { success: 10, fail: 0 } })}
        starRating={2}
        lastSessionStats={null}
        onClose={() => {}}
      />
    )

    expect(screen.queryByTestId('result-next-focus')).not.toBeInTheDocument()
  })

  it('英語でも読める', () => {
    render(
      <ResultModal
        open
        t={translations.en}
        sessionStats={stats()}
        starRating={0}
        lastSessionStats={null}
        onClose={() => {}}
      />
    )

    const next = screen.getByTestId('result-next-focus')
    expect(next.textContent).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
    expect(next).toHaveTextContent(/Click/i)
  })
})
