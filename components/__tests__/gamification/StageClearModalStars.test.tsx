/**
 * AC-1.1（クリア時の星表示のUI）
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { StageClearModal } from '@/components/game/StageClearModal'

const t = {
  stageClear: 'クリア',
  stage: 'ステージ',
  stageCleared: '完了',
  nextStage: '次',
  close: '閉じる',
}

describe('StageClearModal star rating', () => {
  it('starRating>0 のとき星が表示される', () => {
    render(
      <StageClearModal
        show
        currentStage={1}
        starRating={3}
        onNextStage={() => {}}
        onClose={() => {}}
        t={t}
      />
    )
    expect(screen.getByTestId('stage-clear-star-rating')).toHaveTextContent('★★★')
  })

  it('starRating=0 のとき星は非表示', () => {
    render(
      <StageClearModal
        show
        currentStage={1}
        starRating={0}
        onNextStage={() => {}}
        onClose={() => {}}
        t={t}
      />
    )
    expect(screen.queryByTestId('stage-clear-star-rating')).not.toBeInTheDocument()
  })
})
