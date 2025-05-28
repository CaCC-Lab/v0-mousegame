import React from 'react'
import { DifficultyLevel } from '@/types/difficulty'
import { useLanguage } from '@/hooks/useLanguage'

interface DifficultySelectorProps {
  currentDifficulty: DifficultyLevel
  availableDifficulties: DifficultyLevel[]
  difficultyDescriptions: Record<DifficultyLevel, string>
  onDifficultyChange: (difficulty: DifficultyLevel) => void
  disabled?: boolean
}

const DIFFICULTY_COLORS = {
  easy: 'text-green-600 bg-green-50 border-green-200',
  normal: 'text-blue-600 bg-blue-50 border-blue-200',
  hard: 'text-red-600 bg-red-50 border-red-200',
} as const

const DIFFICULTY_LABELS = {
  ja: {
    easy: 'かんたん',
    normal: 'ふつう',
    hard: 'むずかしい',
    difficultyLabel: '難易度',
  },
  en: {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
    difficultyLabel: 'Difficulty',
  },
} as const

export function DifficultySelector({
  currentDifficulty,
  availableDifficulties,
  difficultyDescriptions,
  onDifficultyChange,
  disabled = false,
}: DifficultySelectorProps) {
  const { language } = useLanguage()
  const labels = DIFFICULTY_LABELS[language] || DIFFICULTY_LABELS.en

  const handleDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel
    onDifficultyChange(newDifficulty)
  }

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-3">
        <label
          htmlFor="difficulty-select"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {labels.difficultyLabel}:
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
            dark:bg-gray-700 dark:border-gray-600 dark:text-white
          `}
          aria-label={`${labels.difficultyLabel} selector`}
          role="combobox"
        >
          {availableDifficulties.map((difficulty) => (
            <option
              key={difficulty}
              value={difficulty}
              className={`${DIFFICULTY_COLORS[difficulty]}`}
            >
              {labels[difficulty]}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Description */}
      <div className="text-sm text-gray-600 dark:text-gray-400 italic">
        {difficultyDescriptions[currentDifficulty]}
      </div>

      {/* Difficulty Stats */}
      <div className="text-xs text-gray-500 dark:text-gray-500">
        {currentDifficulty === 'easy' && (
          <div className="flex space-x-4">
            <span>🍎 フルーツ: 少ない</span>
            <span>⏱️ 時間: +50%</span>
            <span>📊 スコア: -20%</span>
          </div>
        )}
        {currentDifficulty === 'normal' && (
          <div className="flex space-x-4">
            <span>🍎 フルーツ: 標準</span>
            <span>⏱️ 時間: 標準</span>
            <span>📊 スコア: 標準</span>
          </div>
        )}
        {currentDifficulty === 'hard' && (
          <div className="flex space-x-4">
            <span>🍎 フルーツ: 多い</span>
            <span>⏱️ 時間: -20%</span>
            <span>📊 スコア: +20%</span>
          </div>
        )}
      </div>
    </div>
  )
}