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

export const STAGES: Stage[] = [
  {
    number: 1,
    name: 'フルーツ畑',
    description: 'フルーツ収穫の基本を学びましょう',
    targetScore: 100,
    targetFruits: {
      total: 10
    },
    timeLimit: 60,
    unlocked: true,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 8,
      fruitSpeed: 1.0,
      powerUpSpawnRate: 0.1
    }
  },
  {
    number: 2,
    name: 'リンゴ園',
    description: 'リンゴを中心に収穫しましょう',
    targetScore: 200,
    targetFruits: {
      apple: 10,
      total: 20
    },
    timeLimit: 90,
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 10,
      fruitSpeed: 1.2,
      powerUpSpawnRate: 0.15
    }
  },
  {
    number: 3,
    name: 'ブルーベリー農園',
    description: 'ブルーベリーのダブルクリックに挑戦',
    targetScore: 300,
    targetFruits: {
      blueberry: 15,
      total: 30
    },
    timeLimit: 90,
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
    name: 'レモン畑',
    description: 'レモンの右クリックをマスターしよう',
    targetScore: 400,
    targetFruits: {
      lemon: 10,
      total: 35
    },
    timeLimit: 120,
    unlocked: false,
    completed: false,
    highScore: 0,
    difficulty: {
      fruitCount: 12,
      fruitSpeed: 1.4,
      powerUpSpawnRate: 0.2
    }
  },
  {
    number: 5,
    name: 'スイカ畑',
    description: 'スイカドラッグの技を極めよう',
    targetScore: 500,
    targetFruits: {
      watermelon: 8,
      total: 40
    },
    timeLimit: 120,
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