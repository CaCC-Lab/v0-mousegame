'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MissHint } from '@/types/game'
import { translations } from '@/lib/i18n/translations'
import { FruitSprite } from './FruitSprite'

export interface MissHintToastProps {
  hint: MissHint | null
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

/**
 * 誤操作したときに、そのフルーツに必要な操作を一語で伝える。
 *
 * 黙って0点にされると、初見のプレイヤーは何を直せばいいのか分からない。
 * プレイテストではこれが離脱の引き金になった
 * （「単語がひとつ出てたら続けた。沈黙が引き金」）。
 *
 * 手を止めさせないよう、操作をせき止めない位置に短く出す。
 */
export function MissHintToast({ hint, t = translations.ja }: MissHintToastProps): React.ReactElement {
  const g = t.gamification

  return (
    <AnimatePresence mode="wait">
      {hint && (
        <motion.div
          // id が変わるたびに出し直す（同じ間違いを繰り返しても伝わるように）
          key={hint.id}
          data-testid="miss-hint"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          // 上端は収穫カウンターが占めているので、その下に出す
          className="pointer-events-none absolute left-1/2 top-14 z-20 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 shadow-lg ring-2 ring-amber-300"
        >
          <span className="flex items-center gap-2 whitespace-nowrap text-base font-bold text-gray-800">
            <FruitSprite type={hint.fruitType} size={22} decorative />
            <span className="text-amber-600">
              {g.missHint
                .replace('{fruit}', t[hint.fruitType])
                .replace('{action}', g.operations[hint.requiredAction])}
            </span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
