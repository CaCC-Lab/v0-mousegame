import type { FruitType } from './game'

export interface Stage {
  number: number
  name: string
  description: string
  targetScore: number
  targetFruits: {
    apple?: number
    blueberry?: number
    lemon?: number
    watermelon?: number
    total?: number
  }
  timeLimit: number // in seconds
  /** このステージで畑に出す果物。1面はりんごだけにして、操作を1つずつ覚える */
  fruitTypes: FruitType[]
  /** このステージで新しく覚える果物。ほかより多めに出す（STAGE_FOCUS_RATIO） */
  focusFruit?: FruitType
  unlocked: boolean
  completed: boolean
  highScore: number
  difficulty: {
    fruitCount: number
    fruitSpeed: number
    powerUpSpawnRate: number
  }
}

export interface StageProgress {
  currentStage: number
  completedStages: number[]
  totalScore: number
  unlockedStages: number[]
}

/** 覚える果物（focusFruit）を出す割合。残りは fruitTypes から均等に選ぶ */
export const STAGE_FOCUS_RATIO = 0.5

/**
 * れんしゅうのステージ。操作を1つずつ増やす順に並べる。
 * 1面はクリック（りんご）だけ。2〜4面で1つずつ操作が加わり、加わった果物を多めに出す。
 * 目標スコアは、目標の果物数をいちばん安い組み合わせで取ったときの点以下にしてある。
 */
export const STAGES: Stage[] = [
  {
    number: 1,
    name: 'リンゴ園',
    description: 'クリックで りんごを とろう',
    targetScore: 100,
    targetFruits: {
      total: 10
    },
    timeLimit: 60,
    fruitTypes: ['apple'],
    focusFruit: 'apple',
    unlocked: true,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 6,
      fruitSpeed: 1.0,
      powerUpSpawnRate: 0.1
    }
  },
  {
    number: 2,
    name: 'ブルーベリー農園',
    description: 'ダブルクリックで ブルーベリーを とろう',
    targetScore: 200,
    targetFruits: {
      blueberry: 8,
      total: 15
    },
    timeLimit: 90,
    fruitTypes: ['apple', 'blueberry'],
    focusFruit: 'blueberry',
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 8,
      fruitSpeed: 1.2,
      powerUpSpawnRate: 0.15
    }
  },
  {
    number: 3,
    name: 'レモン畑',
    description: '右クリックで レモンを とろう',
    targetScore: 240,
    targetFruits: {
      lemon: 8,
      total: 20
    },
    timeLimit: 90,
    fruitTypes: ['apple', 'blueberry', 'lemon'],
    focusFruit: 'lemon',
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 10,
      fruitSpeed: 1.3,
      powerUpSpawnRate: 0.2
    }
  },
  {
    number: 4,
    name: 'スイカ畑',
    description: 'ドラッグで スイカを はこぼう',
    targetScore: 340,
    targetFruits: {
      watermelon: 6,
      total: 25
    },
    timeLimit: 120,
    fruitTypes: ['apple', 'blueberry', 'lemon', 'watermelon'],
    focusFruit: 'watermelon',
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 10,
      fruitSpeed: 1.4,
      powerUpSpawnRate: 0.2
    }
  },
  {
    number: 5,
    name: 'フルーツ畑',
    description: '4つの そうさを ぜんぶ つかおう',
    targetScore: 500,
    targetFruits: {
      apple: 5,
      blueberry: 5,
      lemon: 5,
      watermelon: 5,
      total: 35
    },
    timeLimit: 120,
    fruitTypes: ['apple', 'blueberry', 'lemon', 'watermelon'],
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 12,
      fruitSpeed: 1.5,
      powerUpSpawnRate: 0.25
    }
  },
  {
    number: 6,
    name: 'フルーツパラダイス',
    description: '全てのフルーツをバランスよく収穫',
    targetScore: 800,
    targetFruits: {
      apple: 10,
      blueberry: 10,
      lemon: 10,
      watermelon: 10,
      total: 50
    },
    timeLimit: 150,
    fruitTypes: ['apple', 'blueberry', 'lemon', 'watermelon'],
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 15,
      fruitSpeed: 1.8,
      powerUpSpawnRate: 0.3
    }
  }
]

export const MAX_STAGES = STAGES.length