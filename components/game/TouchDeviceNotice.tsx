"use client"

import React, { useEffect, useState } from 'react'
import { Hand, X } from 'lucide-react'

interface TouchDeviceNoticeProps {
  t: {
    touchDeviceNotice: string
    close: string
  }
}

/**
 * タッチのみの端末で開いた人への操作ヒント。
 *
 * 4つの操作はタッチでも成立する（タップ／すばやく2回タップ／長押し／なぞる）が、
 * 「長押しが右クリックの代わり」であることは触ってみないと分からないので、
 * 最初に一度だけ伝える。
 * 画面幅ではなく入力手段で判定する:
 *   hover:none かつ pointer:coarse ＝ タッチのみ（スマホ・タブレット単体）
 * iPad+マウスやChromebookのようにポインタがある端末には表示しない。
 */
export function TouchDeviceNotice({ t }: TouchDeviceNoticeProps): React.ReactElement | null {
  const [isTouchOnly, setIsTouchOnly] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // SSRでは判定できないため、マウント後に一度だけ判定する
    setIsTouchOnly(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  }, [])

  if (!isTouchOnly || dismissed) return null

  return (
    <div
      role="note"
      className="flex items-center gap-2 bg-amber-100 border-b-2 border-amber-300 text-amber-900 px-3 py-2 text-sm font-semibold shrink-0"
    >
      <Hand className="w-4 h-4 shrink-0" aria-hidden />
      <span className="flex-1">{t.touchDeviceNotice}</span>
      <button
        type="button"
        aria-label={t.close}
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-amber-200"
      >
        <X className="w-4 h-4" aria-hidden />
      </button>
    </div>
  )
}
