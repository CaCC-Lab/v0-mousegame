'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { translations } from '@/lib/i18n/translations'
import { FruitSprite } from './FruitSprite'

export interface DropAreaProps {
  /** 表示言語。省略時は日本語（既定の表示言語） */
  t?: typeof translations.ja
}

/**
 * スイカを運んでくる場所。
 *
 * 以前は writing-vertical という CSS に無いクラスで縦書きにしようとしていて、
 * 幅80pxの中で文字が折り返し「ドロッ / プエリ / ア」と割れていた。
 * プレイテストでは「縦書きで潰れてて、最初は飾りに見えた」と言われている。
 *
 * 文字は1文字ずつ縦に積んで割れないようにし、
 * スイカの絵と矢印を添えて、何をする場所なのかを絵でも分かるようにする。
 */
export function DropArea({ t = translations.ja }: DropAreaProps): React.ReactElement {
  const label = t.dropArea

  return (
    <div
      data-testid="drop-area"
      className="drop-area absolute right-0 top-0 bottom-0 w-20 flex flex-col justify-center items-center gap-2 border-l-4 border-dashed border-white/50"
      style={{ background: 'var(--gradient-berry)' }}
    >
      <FruitSprite type="watermelon" size={28} decorative />
      <ArrowRight className="w-5 h-5 text-white/90" aria-hidden />
      <span
        data-testid="drop-area-label"
        // 1文字ずつ縦に積む。折り返しに任せると語の途中で割れる
        className="flex flex-col items-center leading-tight text-white font-bold text-sm drop-shadow-lg"
      >
        {Array.from(label).map((char, i) => (
          <span key={i} aria-hidden>
            {char === ' ' ? ' ' : char}
          </span>
        ))}
        <span className="sr-only">{label}</span>
      </span>
    </div>
  )
}
