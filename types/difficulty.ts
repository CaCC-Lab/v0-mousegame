export type DifficultyLevel = 'easy' | 'normal' | 'hard'

export interface DifficultyConfig {
  fruitCount: number
  gameSpeed: number
  timeLimitMultiplier: number
  fruitSpeedMultiplier: number
  scoreMultiplier: number
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    fruitCount: 8,
    gameSpeed: 0.8,
    timeLimitMultiplier: 1.5,
    fruitSpeedMultiplier: 0.5,
    scoreMultiplier: 0.8,
  },
  normal: {
    fruitCount: 10,
    gameSpeed: 1.0,
    timeLimitMultiplier: 1.0,
    fruitSpeedMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  hard: {
    fruitCount: 12,
    gameSpeed: 1.3,
    timeLimitMultiplier: 0.8,
    fruitSpeedMultiplier: 1.5,
    scoreMultiplier: 1.2,
  },
}