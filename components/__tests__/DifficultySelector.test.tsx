import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DifficultySelector } from '../DifficultySelector'
import { translations } from '@/lib/i18n/translations'
import { DIFFICULTY_CONFIGS } from '@/types/difficulty'

/**
 * DifficultySelectorの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('DifficultySelector', () => {
  const mockProps = {
    currentDifficulty: 'normal' as const,
    availableDifficulties: [...(['easy', 'normal', 'hard'] as const)],
    onDifficultyChange: jest.fn(),
    disabled: false,
    language: 'ja' as const,
    t: translations.ja,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders difficulty selector', () => {
      render(<DifficultySelector {...mockProps} />)

      // 難易度ラベルの確認
      expect(screen.getByText('難易度:')).toBeInTheDocument()
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

  describe('Difficulty Descriptions（v1.1 計画 G4・D3: 表示は実際に効くものだけ）', () => {
    const levels = ['easy', 'normal', 'hard'] as const

    it('実際に変わる「れんしゅうの得点倍率」を、定数の値で出す', () => {
      levels.forEach((level) => {
        const { unmount } = render(<DifficultySelector {...mockProps} currentDifficulty={level} />)
        const desc = screen.getByTestId('difficulty-description').textContent!
        expect(desc).toContain(`${DIFFICULTY_CONFIGS[level].scoreMultiplier}ばい`)
        expect(desc).not.toMatch(/[{}]/)
        unmount()
      })
    })

    it('効いていない「時間」「フルーツの数」の説明は出さない', () => {
      // ステージの制限時間と果物の数が優先されるため、難易度では変わらない（docs/game-spec.md §7）
      levels.forEach((level) => {
        const { container, unmount } = render(<DifficultySelector {...mockProps} currentDifficulty={level} />)
        expect(container.textContent).not.toMatch(/時間|フルーツ|少な|多い|余裕|厳し/)
        unmount()
      })
    })

    it('英語でも倍率を出す', () => {
      render(<DifficultySelector {...mockProps} language="en" t={translations.en} currentDifficulty="hard" />)
      expect(screen.getByTestId('difficulty-description').textContent).toContain(
        `x${DIFFICULTY_CONFIGS.hard.scoreMultiplier}`
      )
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
  })
})