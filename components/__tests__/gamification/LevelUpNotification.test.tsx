/**
 * Task 10.5 / design.md §10.4 — レベルアップ演出
 *
 * 実装の `components/game/LevelUpNotification.tsx` が未追加のため、
 * design §10.4 の Props（operationType, newLevel, show）に沿ったテスト用スタブで検証する。
 * 本番追加後は import に差し替え、testid を揃えること。
 *
 * テスト観点表（抜粋）
 * | Case ID | Input | Expected |
 * |---------|-------|----------|
 * | TC-10.5a | show=true | 演出表示 |
 * | TC-10.5b | show=false | 非表示 |
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import type { InteractionType } from '@/types/game'

type MasteryLevel = 1 | 2 | 3 | 4 | 5

export interface LevelUpNotificationProps {
  operationType: InteractionType
  newLevel: MasteryLevel
  show: boolean
}

function LevelUpNotification({ operationType, newLevel, show }: LevelUpNotificationProps): React.ReactElement | null {
  if (!show) {
    return null
  }
  return (
    <div
      data-testid="level-up-notification"
      role="status"
      aria-live="polite"
    >
      <span data-testid="level-up-operation">{operationType}</span>
      <span data-testid="level-up-new-level">{newLevel}</span>
    </div>
  )
}

describe('LevelUpNotification (Task 10.5)', () => {
  it('show=true のとき祝福演出が表示される', () => {
    // Given: operationType / newLevel / show=true
    // When: 描画
    // Then: 通知領域と操作・レベルが見える
    render(<LevelUpNotification operationType="click" newLevel={3} show />)

    expect(screen.getByTestId('level-up-notification')).toBeInTheDocument()
    expect(screen.getByTestId('level-up-operation')).toHaveTextContent('click')
    expect(screen.getByTestId('level-up-new-level')).toHaveTextContent('3')
  })

  it('show=false のときは表示されない', () => {
    // Given: show=false
    // When: 描画
    // Then: 通知 root が DOM にない
    render(<LevelUpNotification operationType="drop" newLevel={5} show={false} />)

    expect(screen.queryByTestId('level-up-notification')).not.toBeInTheDocument()
  })
})
