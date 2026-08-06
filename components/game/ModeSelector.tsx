"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, GraduationCap } from 'lucide-react'
import { GameMode, RankTierId, RANK_TIERS, ARCADE_CONFIG } from '@/types/arcade'
import { translations } from '@/lib/i18n/translations'

type TranslationType = typeof translations.ja | typeof translations.en

export interface ModeSelectorProps {
  onSelectMode: (mode: GameMode) => void
  /** アーケードの自己ベスト（0なら未プレイ） */
  arcadeBest: number
  arcadeRank: RankTierId
  language: 'ja' | 'en'
  t: TranslationType
}

function rankTier(id: RankTierId) {
  return RANK_TIERS.find(tier => tier.id === id) ?? RANK_TIERS[0]
}

/**
 * 遊び方の入口。
 *
 * CrazyGames のように「開いた人が数秒で遊び始める」ことを狙い、
 * 待機中のプレイエリアにこれだけを大きく出す。
 * 競う遊び（アーケード）を主役に、練習モードは並べて残す。
 */
export function ModeSelector({
  onSelectMode,
  arcadeBest,
  arcadeRank,
  language,
  t,
}: ModeSelectorProps): React.ReactElement {
  const tier = rankTier(arcadeRank)

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-2xl px-4">
      <p className="text-white text-lg font-bold drop-shadow text-display">{t.chooseMode}</p>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <motion.button
          type="button"
          data-testid="mode-select-arcade"
          onClick={() => onSelectMode('arcade')}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-[3] rounded-[var(--radius-xl)] px-5 py-4 text-left text-white shadow-playful border-4 border-white/60"
          style={{ background: 'var(--gradient-berry, linear-gradient(135deg,#FF6B6B,#C77DFF))' }}
        >
          <span className="flex items-center gap-2">
            <Trophy className="w-6 h-6 shrink-0" aria-hidden />
            <span className="text-display text-2xl font-bold">{t.arcadeMode}</span>
            <span className="ml-auto text-sm font-bold bg-white/25 rounded-full px-2.5 py-0.5 whitespace-nowrap">
              {ARCADE_CONFIG.duration}
              {t.seconds}
            </span>
          </span>
          <span className="block mt-1 text-sm font-semibold opacity-95">{t.arcadeTagline}</span>

          {arcadeBest > 0 && (
            <span className="mt-2 flex items-center gap-2 text-sm font-bold">
              <span className="bg-white/25 rounded-full px-2.5 py-0.5">
                {t.best} {arcadeBest.toLocaleString()}
              </span>
              <span className="bg-white/25 rounded-full px-2.5 py-0.5">
                <span aria-hidden>{tier.emoji}</span> {tier.label[language]}
              </span>
            </span>
          )}
        </motion.button>

        <motion.button
          type="button"
          data-testid="mode-select-practice"
          onClick={() => onSelectMode('practice')}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, delay: 0.08 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex-[2] rounded-[var(--radius-xl)] px-5 py-4 text-left bg-white/95 shadow-playful border-4 border-white/60"
          style={{ color: 'var(--color-purple)' }}
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 shrink-0" aria-hidden />
            <span className="text-display text-xl font-bold">{t.practiceMode}</span>
          </span>
          <span className="block mt-1 text-sm font-semibold text-gray-600">{t.practiceTagline}</span>
        </motion.button>
      </div>
    </div>
  )
}
