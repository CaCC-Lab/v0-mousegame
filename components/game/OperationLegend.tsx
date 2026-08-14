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
 */
export function OperationLegend({ t = translations.ja }: OperationLegendProps): React.ReactElement {
  return (
    <div
      data-testid="operation-legend"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {FRUIT_ORDER.map(fruit => (
        <span
          key={fruit}
          data-testid={`legend-${fruit}`}
          className="flex items-center gap-1 rounded-[var(--radius-full)] bg-white/85 px-2 py-0.5 shadow-sm backdrop-blur-sm"
        >
          <FruitSprite type={fruit} size={16} decorative />
          <span className="text-xs font-bold" style={{ color: 'var(--color-purple)' }}>
            {t.gamification.operations[getRequiredInteraction(fruit)]}
          </span>
        </span>
      ))}
    </div>
  )
}
