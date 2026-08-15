'use client'

import React from 'react'
import type { FruitType } from '@/types/game'
import { getRequiredInteraction } from '@/lib/gameLogic'
import { translations } from '@/lib/i18n/translations'
import { FruitSprite } from './FruitSprite'

/** 凡例に並べる順。基本の操作から順に慣れてもらう */
const FRUIT_ORDER: FruitType[] = ['apple', 'blueberry', 'lemon', 'watermelon']

export interface OperationLegendProps {
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

/**
 * どのフルーツに何をすればいいかを、プレイ中ずっと見えるところに置く。
 *
 * 対応表も説明文も元からあったのに画面へ出しておらず、
 * プレイテストでは「ただのクリックゲーだと思ってた」まま時間切れになった。
 *
 * 対応は得点計算と同じ表から引くので、ルールが変わってもずれない。
 *
 * すぐ上には収穫カウンター（🍎0 🫐0 …）が並んでおり、
 * 見た目が似ていると「操作説明なのか進捗なのか一瞬分からない」と言われた。
 * 見出しを付け、色も反転させて、ひと目で別物と分かるようにしている。
 */
export function OperationLegend({ t = translations.ja }: OperationLegendProps): React.ReactElement {
  return (
    <div
      data-testid="operation-legend"
      className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-[var(--radius-full)] bg-black/45 px-3 py-1 backdrop-blur-sm"
    >
      <span
        data-testid="legend-title"
        className="text-[11px] font-bold uppercase tracking-wide text-white/90"
      >
        {t.gamification.legendTitle}
      </span>
      {FRUIT_ORDER.map(fruit => (
        <span key={fruit} data-testid={`legend-${fruit}`} className="flex items-center gap-1">
          <FruitSprite type={fruit} size={16} decorative />
          <span className="text-xs font-bold text-white">
            {t.gamification.operations[getRequiredInteraction(fruit)]}
          </span>
        </span>
      ))}
    </div>
  )
}
