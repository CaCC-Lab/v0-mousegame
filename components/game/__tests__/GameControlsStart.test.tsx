import React from 'react'
import { render, screen } from '@testing-library/react'
import { GameControls } from '../GameControls'
import { translations } from '@/lib/i18n/translations'

/**
 * 開始ボタンの二重化をなくす（プレイテストの指摘への対応）。
 *
 * 「下にある Start ボタンは何だったのか分からないまま時間を溶かす」
 * 待機中はプレイエリア上のモード選択が開始の入口なので、
 * 下部のボタン列からは開始ボタンを外して導線をひとつにする。
 */
describe('GameControls の開始ボタン', () => {
  const baseProps = {
    gameState: 'idle' as const,
    isHardMode: false,
    language: 'ja' as const,
    difficulty: {
      currentDifficulty: 'normal' as const,
      availableDifficulties: ['easy', 'normal', 'hard'] as const,
      setDifficulty: jest.fn(),
    },
    soundEffects: {
      soundEnabled: true,
      volume: 50,
      toggleSound: jest.fn(),
      setVolume: jest.fn(),
    },
    onStart: jest.fn(),
    onPause: jest.fn(),
    onReset: jest.fn(),
    onStageSelect: jest.fn(),
    onHardModeChange: jest.fn(),
    onToggleLanguage: jest.fn(),
    t: translations.ja,
  }

  it('showStart が false なら開始ボタンを出さない', () => {
    render(<GameControls {...baseProps} difficulty={{ ...baseProps.difficulty, availableDifficulties: [...baseProps.difficulty.availableDifficulties] }} showStart={false} />)

    expect(screen.queryByRole('button', { name: translations.ja.start })).not.toBeInTheDocument()
    // 他のボタンは残る
    expect(screen.getByRole('button', { name: translations.ja.reset })).toBeInTheDocument()
  })

  it('showStart が true なら開始ボタンを出す', () => {
    render(<GameControls {...baseProps} difficulty={{ ...baseProps.difficulty, availableDifficulties: [...baseProps.difficulty.availableDifficulties] }} showStart />)

    expect(screen.getByRole('button', { name: translations.ja.start })).toBeInTheDocument()
  })

  it('指定がなければ従来どおり開始ボタンを出す', () => {
    render(<GameControls {...baseProps} difficulty={{ ...baseProps.difficulty, availableDifficulties: [...baseProps.difficulty.availableDifficulties] }} />)

    expect(screen.getByRole('button', { name: translations.ja.start })).toBeInTheDocument()
  })
})
