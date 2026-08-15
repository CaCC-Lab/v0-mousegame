'use client'

import React from 'react'
import { ArrowDown } from 'lucide-react'
import { translations } from '@/lib/i18n/translations'
import { FruitSprite } from './FruitSprite'

export interface DropAreaProps {
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

/**
 * スイカを運んでくる場所。
 *
 * はじめは writing-vertical という CSS に無いクラスで縦書きにしようとしており、
 * 幅80pxの中で文字が折り返して「ドロッ / プエリ / ア」と割れていた。
 * 1文字ずつ縦に積む形に直したが、別のプレイテストでも
 * 「縦書きの Drop Area が読みにくくて、最初は飾りに見えた」と同じ言葉で言われた。
 *
 * 縦書きはやめ、帯に横書きで収まる短い語だけを出す。
 * 何の場所かはスイカの絵と矢印で伝え、読み上げには完全な語を渡す。
 */
export function DropArea({ t = translations.ja }: DropAreaProps): React.ReactElement {
  return (
    <div
      data-testid="drop-area"
      role="img"
      aria-label={t.dropArea}
      className="drop-area absolute right-0 top-0 bottom-0 w-20 flex flex-col justify-center items-center gap-1.5 border-l-4 border-dashed border-white/50"
      style={{ background: 'var(--gradient-berry)' }}
    >
      <FruitSprite type="watermelon" size={30} decorative />
      <ArrowDown className="w-5 h-5 text-white/90" aria-hidden />
      <span
        data-testid="drop-area-label"
        className="whitespace-nowrap text-white font-bold text-sm drop-shadow-lg"
      >
        {t.dropAreaShort}
      </span>
    </div>
  )
}
