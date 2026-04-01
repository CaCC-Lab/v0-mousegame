/**
 * AC-2.2: バッジ獲得時の祝福演出
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BadgeNotification } from '@/components/game/BadgeNotification'
import { BADGE_DEFINITIONS } from '@/types/gamification'

describe('BadgeNotification', () => {
  const badge = BADGE_DEFINITIONS[0]

  it('show=true のとき祝福メッセージが表示される', () => {
    render(<BadgeNotification badge={badge} show />)
    expect(screen.getByTestId('badge-notification')).toBeInTheDocument()
    expect(screen.getByTestId('badge-notification-title')).toHaveTextContent(badge.name)
  })

  it('show=false のときは表示されない', () => {
    render(<BadgeNotification badge={badge} show={false} />)
    expect(screen.queryByTestId('badge-notification')).not.toBeInTheDocument()
  })

  it('badge=null のときは表示されない', () => {
    render(<BadgeNotification badge={null} show />)
    expect(screen.queryByTestId('badge-notification')).not.toBeInTheDocument()
  })
})
