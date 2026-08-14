"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, GraduationCap, Play } from 'lucide-react'
import { GameMode, RankTierId, RANK_TIERS, ARCADE_CONFIG } from '@/types/arcade'
import { translations } from '@/lib/i18n/translations'

type TranslationType = typeof translations.ja | typeof translations.en

export interface ModeSelectorProps {
  /** カードを押したとき。選ぶだけで、ゲームは始めない */
  onSelectMode: (mode: GameMode) => void
  /** 「はじめる」を押したとき */
  onStart: () => void
  /** いま選ばれているモード */
  selectedMode: GameMode
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
 *
 * カードは「選ぶ」だけで、始めるのは「はじめる」ボタン。
 * 押した瞬間にタイマーが走ると、初見のプレイヤーは何が起きたか分からないまま
 * 時間を溶かしてしまう（プレイテストで実際に起きた）。
 */
export function ModeSelector({
  onSelectMode,
  onStart,
  selectedMode,
  arcadeBest,
  arcadeRank,
  language,
  t,
}: ModeSelectorProps): React.ReactElement {
  const tier = rankTier(arcadeRank)
  // 選んでいるカードは枠を光らせて、いま何が始まるのかを見て分かるようにする
  const ring = (mode: GameMode) =>
    selectedMode === mode ? 'border-amber-300 ring-4 ring-amber-300/60' : 'border-white/60'

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 w-full max-w-2xl px-4">
      <p className="text-white text-lg font-bold drop-shadow text-display">{t.chooseMode}</p>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <motion.button
          type="button"
          data-testid="mode-select-arcade"
          aria-pressed={selectedMode === 'arcade'}
          onClick={() => onSelectMode('arcade')}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex-[3] rounded-[var(--radius-xl)] px-4 py-2.5 sm:px-5 sm:py-4 text-left text-white shadow-playful border-4 ${ring('arcade')}`}
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
          {/* 狭い画面では説明文を畳む。カード2枚と「はじめる」が収まらなくなるため */}
          <span className="hidden sm:block mt-1 text-sm font-semibold opacity-95">{t.arcadeTagline}</span>

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
          aria-pressed={selectedMode === 'practice'}
          onClick={() => onSelectMode('practice')}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, delay: 0.08 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`flex-[2] rounded-[var(--radius-xl)] px-4 py-2.5 sm:px-5 sm:py-4 text-left bg-white/95 shadow-playful border-4 ${ring('practice')}`}
          style={{ color: 'var(--color-purple)' }}
        >
          <span className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 shrink-0" aria-hidden />
            <span className="text-display text-xl font-bold">{t.practiceMode}</span>
          </span>
          <span className="hidden sm:block mt-1 text-sm font-semibold text-gray-600">{t.practiceTagline}</span>
        </motion.button>
      </div>

      <motion.button
        type="button"
        data-testid="mode-start"
        onClick={onStart}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.4, delay: 0.16 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2 rounded-full px-8 py-2 sm:px-10 sm:py-3 text-display text-lg sm:text-xl font-bold text-white shadow-playful border-4 border-white/60"
        style={{ background: 'var(--gradient-mint, linear-gradient(135deg,#4ECDC4,#2E9E96))' }}
      >
        <Play className="w-6 h-6" aria-hidden />
        {t.start}
      </motion.button>
    </div>
  )
}
