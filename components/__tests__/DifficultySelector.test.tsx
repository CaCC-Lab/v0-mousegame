import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DifficultySelector } from '../DifficultySelector'

// Mock the useLanguage hook
jest.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
  }),
}))

describe('DifficultySelector', () => {
  const mockProps = {
    currentDifficulty: 'normal' as const,
    availableDifficulties: ['easy', 'normal', 'hard'] as const,
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
    it('should render difficulty selector', () => {
      render(<DifficultySelector {...mockProps} />)
      
      expect(screen.getByText('Difficulty:')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should display current difficulty', () => {
      render(<DifficultySelector {...mockProps} />)
      
      expect(screen.getByDisplayValue(/normal/i)).toBeInTheDocument()
    })

    it('should show all available difficulties as options', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('normal')
      
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(3)
      expect(options[0]).toHaveValue('easy')
      expect(options[1]).toHaveValue('normal')
      expect(options[2]).toHaveValue('hard')
    })
  })

  describe('Interaction', () => {
    it('should call onDifficultyChange when selection changes', async () => {
      const user = userEvent.setup()
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'hard')
      
      expect(mockProps.onDifficultyChange).toHaveBeenCalledWith('hard')
    })

    it('should handle easy difficulty selection', async () => {
      const user = userEvent.setup()
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'easy')
      
      expect(mockProps.onDifficultyChange).toHaveBeenCalledWith('easy')
    })

    it('should be disabled when disabled prop is true', () => {
      render(<DifficultySelector {...mockProps} disabled={true} />)
      
      const select = screen.getByRole('combobox')
      expect(select).toBeDisabled()
    })

    it('should not call onDifficultyChange when disabled', async () => {
      const user = userEvent.setup()
      render(<DifficultySelector {...mockProps} disabled={true} />)
      
      const select = screen.getByRole('combobox')
      await user.click(select)
      
      expect(mockProps.onDifficultyChange).not.toHaveBeenCalled()
    })
  })

  describe('Difficulty Descriptions', () => {
    it('should display description for current difficulty', () => {
      render(<DifficultySelector {...mockProps} />)
      
      expect(screen.getByText('バランスの取れた標準的な難易度です')).toBeInTheDocument()
    })

    it('should update description when difficulty changes', () => {
      const { rerender } = render(<DifficultySelector {...mockProps} />)
      
      expect(screen.getByText('バランスの取れた標準的な難易度です')).toBeInTheDocument()
      
      rerender(<DifficultySelector {...mockProps} currentDifficulty="hard" />)
      expect(screen.getByText('フルーツが多く、時間制限が厳しくなります')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('aria-label', 'Difficulty selector')
    })

    it('should have proper labels for options', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const easyOption = screen.getByRole('option', { name: 'Easy' })
      const normalOption = screen.getByRole('option', { name: 'Normal' })
      const hardOption = screen.getByRole('option', { name: 'Hard' })
      
      expect(easyOption).toBeInTheDocument()
      expect(normalOption).toBeInTheDocument()
      expect(hardOption).toBeInTheDocument()
    })
  })

  describe('Visual Indicators', () => {
    it('should show visual indicators for different difficulties', () => {
      render(<DifficultySelector {...mockProps} />)
      
      // Easy difficulty should have green color indicator
      const easyOption = screen.getByText('Easy').closest('option')
      expect(easyOption).toHaveClass('text-green-600', 'bg-green-50', 'border-green-200')
    })

    it('should highlight current selected difficulty', () => {
      render(<DifficultySelector {...mockProps} />)
      
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('normal')
    })
  })
})