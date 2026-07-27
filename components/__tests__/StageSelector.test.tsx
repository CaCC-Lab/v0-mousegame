import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StageSelector } from '../StageSelector'
import { Stage } from '../../types/stage'

const mockStages: Stage[] = [
  {
    number: 1,
    name: 'フルーツ畑',
    description: 'フルーツ収穫の基本を学びましょう',
    targetScore: 100,
    targetFruits: { total: 10 },
    timeLimit: 60,
    unlocked: true,
    completed: true,
    highScore: 150,
    difficulty: { fruitCount: 8, fruitSpeed: 1.0, powerUpSpawnRate: 0.1 }
  },
  {
    number: 2,
    name: 'リンゴ園',
    description: 'リンゴを中心に収穫しましょう',
    targetScore: 200,
    targetFruits: { apple: 10, total: 20 },
    timeLimit: 90,
    unlocked: true,
    completed: false,
    highScore: 0,
    difficulty: { fruitCount: 10, fruitSpeed: 1.2, powerUpSpawnRate: 0.15 }
  },
  {
    number: 3,
    name: 'ブルーベリー農園',
    description: 'ブルーベリーのダブルクリックに挑戦',
    targetScore: 300,
    targetFruits: { blueberry: 15, total: 30 },
    timeLimit: 90,
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: { fruitCount: 10, fruitSpeed: 1.3, powerUpSpawnRate: 0.2 }
  }
]

describe('StageSelector', () => {
  const mockOnSelectStage = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // StageSelectorはstage.nameではなくuseLanguageの翻訳を表示するため、
    // 日本語表示を検証するには言語設定を日本語に固定する必要がある。
    // 未設定だとJSDOMのnavigator.language(en-US)から英語が選ばれる
    window.localStorage.setItem('fruitHarvestLanguage', '"ja"')
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  describe('rendering', () => {
    it('should render all stages', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('フルーツ畑')).toBeInTheDocument()
      expect(screen.getByText('リンゴ園')).toBeInTheDocument()
      expect(screen.getByText('ブルーベリー農園')).toBeInTheDocument()
    })

    it('should show stage descriptions', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('フルーツ収穫の基本を学びましょう')).toBeInTheDocument()
      expect(screen.getByText('リンゴを中心に収穫しましょう')).toBeInTheDocument()
    })

    it('should show target requirements', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      // Find stage 1 container
      const stage1 = screen.getByText('フルーツ畑').closest('div[role="button"]')!
      
      // Check stage 1 requirements
      expect(stage1).toHaveTextContent('目標スコア:')
      expect(stage1).toHaveTextContent('100')
      expect(stage1).toHaveTextContent('目標フルーツ:')
      // StageSelectorは「10 個」のように数値と単位を空白で区切って表示する
      expect(stage1).toHaveTextContent('10 個')
    })

    it('should show completion status', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('✅ クリア済み')).toBeInTheDocument()
      expect(screen.getByText(/最高得点: 150/)).toBeInTheDocument()
    })

    it('should show locked status', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('🔒 ロック中')).toBeInTheDocument()
    })

    it('should highlight current stage', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={2}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      const stage2Element = screen.getByText('リンゴ園').closest('div[role="button"]')
      expect(stage2Element).toHaveClass('ring-2')
    })
  })

  describe('interaction', () => {
    it('should call onSelectStage for unlocked stage', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      const stage2 = screen.getByText('リンゴ園').closest('div[role="button"]')!
      fireEvent.click(stage2)
      
      expect(mockOnSelectStage).toHaveBeenCalledWith(2)
    })

    it('should not call onSelectStage for locked stage', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      const stage3 = screen.getByText('ブルーベリー農園').closest('div[role="button"]')!
      fireEvent.click(stage3)
      
      expect(mockOnSelectStage).not.toHaveBeenCalled()
    })

    it('should handle keyboard navigation', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      const stage2 = screen.getByText('リンゴ園').closest('div[role="button"]')!
      fireEvent.keyDown(stage2, { key: 'Enter' })
      
      expect(mockOnSelectStage).toHaveBeenCalledWith(2)
    })

    it('should handle space key', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      const stage2 = screen.getByText('リンゴ園').closest('div[role="button"]')!
      fireEvent.keyDown(stage2, { key: ' ' })
      
      expect(mockOnSelectStage).toHaveBeenCalledWith(2)
    })
  })

  describe('close button', () => {
    it('should render close button', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      // X button
      expect(screen.getByLabelText('閉じる')).toBeInTheDocument()
      // Close button at bottom
      expect(screen.getByText('閉じる')).toBeInTheDocument()
    })

    it('should call onClose when clicked', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      // Click the bottom close button
      fireEvent.click(screen.getByText('閉じる'))
      
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      const stage1 = screen.getByText('フルーツ畑').closest('div[role="button"]')!
      expect(stage1).toHaveAttribute('role', 'button')
      expect(stage1).toHaveAttribute('tabIndex', '0')
      expect(stage1).toHaveAttribute('aria-label', expect.stringContaining('ステージ 1'))
    })

    it('should disable locked stages', () => {
      render(
        <StageSelector
          stages={mockStages}
          currentStage={1}
          onSelectStage={mockOnSelectStage}
          onClose={mockOnClose}
        />
      )
      
      const stage3 = screen.getByText('ブルーベリー農園').closest('div[role="button"]')!
      expect(stage3).toHaveAttribute('aria-disabled', 'true')
    })
  })
})