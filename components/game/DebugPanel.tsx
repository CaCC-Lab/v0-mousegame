"use client"

import React from 'react'
import type { DebugStats } from '@/lib/debugTools'
import type { GameMode } from '@/types/arcade'
import type { GameState } from '@/types/game'

interface DebugPanelProps {
  mode: GameMode
  gameState: GameState
  timeLeft: number
  combo: number
  comboMultiplier: number
  stats: DebugStats
}

/**
 * `?debug=1` のときだけ出す診断（docs/game-spec.md §10）。
 * 操作の邪魔をしないよう、クリックは下へ通す。文言は開発者向けなので翻訳しない。
 */
export function DebugPanel({ mode, gameState, timeLeft, combo, comboMultiplier, stats }: DebugPanelProps): React.ReactElement {
  const last = stats.last ? `${stats.last.fruitType}/${stats.last.action}/${stats.last.ok ? 'ok' : 'miss'}` : '-'
  return (
    <div
      data-testid="debug-panel"
      className="fixed bottom-2 left-2 z-[60] pointer-events-none rounded bg-black/75 px-2 py-1 font-mono text-[11px] leading-tight text-white"
    >
      <div>mode: {mode}</div>
      <div>state: {gameState}</div>
      <div>time: {timeLeft}</div>
      <div>combo: {combo} (x{comboMultiplier})</div>
      <div>last: {last}</div>
      <div>
        ok: click <span data-testid="debug-ok-click">{stats.successes.click}</span>
        {' / '}dbl <span data-testid="debug-ok-doubleClick">{stats.successes.doubleClick}</span>
        {' / '}right <span data-testid="debug-ok-rightClick">{stats.successes.rightClick}</span>
        {' / '}drop <span data-testid="debug-ok-drop">{stats.successes.drop}</span>
      </div>
      <div>miss: <span data-testid="debug-miss">{stats.misses}</span></div>
    </div>
  )
}
