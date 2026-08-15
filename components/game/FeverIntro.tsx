'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { translations } from '@/lib/i18n/translations'

export interface FeverIntroProps {
  /** はじめてフィーバーに入った直後だけ true にする */
  show: boolean
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

/**
 * はじめてフィーバーに入ったときだけ、何が起きたのかを一度だけ説明する。
 *
 * プレイテストでは「Feverが何なのか最後まで分からなかった」まま終わっていた。
 * 説明文は元から translations.ts にあり、あそびかたダイアログには載っているが、
 * 遊んでいる最中に読むことはない。起きた瞬間にその場で見せる。
 *
 * 毎回出すと邪魔になるので、初回だけ。
 */
export function FeverIntro({ show, t = translations.ja }: FeverIntroProps): React.ReactElement {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          data-testid="fever-intro"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="pointer-events-none absolute inset-x-4 top-24 z-30 mx-auto max-w-md rounded-[var(--radius-xl)] bg-white/95 px-5 py-3 text-center shadow-xl ring-4 ring-amber-300"
        >
          <span className="text-display block text-lg font-bold text-amber-600">
            🔥 {t.fever}
          </span>
          <span className="mt-1 block text-sm font-semibold text-gray-700">
            {t.helpContent.arcadeFever}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
