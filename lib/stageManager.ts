import { Stage, StageProgress, STAGES } from '../types/stage'
import { HarvestedFruits } from '../types/game'

const STORAGE_KEYS = {
  progress: 'stageProgress',
  highScore: (stageNumber: number) => `stage${stageNumber}HighScore`
} as const

function createInitialProgress(): StageProgress {
  return {
    currentStage: 1,
    completedStages: [],
    totalScore: 0,
    unlockedStages: [1]
  }
}

function isClient(): boolean {
  return typeof window !== 'undefined'
}

function safeLocalStorageGet(key: string): string | null {
  if (!isClient()) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  if (!isClient()) return
  try {
    localStorage.setItem(key, value)
  } catch {
    // Silent fail for localStorage errors
  }
}

function safeLocalStorageRemove(key: string): void {
  if (!isClient()) return
  try {
    localStorage.removeItem(key)
  } catch {
    // Silent fail for localStorage errors
  }
}

export class StageManager {
  private stages: Stage[]
  private currentStage: number
  private progress: StageProgress

  constructor() {
    this.stages = STAGES.map(stage => ({ ...stage }))

    const savedProgress = this.loadProgress()
    if (savedProgress) {
      this.progress = savedProgress
      this.currentStage = savedProgress.currentStage
      this.applyProgress(savedProgress)
    } else {
      this.currentStage = 1
      this.progress = createInitialProgress()
    }
  }

  private loadProgress(): StageProgress | null {
    const saved = safeLocalStorageGet(STORAGE_KEYS.progress)
    if (!saved) return null

    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }

  private saveProgress(): void {
    safeLocalStorageSet(STORAGE_KEYS.progress, JSON.stringify(this.progress))
  }

  private applyProgress(progress: StageProgress): void {
    progress.completedStages.forEach(stageNum => {
      const stage = this.findStage(stageNum)
      if (stage) stage.completed = true
    })

    progress.unlockedStages.forEach(stageNum => {
      const stage = this.findStage(stageNum)
      if (stage) stage.unlocked = true
    })

    this.loadHighScores()
  }

  private loadHighScores(): void {
    this.stages.forEach(stage => {
      const highScoreStr = safeLocalStorageGet(STORAGE_KEYS.highScore(stage.number))
      if (highScoreStr) {
        const score = parseInt(highScoreStr, 10)
        if (!isNaN(score) && score >= 0) {
          stage.highScore = score
        }
      }
    })
  }

  private findStage(stageNumber: number): Stage | undefined {
    return this.stages.find(s => s.number === stageNumber)
  }

  getCurrentStage(): number {
    return this.currentStage
  }

  getStageInfo(stageNumber: number): Stage | null {
    const stage = this.findStage(stageNumber)
    return stage ? { ...stage } : null
  }

  getCompletedStages(): number[] {
    return [...this.progress.completedStages]
  }

  isStageCompleted(
    stageNumber: number,
    score: number,
    harvestedFruits: HarvestedFruits
  ): boolean {
    const stage = this.getStageInfo(stageNumber)
    if (!stage) return false

    if (score < stage.targetScore) return false

    const totalHarvested = Object.values(harvestedFruits).reduce((sum, count) => sum + count, 0)

    if (stage.targetFruits.total && totalHarvested < stage.targetFruits.total) {
      return false
    }

    for (const [fruitType, required] of Object.entries(stage.targetFruits)) {
      if (fruitType === 'total') continue

      const harvested = harvestedFruits[fruitType as keyof HarvestedFruits]
      if (required && harvested < required) {
        return false
      }
    }

    return true
  }

  completeStage(stageNumber: number, score: number): void {
    const stage = this.findStage(stageNumber)
    if (!stage) return

    stage.completed = true
    if (!this.progress.completedStages.includes(stageNumber)) {
      this.progress.completedStages.push(stageNumber)
    }

    if (score > stage.highScore) {
      stage.highScore = score
      safeLocalStorageSet(STORAGE_KEYS.highScore(stageNumber), score.toString())
    }

    this.unlockNextStage(stageNumber)
    this.updateTotalScore()
    this.saveProgress()
  }

  private unlockNextStage(currentStageNumber: number): void {
    const nextStage = this.findStage(currentStageNumber + 1)
    if (nextStage && !nextStage.unlocked) {
      nextStage.unlocked = true
      if (!this.progress.unlockedStages.includes(nextStage.number)) {
        this.progress.unlockedStages.push(nextStage.number)
      }
    }
  }

  private updateTotalScore(): void {
    this.progress.totalScore = this.stages
      .filter(s => s.completed)
      .reduce((sum, stage) => sum + stage.highScore, 0)
  }

  moveToNextStage(): boolean {
    const nextStageNumber = this.currentStage + 1
    const nextStage = this.findStage(nextStageNumber)

    if (!nextStage || !nextStage.unlocked) {
      return false
    }

    this.currentStage = nextStageNumber
    this.progress.currentStage = nextStageNumber
    this.saveProgress()
    return true
  }

  selectStage(stageNumber: number): boolean {
    const stage = this.findStage(stageNumber)

    if (!stage || !stage.unlocked) {
      return false
    }

    this.currentStage = stageNumber
    this.progress.currentStage = stageNumber
    this.saveProgress()
    return true
  }

  getTotalScore(): number {
    return this.progress.totalScore
  }

  getAllStages(): Stage[] {
    return this.stages.map(stage => ({ ...stage }))
  }

  reset(): void {
    this.stages = STAGES.map(stage => ({ ...stage }))
    this.currentStage = 1
    this.progress = createInitialProgress()

    safeLocalStorageRemove(STORAGE_KEYS.progress)
    this.stages.forEach(stage => {
      safeLocalStorageRemove(STORAGE_KEYS.highScore(stage.number))
    })
  }
}
