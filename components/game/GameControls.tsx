"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RefreshCw, Zap, Languages, LucideIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DifficultySelector } from '../DifficultySelector'
import { SoundControls } from '../SoundControls'
import { GameState } from '@/types/game'
import { DifficultyLevel } from '@/types/difficulty'
import { translations } from '@/lib/i18n/translations'

type TranslationType = typeof translations.ja | typeof translations.en

interface GameControlsProps {
  gameState: GameState
  isHardMode: boolean
  language: 'ja' | 'en'
  difficulty: {
    currentDifficulty: DifficultyLevel
    availableDifficulties: DifficultyLevel[]
    setDifficulty: (level: DifficultyLevel) => void
  }
  soundEffects: {
    soundEnabled: boolean
    volume: number
    toggleSound: () => void
    setVolume: (volume: number) => void
  }
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onStageSelect: () => void
  onHardModeChange: (checked: boolean) => void
  onToggleLanguage: () => void
  t: TranslationType
}

interface ControlButtonConfig {
  action: () => void
  disabled: boolean
  icon: LucideIcon
  label: string
  color: string
}

function getControlButtons(
  gameState: GameState,
  onStart: () => void,
  onPause: () => void,
  onReset: () => void,
  onStageSelect: () => void,
  t: GameControlsProps['t']
): ControlButtonConfig[] {
  return [
    {
      action: onStart,
      disabled: gameState === 'playing',
      icon: Play,
      label: t.start,
      color: 'var(--color-secondary)'
    },
    {
      action: onPause,
      disabled: gameState === 'idle',
      icon: gameState === 'playing' ? Pause : Play,
      label: gameState === 'playing' ? t.pause : t.resume,
      color: 'var(--color-accent)'
    },
    {
      action: onReset,
      disabled: false,
      icon: RefreshCw,
      label: t.reset,
      color: 'var(--color-berry)'
    },
    {
      action: onStageSelect,
      disabled: false,
      icon: Zap,
      label: t.stageSelect,
      color: 'var(--color-purple)'
    }
  ]
}

function ControlButton({ config, index }: { config: ControlButtonConfig; index: number }): React.ReactElement {
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.05 * index, type: 'spring', bounce: 0.4 }}
    >
      <Button
        onClick={config.action}
        disabled={config.disabled}
        size="sm"
        className="px-4 py-1.5 rounded-[var(--radius-full)] font-bold shadow-playful hover-lift text-display"
        style={{
          backgroundColor: config.color,
          color: 'white',
          opacity: config.disabled ? 0.5 : 1,
          border: 'none',
        }}
      >
        <Icon className="mr-1.5 h-4 w-4" style={{ color: 'white' }} /> {config.label}
      </Button>
    </motion.div>
  )
}

function DifficultySettings({
  difficulty,
  gameState,
  isHardMode,
  onHardModeChange,
  language,
  t
}: Pick<GameControlsProps, 'difficulty' | 'gameState' | 'isHardMode' | 'onHardModeChange' | 'language' | 't'>): React.ReactElement {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white rounded-[var(--radius-lg)] px-4 py-3 shadow-md min-w-[320px]">
      <div className="flex-1">
        <DifficultySelector
          currentDifficulty={difficulty.currentDifficulty}
          availableDifficulties={difficulty.availableDifficulties}
          onDifficultyChange={difficulty.setDifficulty}
          disabled={gameState === 'playing'}
          language={language}
          t={t}
        />
      </div>
      <div className="flex items-center justify-center sm:justify-start space-x-2 border-t sm:border-t-0 sm:border-l border-gray-300 pt-3 sm:pt-0 sm:pl-4">
        <input
          type="checkbox"
          id="hard-mode"
          checked={isHardMode}
          onChange={(e) => onHardModeChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 focus:ring-2"
          style={{ accentColor: 'var(--color-secondary)' }}
        />
        <Label htmlFor="hard-mode" className="text-sm whitespace-nowrap font-semibold">
          {t.hardMode}
        </Label>
      </div>
    </div>
  )
}

function LanguageToggle({ language, onToggleLanguage, t }: Pick<GameControlsProps, 'language' | 'onToggleLanguage' | 't'>): React.ReactElement {
  return (
    <Button
      onClick={onToggleLanguage}
      variant="outline"
      size="sm"
      className="flex items-center font-semibold hover-lift bg-white"
      aria-label={`Language: ${t.language}`}
    >
      <Languages className="w-4 h-4 mr-1.5" />
      {language === 'ja' ? '\u65e5\u672c\u8a9e' : 'English'}
    </Button>
  )
}

export function GameControls({
  gameState,
  isHardMode,
  language,
  difficulty,
  soundEffects,
  onStart,
  onPause,
  onReset,
  onStageSelect,
  onHardModeChange,
  onToggleLanguage,
  t
}: GameControlsProps): React.ReactElement {
  const controlButtons = getControlButtons(gameState, onStart, onPause, onReset, onStageSelect, t)

  // プレイエリアを最大化するため、操作は1行のスリムなバーに収める。
  // 難易度などの設定はプレイ中に変更できない（selectはdisabled）ため、
  // 待機中（idle）のときだけ2行目として表示する
  return (
    // relative: 高さが足りない環境でプレイエリアがはみ出しても、
    // 操作ボタンが下に隠れないよう描画順を上にする
    <div className="relative shrink-0 px-3 py-2 flex flex-col gap-2" style={{ background: 'var(--color-cream-dark)' }}>
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {controlButtons.map((config, index) => (
          <ControlButton key={config.label} config={config} index={index} />
        ))}

        <LanguageToggle
          language={language}
          onToggleLanguage={onToggleLanguage}
          t={t}
        />

        <div className="bg-white rounded-[var(--radius-lg)] px-2 py-1 shadow">
          <SoundControls
            soundEnabled={soundEffects.soundEnabled}
            volume={soundEffects.volume}
            onToggleSound={soundEffects.toggleSound}
            onVolumeChange={soundEffects.setVolume}
          />
        </div>
      </div>

      {gameState === 'idle' && (
        // 高さの低い画面（スマホ横向きなど）では設定を畳み、プレイエリアを確保する
        <div className="flex flex-wrap gap-3 justify-center items-center [@media(max-height:520px)]:hidden">
          <DifficultySettings
            difficulty={difficulty}
            gameState={gameState}
            isHardMode={isHardMode}
            onHardModeChange={onHardModeChange}
            language={language}
            t={t}
          />
        </div>
      )}
    </div>
  )
}
