import React from 'react'
import { DifficultyLevel } from '@/types/difficulty'
import { translations } from '@/lib/i18n/translations'

interface DifficultySelectorProps {
  currentDifficulty: DifficultyLevel
  availableDifficulties: DifficultyLevel[]
  onDifficultyChange: (difficulty: DifficultyLevel) => void
  disabled?: boolean
  language: 'ja' | 'en'
  t: typeof translations.ja | typeof translations.en
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
  language,
  t,
}: DifficultySelectorProps) {
  // Ensure we have translations
  if (!t || !t.difficulty) {
    console.error('DifficultySelector: Missing translations', { language, t })
    return null
  }

  const handleDifficultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel
    onDifficultyChange(newDifficulty)
  }

  return (
    <div className="flex flex-col space-y-3 w-full">
      <div className="flex items-center gap-3">
        <label
          htmlFor="difficulty-select"
          className="text-sm font-medium text-gray-700 flex-shrink-0"
          style={{ minWidth: language === 'en' ? '90px' : '70px' }}
        >
          {t.difficulty}:
        </label>
        
        <select
          id="difficulty-select"
          value={currentDifficulty}
          onChange={handleDifficultyChange}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 border rounded-md text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${DIFFICULTY_COLORS[currentDifficulty]}
          `}
          style={{ minWidth: '120px' }}
          aria-label={`${t.difficulty} selector`}
          role="combobox"
        >
          {availableDifficulties.map((difficulty) => (
            <option
              key={difficulty}
              value={difficulty}
              className={`${DIFFICULTY_COLORS[difficulty]}`}
            >
              {difficulty === 'easy' ? t.difficultyEasy : difficulty === 'normal' ? t.difficultyNormal : t.difficultyHard}
            </option>
          ))}
        </select>
      </div>

      {/* Difficulty Description */}
      <div className="text-sm text-gray-600 italic min-h-[1.5rem]">
        {t.difficultyDesc[currentDifficulty]}
      </div>

      {/* Difficulty Stats */}
      <div className="text-xs text-gray-500">
        {currentDifficulty === 'easy' && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="whitespace-nowrap">{t.difficultyStats.fruits}: {t.difficultyStats.few}</span>
            <span className="whitespace-nowrap">{t.difficultyStats.time}: {t.difficultyStats.bonus}</span>
            <span className="whitespace-nowrap">{t.difficultyStats.score}: {t.difficultyStats.scorePenalty}</span>
          </div>
        )}
        {currentDifficulty === 'normal' && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="whitespace-nowrap">{t.difficultyStats.fruits}: {t.difficultyStats.standard}</span>
            <span className="whitespace-nowrap">{t.difficultyStats.time}: {t.difficultyStats.standard}</span>
            <span className="whitespace-nowrap">{t.difficultyStats.score}: {t.difficultyStats.standard}</span>
          </div>
        )}
        {currentDifficulty === 'hard' && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="whitespace-nowrap">{t.difficultyStats.fruits}: {t.difficultyStats.many}</span>
            <span className="whitespace-nowrap">{t.difficultyStats.time}: {t.difficultyStats.penalty}</span>
            <span className="whitespace-nowrap">{t.difficultyStats.score}: {t.difficultyStats.scoreBonus}</span>
          </div>
        )}
      </div>
    </div>
  )
}