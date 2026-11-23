import React from 'react'
import { DOUBLE_CLICK_SPEED_ORDER, normalizeDoubleClickSpeed, type DoubleClickSpeed } from '@/lib/touchGestures'
import { translations } from '@/lib/i18n/translations'

interface DoubleClickSpeedSelectorProps {
  value: DoubleClickSpeed
  onChange: (speed: DoubleClickSpeed) => void
  disabled?: boolean
  t: typeof translations.ja | typeof translations.en
}

/** ゆっくりダブルクリックする子のために、ブルーベリーの2回目を待つ時間をえらぶ（docs/game-spec.md §2） */
export function DoubleClickSpeedSelector({ value, onChange, disabled = false, t }: DoubleClickSpeedSelectorProps) {
  return (
    <div className="flex flex-col gap-1 bg-white rounded-[var(--radius-lg)] px-4 py-3 shadow-md min-w-[320px]">
      <label htmlFor="double-click-speed" className="text-sm font-semibold">
        {t.doubleClickSpeed}
      </label>
      <select
        id="double-click-speed"
        data-testid="double-click-speed"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(normalizeDoubleClickSpeed(e.target.value))}
        aria-describedby="double-click-speed-hint"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:outline-none"
      >
        {DOUBLE_CLICK_SPEED_ORDER.map((speed) => (
          <option key={speed} value={speed}>
            {t.doubleClickSpeedOptions[speed]}
          </option>
        ))}
      </select>
      <p id="double-click-speed-hint" className="text-xs text-gray-600">
        {t.doubleClickSpeedHint}
      </p>
    </div>
  )
}
