export type FruitType = 'apple' | 'blueberry' | 'lemon' | 'watermelon'
export type FruitSize = 'small' | 'medium' | 'large'
export type GameState = 'idle' | 'playing' | 'paused'
export type InteractionType = 'click' | 'doubleClick' | 'rightClick' | 'drop'

export interface Fruit {
  id: number
  type: FruitType
  size: FruitSize
  x: number
  y: number
  dx: number
  dy: number
}

export interface HarvestAnimation {
  id: number
  type: FruitType
  x: number
  y: number
}

export interface HarvestedFruits {
  apple: number
  blueberry: number
  lemon: number
  watermelon: number
}

export interface GameScore {
  apple: 10
  blueberry: 20
  lemon: 15
  watermelon: 25
}

export interface GameConfig {
  gameWidth: 100
  gameHeight: 100
  dropAreaWidth: 16
  fruitCount: 10
  gameDuration: 180 // seconds
}

export const FRUIT_EMOJI: Record<FruitType, string> = {
  apple: '🍎',
  blueberry: '🫐',
  lemon: '🍋',
  watermelon: '🍉',
}

export const GAME_SCORES: GameScore = {
  apple: 10,
  blueberry: 20,
  lemon: 15,
  watermelon: 25,
}

export const GAME_CONFIG: GameConfig = {
  gameWidth: 100,
  gameHeight: 100,
  dropAreaWidth: 16,
  fruitCount: 10,
  gameDuration: 180,
}

export const PLAY_AREA_WIDTH = GAME_CONFIG.gameWidth - GAME_CONFIG.dropAreaWidth

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`
}