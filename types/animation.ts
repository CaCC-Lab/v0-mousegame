export type AnimationType = 
  | 'fruitCollect'
  | 'powerUpCollect'
  | 'scoreUpdate'
  | 'stageComplete'
  | 'comboEffect'
  | 'fruitSpawn'
  | 'fruitMove'
  | 'uiTransition'

export interface AnimationConfig {
  type: AnimationType
  duration: number
  easing: string
  delay?: number
  repeat?: number
  scale?: number
  rotation?: number
  opacity?: number
}

export interface ParticleEffect {
  id: string
  x: number
  y: number
  type: 'star' | 'heart' | 'sparkle' | 'bubble' | 'confetti'
  color: string
  size: number
  duration: number
  velocity: {
    x: number
    y: number
  }
  gravity?: number
  fadeOut?: boolean
}

export interface AnimationPreset {
  fruitCollect: AnimationConfig
  powerUpCollect: AnimationConfig
  scoreUpdate: AnimationConfig
  stageComplete: AnimationConfig
  comboEffect: AnimationConfig
  fruitSpawn: AnimationConfig
  fruitMove: AnimationConfig
  uiTransition: AnimationConfig
}

export const DEFAULT_ANIMATION_PRESETS: AnimationPreset = {
  fruitCollect: {
    type: 'fruitCollect',
    duration: 0.5,
    easing: 'easeOutBack',
    scale: 1.5,
    opacity: 0,
    rotation: 360
  },
  powerUpCollect: {
    type: 'powerUpCollect',
    duration: 0.8,
    easing: 'easeOutElastic',
    scale: 2,
    opacity: 0,
    rotation: 720
  },
  scoreUpdate: {
    type: 'scoreUpdate',
    duration: 0.3,
    easing: 'easeOutCubic',
    scale: 1.2
  },
  stageComplete: {
    type: 'stageComplete',
    duration: 1.5,
    easing: 'easeInOutQuart',
    scale: 1.5,
    rotation: 360,
    repeat: 2
  },
  comboEffect: {
    type: 'comboEffect',
    duration: 0.6,
    easing: 'easeOutExpo',
    scale: 1.3,
    delay: 0.1
  },
  fruitSpawn: {
    type: 'fruitSpawn',
    duration: 0.4,
    easing: 'easeOutBack',
    scale: 1.2,
    opacity: 1
  },
  fruitMove: {
    type: 'fruitMove',
    duration: 0.1,
    easing: 'linear'
  },
  uiTransition: {
    type: 'uiTransition',
    duration: 0.2,
    easing: 'easeInOut'
  }
}

export interface ComboInfo {
  count: number
  multiplier: number
  timeWindow: number // milliseconds
  lastCollectTime: number
}

export const COMBO_THRESHOLDS = [
  { count: 3, multiplier: 1.5, message: 'コンボ x3!' },
  { count: 5, multiplier: 2.0, message: 'スーパーコンボ x5!' },
  { count: 10, multiplier: 3.0, message: 'ウルトラコンボ x10!' },
  { count: 15, multiplier: 5.0, message: 'メガコンボ x15!' }
]

export const PARTICLE_COLORS = {
  star: ['#FFD700', '#FFA500', '#FF69B4'],
  heart: ['#FF1493', '#FF69B4', '#FFB6C1'],
  sparkle: ['#FFFFFF', '#F0E68C', '#FFD700'],
  bubble: ['#87CEEB', '#00BFFF', '#1E90FF'],
  confetti: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']
}