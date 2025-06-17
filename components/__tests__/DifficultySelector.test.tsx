import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DifficultySelector } from '../DifficultySelector'
import { DifficultyLevel } from '../../types/difficulty'

/**
 * DifficultySelectorの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('DifficultySelector', () => {
  const mockProps = {
    currentDifficulty: 'normal' as const,
    availableDifficulties: [...(['easy', 'normal', 'hard'] as const)],
    difficultyDescriptions: {
      easy: 'フルーツが少なく、時間に余裕があります',
      normal: 'バランスの取れた標準的な難易度です',
      hard: 'フルーツが多く、時間制限が厳しくなります',
    },
    onDifficultyChange: jest.fn(),
    disabled: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders difficulty selector', () => {
      render(<DifficultySelector {...mockProps} />)
      
      // 難易度ラベルの確認（英語または日本語）
      const difficultyLabel = screen.queryByText('Difficulty:') || screen.queryByText('難易度:')
      expect(difficultyLabel).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('displays current difficulty', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('normal')
    })

    it('shows all available difficulties as options', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('normal')
      
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
      
      // オプションの値を確認
      const optionValues = options.map(opt => (opt as HTMLOptionElement).value)
      expect(optionValues).toContain('easy')
      expect(optionValues).toContain('normal')
      expect(optionValues).toContain('hard')
    })
  })

  describe('Interaction', () => {
    it('calls onDifficultyChange when selection changes', async () => {
      const user = userEvent.setup()
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'hard')
      
      expect(mockProps.onDifficultyChange).toHaveBeenCalledWith('hard')
    })

    it('handles easy difficulty selection', async () => {
      const user = userEvent.setup()
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'easy')
      
      expect(mockProps.onDifficultyChange).toHaveBeenCalledWith('easy')
    })

    it('is disabled when disabled prop is true', () => {
      render(<DifficultySelector {...mockProps} disabled={true} />)
      
      const select = screen.getByRole('combobox')
      expect(select).toBeDisabled()
    })

    it('does not call onDifficultyChange when disabled', async () => {
      const user = userEvent.setup()
      render(<DifficultySelector {...mockProps} disabled={true} />)
      
      const select = screen.getByRole('combobox')
      await user.click(select)
      
      expect(mockProps.onDifficultyChange).not.toHaveBeenCalled()
    })
  })

  describe('Difficulty Descriptions', () => {
    it('displays description for current difficulty', () => {
      render(<DifficultySelector {...mockProps} />)
      
      expect(screen.getByText('バランスの取れた標準的な難易度です')).toBeInTheDocument()
    })

    it('updates description when difficulty changes', () => {
      const { rerender } = render(<DifficultySelector {...mockProps} />)
      
      expect(screen.getByText('バランスの取れた標準的な難易度です')).toBeInTheDocument()
      
      rerender(<DifficultySelector {...mockProps} currentDifficulty="hard" />)
      expect(screen.getByText('フルーツが多く、時間制限が厳しくなります')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('aria-label')
    })

    it('has proper labels for options', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const options = screen.getAllByRole('option')
      expect(options.length).toBeGreaterThan(0)
      
      // 各オプションにテキストがあることを確認
      options.forEach(option => {
        expect(option.textContent).toBeTruthy()
      })
    })
  })

  describe('Visual state changes', () => {
    it('displays the correct selected value', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('normal')
    })

    it('updates visual state when difficulty changes', () => {
      const { rerender } = render(<DifficultySelector {...mockProps} />)
      
      let select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('normal')
      
      rerender(<DifficultySelector {...mockProps} currentDifficulty="easy" />)
      select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('easy')
    })
  })

  describe('Edge cases', () => {
    it('handles empty available difficulties gracefully', () => {
      const emptyProps = {
        ...mockProps,
        availableDifficulties: [...([] as const)],
      }
      
      render(<DifficultySelector {...emptyProps} />)
      
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      
      const options = screen.queryAllByRole('option')
      expect(options).toHaveLength(0)
    })

    it('handles missing difficulty descriptions', () => {
      const propsWithoutDescriptions = {
        ...mockProps,
        difficultyDescriptions: {} as Record<DifficultyLevel, string>,
      }
      
      render(<DifficultySelector {...propsWithoutDescriptions} />)
      
      // コンポーネントがクラッシュしないことを確認
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })
})