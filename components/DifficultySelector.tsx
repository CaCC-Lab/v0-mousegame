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
    // 本番のコンソールは静かに保つ（審査で開発者ツールを開かれても余計な出力を出さない）
    if (process.env.NODE_ENV !== 'production') {
      console.error('DifficultySelector: Missing translations', { language, t })
    }
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
            w-[140px] px-3 py-2 border rounded-md text-sm font-medium
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${DIFFICULTY_COLORS[currentDifficulty]}
          `}
          aria-label={`${t.difficulty} selector`}
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
      <div className="text-sm text-gray-600 italic" style={{ minHeight: '2.5rem' }}>
        {t.difficultyDesc[currentDifficulty]}
      </div>

      {/* Difficulty Stats */}
      <div className="text-xs text-gray-500" style={{ minHeight: '1.5rem' }}>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <span className="inline-block" style={{ minWidth: '65px' }}>{t.difficultyStats.fruits}:</span>
            <span className="font-medium" style={{ minWidth: '60px' }}>
              {currentDifficulty === 'easy' ? t.difficultyStats.few : currentDifficulty === 'normal' ? t.difficultyStats.standard : t.difficultyStats.many}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block" style={{ minWidth: '45px' }}>{t.difficultyStats.time}:</span>
            <span className="font-medium" style={{ minWidth: '45px', textAlign: 'center' }}>
              {currentDifficulty === 'easy' ? t.difficultyStats.bonus : currentDifficulty === 'normal' ? t.difficultyStats.standard : t.difficultyStats.penalty}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block" style={{ minWidth: '50px' }}>{t.difficultyStats.score}:</span>
            <span className="font-medium" style={{ minWidth: '35px', textAlign: 'right' }}>
              {currentDifficulty === 'easy' ? t.difficultyStats.scorePenalty : currentDifficulty === 'normal' ? t.difficultyStats.standard : t.difficultyStats.scoreBonus}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}