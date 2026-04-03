/**
 * Task 10.5 / design.md §10.4 — レベルアップ演出
 *
 * テスト観点表（抜粋）
 * | Case ID | Input | Expected |
 * |---------|-------|----------|
 * | TC-10.5a | show=true | 演出表示 |
 * | TC-10.5b | show=false | 非表示 |
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { LevelUpNotification } from '@/components/game/LevelUpNotification'

describe('LevelUpNotification (Task 10.5)', () => {
  it('show=true のとき祝福演出が表示される', () => {
    // Given: operationType / newLevel / show=true
    // When: 描画
    // Then: 通知領域と操作・レベルが見える
    render(<LevelUpNotification operationType="click" newLevel={3} show />)

    expect(screen.getByTestId('level-up-notification')).toBeInTheDocument()
    expect(screen.getByTestId('level-up-operation')).toHaveTextContent('クリック')
    expect(screen.getByTestId('level-up-new-level')).toHaveTextContent('Lv.3')
  })

  it('show=false のときは表示されない', () => {
    // Given: show=false
    // When: 描画
    // Then: 通知 root が DOM にない
    render(<LevelUpNotification operationType="drop" newLevel={5} show={false} />)

    expect(screen.queryByTestId('level-up-notification')).not.toBeInTheDocument()
  })
})
