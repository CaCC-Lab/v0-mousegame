"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { ARCADE_CONFIG } from '@/types/arcade'
import { translations } from '@/lib/i18n/translations'

type TranslationType = typeof translations.ja | typeof translations.en

export interface ArcadeHUDProps {
  combo: number
  comboMultiplier: number
  /** 0〜ARCADE_CONFIG.feverGaugeMax */
  feverGauge: number
  isFever: boolean
  t: TranslationType
}

/** コンボ表示を出し始める本数（1コンボは「ふつうに1個とった」だけなので出さない） */
const COMBO_DISPLAY_THRESHOLD = 2

/**
 * アーケード中だけ出す HUD。コンボ数・倍率とフィーバーゲージ。
 * 「いま乗っている」ことが一目で分かることを優先し、数字は大きく短く。
 */
export function ArcadeHUD({
  combo,
  comboMultiplier,
  feverGauge,
  isFever,
  t,
}: ArcadeHUDProps): React.ReactElement {
  const gaugeValue = Math.round(feverGauge)
  const gaugeRatio = Math.min(100, (feverGauge / ARCADE_CONFIG.feverGaugeMax) * 100)

  return (
    <div className="flex items-center gap-2 min-w-0">
      {combo >= COMBO_DISPLAY_THRESHOLD && (
        <motion.div
          data-testid="arcade-combo"
          key={combo}
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.35 }}
          className="flex items-baseline gap-1 rounded-[var(--radius-md)] bg-white/25 px-2.5 py-1 text-white whitespace-nowrap"
        >
          <span className="text-display text-xl font-bold">{combo}</span>
          <span className="text-xs font-semibold opacity-90">{t.combo}</span>
          <span
            className="text-sm font-bold px-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-purple)' }}
          >
            x{comboMultiplier}
          </span>
        </motion.div>
      )}

      <div className="flex items-center gap-1.5 min-w-[80px] max-w-[160px] flex-1">
        <Flame
          className={`w-4 h-4 shrink-0 ${isFever ? 'text-yellow-300' : 'text-white/70'}`}
          aria-hidden
        />
        <div
          data-testid="arcade-fever-gauge"
          role="progressbar"
          aria-label={t.feverGauge}
          aria-valuenow={gaugeValue}
          aria-valuemin={0}
          aria-valuemax={ARCADE_CONFIG.feverGaugeMax}
          className="h-2.5 flex-1 rounded-full bg-white/25 overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-[width] duration-100 ease-linear"
            style={{
              width: `${gaugeRatio}%`,
              background: isFever
                ? 'linear-gradient(90deg,#FFD23F,#FF6B6B)'
                : 'linear-gradient(90deg,#A8DADC,#FFD23F)',
            }}
          />
        </div>
      </div>

      {isFever && (
        <motion.div
          data-testid="arcade-fever-banner"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [1, 1.08, 1], opacity: 1 }}
          transition={{ scale: { duration: 0.6, repeat: Infinity } }}
          className="text-display text-sm font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-berry)' }}
        >
          🔥 {t.fever}
        </motion.div>
      )}
    </div>
  )
}
