import React from 'react'
import { DifficultyLevel } from '@/types/difficulty'
import { useLanguage } from '@/hooks/useLanguage'

interface DifficultySelectorProps {
  currentDifficulty: DifficultyLevel
  availableDifficulties: DifficultyLevel[]
  onDifficultyChange: (difficulty: DifficultyLevel) => void
  disabled?: boolean
}

const DIFFICULTY_COLORS = {
  easy: 'text-green-600 bg-green-50 border-green-200',
  normal: 'text-blue-600 bg-blue-50 border-blue-200',
  hard: 'text-red-600 bg-red-50 border-red-200',
} as const

// Difficulty labels are now handled by translations

export function DifficultySelector({
  currentDifficulty,
  availableDifficulties,
  onDifficultyChange,
  disabled = false,
}: DifficultySelectorProps) {
  const { t, language } = useLanguage()
  
  // Debug output to check what's happening
  if (typeof window !== 'undefined') {
    console.log('DifficultySelector Debug:', {
      language,
      difficulty: t?.difficulty,
      difficultyEasy: t?.difficultyEasy,
      difficultyStats: t?.difficultyStats,
      hasTranslations: !!t
    })
  }

  const handleDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel
    onDifficultyChange(newDifficulty)
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-3">
        <label
          htmlFor="difficulty-select"
          className="text-sm font-medium text-gray-700"
        >
          {t?.difficulty || '難易度'}:
        </label>
        
        <select
          id="difficulty-select"
          value={currentDifficulty}
          onChange={handleDifficultyChange}
          disabled={disabled}
          className={`
            px-3 py-2 border rounded-md text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${DIFFICULTY_COLORS[currentDifficulty]}
          `}
          aria-label={`${t?.difficulty || 'Difficulty'} selector`}
          role="combobox"
        >
          {availableDifficulties.map((difficulty) => (
            <option
              key={difficulty}
              value={difficulty}
              className={`${DIFFICULTY_COLORS[difficulty]}`}
            >
              {difficulty === 'easy' ? (t?.difficultyEasy || 'Easy') : difficulty === 'normal' ? (t?.difficultyNormal || 'Normal') : (t?.difficultyHard || 'Hard')}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Description */}
      <div className="text-sm text-gray-600 italic">
        {t?.difficultyDesc?.[currentDifficulty] || ''}
      </div>

      {/* Difficulty Stats */}
      <div className="text-xs text-gray-500">
        {currentDifficulty === 'easy' && (
          <div className="flex space-x-4">
            <span>{t?.difficultyStats?.fruits || '🍎 Fruits'}: {t?.difficultyStats?.few || 'Few'}</span>
            <span>{t?.difficultyStats?.time || '⏱️ Time'}: {t?.difficultyStats?.bonus || '+50%'}</span>
            <span>{t?.difficultyStats?.score || '📊 Score'}: {t?.difficultyStats?.scorePenalty || '-20%'}</span>
          </div>
        )}
        {currentDifficulty === 'normal' && (
          <div className="flex space-x-4">
            <span>{t?.difficultyStats?.fruits || '🍎 Fruits'}: {t?.difficultyStats?.standard || 'Standard'}</span>
            <span>{t?.difficultyStats?.time || '⏱️ Time'}: {t?.difficultyStats?.standard || 'Standard'}</span>
            <span>{t?.difficultyStats?.score || '📊 Score'}: {t?.difficultyStats?.standard || 'Standard'}</span>
          </div>
        )}
        {currentDifficulty === 'hard' && (
          <div className="flex space-x-4">
            <span>{t?.difficultyStats?.fruits || '🍎 Fruits'}: {t?.difficultyStats?.many || 'Many'}</span>
            <span>{t?.difficultyStats?.time || '⏱️ Time'}: {t?.difficultyStats?.penalty || '-20%'}</span>
            <span>{t?.difficultyStats?.score || '📊 Score'}: {t?.difficultyStats?.scoreBonus || '+20%'}</span>
          </div>
        )}
      </div>
    </div>
  )
}