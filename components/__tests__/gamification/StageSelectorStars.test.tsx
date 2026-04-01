/**
 * AC-1.2: ステージ選択画面に獲得星
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { StageSelector } from '@/components/StageSelector'
import { Stage } from '@/types/stage'

const mockStages: Stage[] = [
  {
    number: 1,
    name: 'S1',
    description: 'd',
    targetScore: 100,
    targetFruits: { total: 10 },
    timeLimit: 60,
    unlocked: true,
    completed: true,
    highScore: 10,
    difficulty: { fruitCount: 8, fruitSpeed: 1, powerUpSpawnRate: 0.1 },
  },
]

describe('StageSelector stage stars (AC-1.2)', () => {
  it('stageStars が渡されるとステージ1の星が表示される', () => {
    render(
      <StageSelector
        stages={mockStages}
        currentStage={1}
        stageStars={{ 1: 3 }}
        onSelectStage={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getByTestId('stage-stars-1')).toHaveTextContent('★★★')
  })

  it('星0のステージは星表示が出ない', () => {
    render(
      <StageSelector
        stages={mockStages}
        currentStage={1}
        stageStars={{ 1: 0 }}
        onSelectStage={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.queryByTestId('stage-stars-1')).not.toBeInTheDocument()
  })

  it('stageStars 未指定でも従来どおり表示される', () => {
    render(
      <StageSelector stages={mockStages} currentStage={1} onSelectStage={() => {}} onClose={() => {}} />
    )
    expect(screen.queryByTestId('stage-stars-1')).not.toBeInTheDocument()
  })
})
