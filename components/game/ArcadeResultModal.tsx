"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Home, Sparkles } from 'lucide-react'
import { ArcadeResult, RankProgress, RankTierId, RANK_TIERS } from '@/types/arcade'
import { translations } from '@/lib/i18n/translations'

type TranslationType = typeof translations.ja | typeof translations.en

export interface ArcadeResultModalProps {
  open: boolean
  result: ArcadeResult | null
  rankProgress: RankProgress
  language: 'ja' | 'en'
  onRetry: () => void
  onClose: () => void
  /** リワード広告（スペシャルフルーツ）が使えるか。SDK導入前は false */
  rewardedAvailable?: boolean
  onRewardedBoost?: () => void
  t: TranslationType
}

function rankTier(id: RankTierId) {
  return RANK_TIERS.find(tier => tier.id === id) ?? RANK_TIERS[0]
}

function StatCell({
  testId,
  label,
  value,
}: {
  testId: string
  label: string
  value: string
}): React.ReactElement {
  return (
    <div className="rounded-[var(--radius-md)] bg-gray-50 px-3 py-2 text-center" data-testid={testId}>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-display text-xl font-bold tabular-nums">{value}</div>
    </div>
  )
}

/**
 * アーケードの結果画面。
 *
 * 「もういちど」を一番押しやすい位置に置いて、
 * 結果→再挑戦のループが途切れないようにしている。
 */
export function ArcadeResultModal({
  open,
  result,
  rankProgress,
  language,
  onRetry,
  onClose,
  rewardedAvailable = false,
  onRewardedBoost,
  t,
}: ArcadeResultModalProps): React.ReactElement | null {
  if (!open || !result) return null

  const tier = rankTier(result.rank)
  const nextTier = rankProgress.next ? rankTier(rankProgress.next) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="arcade-result-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.35 }}
        className="max-w-md w-full rounded-[var(--radius-xl)] bg-white p-6 shadow-xl"
      >
        <h2
          id="arcade-result-title"
          className="text-display text-xl font-bold text-center"
          style={{ color: 'var(--color-primary)' }}
        >
          🏆 {t.arcadeResultTitle}
        </h2>

        <div
          className="mt-3 text-center text-display font-bold tabular-nums"
          data-testid="arcade-result-score"
          style={{ color: 'var(--color-berry)', fontSize: '3rem', lineHeight: 1.1 }}
        >
          {result.score.toLocaleString()}
        </div>

        {result.isNewBest && (
          <motion.div
            data-testid="arcade-new-best"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [1, 1.06, 1], opacity: 1 }}
            transition={{ scale: { duration: 0.8, repeat: Infinity } }}
            className="mx-auto mt-1 w-fit rounded-full px-4 py-1 text-sm font-bold"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-purple)' }}
          >
            ✨ {t.newBest}
          </motion.div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatCell testId="arcade-result-best" label={t.best} value={result.best.toLocaleString()} />
          <StatCell testId="arcade-result-max-combo" label={t.maxCombo} value={String(result.maxCombo)} />
          <StatCell
            testId="arcade-result-fever-count"
            label={t.feverCount}
            value={`${result.feverCount}${t.times}`}
          />
        </div>

        <div className="mt-4 rounded-[var(--radius-lg)] border-2 border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>{tier.emoji}</span>
            <span className="text-xs font-semibold text-gray-500">{t.rank}</span>
            <span className="text-display text-lg font-bold" data-testid="arcade-result-rank">
              {tier.label[language]}
            </span>
          </div>

          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(rankProgress.ratio * 100)}%`,
                background: 'linear-gradient(90deg,#4ECDC4,#FFD23F)',
              }}
            />
          </div>

          <div className="mt-1.5 text-xs font-semibold text-gray-600" data-testid="arcade-rank-progress">
            {nextTier
              ? t.toNextRank(rankProgress.pointsToNext, nextTier.label[language])
              : t.maxRankReached}
          </div>
        </div>

        <button
          type="button"
          data-testid="arcade-retry"
          onClick={onRetry}
          className="mt-5 w-full rounded-[var(--radius-full)] px-4 py-3 text-white font-bold text-display shadow-playful flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-secondary)' }}
        >
          <RotateCcw className="w-5 h-5" aria-hidden />
          {t.retry}
        </button>

        {rewardedAvailable && (
          <button
            type="button"
            data-testid="arcade-rewarded-boost"
            onClick={onRewardedBoost}
            className="mt-2 w-full rounded-[var(--radius-full)] px-4 py-2.5 font-bold shadow flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-purple)' }}
          >
            <Sparkles className="w-5 h-5" aria-hidden />
            {t.specialFruit}
          </button>
        )}

        <button
          type="button"
          data-testid="arcade-back-to-menu"
          onClick={onClose}
          className="mt-2 w-full rounded-[var(--radius-full)] px-4 py-2.5 font-semibold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <Home className="w-4 h-4" aria-hidden />
          {t.backToMenu}
        </button>
      </motion.div>
    </div>
  )
}
