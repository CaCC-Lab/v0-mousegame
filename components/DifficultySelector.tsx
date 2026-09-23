import React from 'react'
import { DifficultyLevel } from '@/types/difficulty'
import { describeDifficulty } from '@/lib/difficultyText'
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

      {/* 難易度で実際に変わるものだけを出す（v1.1 計画 G4・D3、docs/game-spec.md §7） */}
      <div className="text-sm text-gray-600" data-testid="difficulty-description">
        {describeDifficulty(currentDifficulty, t)}
      </div>
    </div>
  )
}