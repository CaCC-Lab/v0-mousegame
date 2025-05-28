export type PowerUpType = 'timeExtension' | 'scoreMultiplier' | 'speedBoost' | 'extraFruits' | 'freezeTime'

export interface PowerUp {
  id: string
  type: PowerUpType
  x: number
  y: number
  width: number
  height: number
  active: boolean
  createdAt: number
  duration?: number // Duration in milliseconds for timed effects
}

export interface PowerUpEffect {
  type: PowerUpType
  value: number
  duration: number
  startTime: number
  active: boolean
}

export interface PowerUpConfig {
  type: PowerUpType
  name: string
  description: string
  icon: string
  color: string
  effect: {
    value: number
    duration: number
  }
  spawnChance: number // 0-1 probability
  size: {
    width: number
    height: number
  }
}

export const POWERUP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  timeExtension: {
    type: 'timeExtension',
    name: 'タイム延長',
    description: '制限時間を10秒延長します',
    icon: '⏰',
    color: '#4ade80',
    effect: {
      value: 10000, // 10 seconds in milliseconds
      duration: 0, // Instant effect
    },
    spawnChance: 0.15,
    size: { width: 40, height: 40 }
  },
  scoreMultiplier: {
    type: 'scoreMultiplier',
    name: 'スコア倍率',
    description: '15秒間スコアが2倍になります',
    icon: '⭐',
    color: '#fbbf24',
    effect: {
      value: 2,
      duration: 15000, // 15 seconds
    },
    spawnChance: 0.12,
    size: { width: 40, height: 40 }
  },
  speedBoost: {
    type: 'speedBoost',
    name: 'スピードブースト',
    description: '10秒間フルーツの動きが遅くなります',
    icon: '💨',
    color: '#06b6d4',
    effect: {
      value: 0.5, // Slow down to 50% speed
      duration: 10000, // 10 seconds
    },
    spawnChance: 0.18,
    size: { width: 40, height: 40 }
  },
  extraFruits: {
    type: 'extraFruits',
    name: '追加フルーツ',
    description: '画面に新しいフルーツを3個追加します',
    icon: '🍎',
    color: '#f87171',
    effect: {
      value: 3, // Number of fruits to add
      duration: 0, // Instant effect
    },
    spawnChance: 0.08,
    size: { width: 40, height: 40 }
  },
  freezeTime: {
    type: 'freezeTime',
    name: 'タイムフリーズ',
    description: '5秒間時間が止まります',
    icon: '❄️',
    color: '#8b5cf6',
    effect: {
      value: 1,
      duration: 5000, // 5 seconds
    },
    spawnChance: 0.05,
    size: { width: 40, height: 40 }
  }
}

export const POWERUP_SPAWN_INTERVAL = 8000 // Spawn every 8 seconds
export const POWERUP_LIFETIME = 12000 // PowerUps disappear after 12 seconds