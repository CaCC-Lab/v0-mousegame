import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameControls } from '../GameControls'
import { translations } from '@/lib/i18n/translations'
import type { GameState } from '@/types/game'

/**
 * 待機中の操作列は「せってい」1つに畳む（v1.1 計画 G7・D3・D6、docs/game-spec.md §4.3）。
 *
 * 以前は遊ぶ前の画面に、さいかい（押せない）・リセット・ステージ選択・言語・音量・難易度・
 * うごくモードが並び、初見テストで「子どもは読めず、大人にも情報が無い。起動画面がごちゃつく」と指摘された。
 */
describe('GameControls: せってい', () => {
  const props = (gameState: GameState) => ({
    gameState,
    isHardMode: false,
    language: 'ja' as const,
    difficulty: {
      currentDifficulty: 'normal' as const,
      availableDifficulties: ['easy', 'normal', 'hard'] as ('easy' | 'normal' | 'hard')[],
      setDifficulty: jest.fn(),
    },
    soundEffects: { soundEnabled: true, volume: 0.5, toggleSound: jest.fn(), setVolume: jest.fn() },
    onStart: jest.fn(),
    onPause: jest.fn(),
    onReset: jest.fn(),
    onStageSelect: jest.fn(),
    onHardModeChange: jest.fn(),
    onToggleLanguage: jest.fn(),
    showStart: gameState !== 'idle',
    t: translations.ja,
  })

  it('待機中は「せってい」だけを出し、ほかの操作は畳んでおく', () => {
    render(<GameControls {...props('idle')} />)

    const settings = screen.getByRole('button', { name: /せってい/ })
    expect(settings).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: translations.ja.reset })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: translations.ja.resume })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Language/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByText(translations.ja.hardMode)).not.toBeInTheDocument()
  })

  it('「せってい」を押すと、ステージ選択・言語・音量・難易度・うごくモードが出る', async () => {
    const user = userEvent.setup()
    render(<GameControls {...props('idle')} />)

    await user.click(screen.getByRole('button', { name: /せってい/ }))

    expect(screen.getByRole('button', { name: /せってい/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: translations.ja.stageSelect })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Language/ })).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText(translations.ja.hardMode)).toBeInTheDocument()
  })

  it('遊んでいる間は、ちゅうだん・リセット・ステージ選択・言語・音量を出し、「せってい」と難易度は出さない', () => {
    render(<GameControls {...props('playing')} />)

    expect(screen.getByRole('button', { name: translations.ja.pause })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: translations.ja.reset })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: translations.ja.stageSelect })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Language/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /せってい/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
