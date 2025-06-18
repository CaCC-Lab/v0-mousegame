import { Stage, StageProgress, STAGES } from '../types/stage'
import { HarvestedFruits } from '../types/game'

export class StageManager {
  private stages: Stage[]
  private currentStage: number
  private progress: StageProgress

  constructor() {
    // Deep clone the stages to avoid modifying the original
    this.stages = STAGES.map(stage => ({ ...stage }))
    
    // Load saved progress or initialize new
    const savedProgress = this.loadProgress()
    if (savedProgress) {
      this.progress = savedProgress
      this.currentStage = savedProgress.currentStage
      this.applyProgress(savedProgress)
    } else {
      this.currentStage = 1
      this.progress = {
        currentStage: 1,
        completedStages: [],
        totalScore: 0,
        unlockedStages: [1]
      }
    }
  }

  private loadProgress(): StageProgress | null {
    if (typeof window === 'undefined') return null
    
    try {
      const saved = localStorage.getItem('stageProgress')
      if (!saved) return null
      
      return JSON.parse(saved)
    } catch (error) {
      console.warn('Failed to load stage progress. Starting as new game.', error)
      return null
    }
  }

  private saveProgress(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('stageProgress', JSON.stringify(this.progress))
    } catch (error) {
      console.warn('Failed to save stage progress.', error)
    }
  }

  private applyProgress(progress: StageProgress): void {
    // Apply completed stages
    progress.completedStages.forEach(stageNum => {
      const stage = this.stages.find(s => s.number === stageNum)
      if (stage) {
        stage.completed = true
      }
    })

    // Apply unlocked stages
    progress.unlockedStages.forEach(stageNum => {
      const stage = this.stages.find(s => s.number === stageNum)
      if (stage) {
        stage.unlocked = true
      }
    })

    // Load high scores from localStorage
    this.stages.forEach(stage => {
      try {
        const highScore = localStorage.getItem(`stage${stage.number}HighScore`)
        if (highScore) {
          const score = parseInt(highScore, 10)
          if (!isNaN(score) && score >= 0) {
            stage.highScore = score
          }
        }
      } catch (error) {
        console.warn(`ステージ${stage.number}のハイスコア読み込みに失敗しました。`, error)
      }
    })
  }

  getCurrentStage(): number {
    return this.currentStage
  }

  getStageInfo(stageNumber: number): Stage | null {
    const stage = this.stages.find(s => s.number === stageNumber)
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

    // Check score requirement
    if (score < stage.targetScore) return false

    // Check fruit requirements
    const totalHarvested = Object.values(harvestedFruits).reduce((sum, count) => sum + count, 0)
    
    // Check total fruits requirement
    if (stage.targetFruits.total && totalHarvested < stage.targetFruits.total) {
      return false
    }

    // Check specific fruit requirements
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
    const stage = this.stages.find(s => s.number === stageNumber)
    if (!stage) return

    // Mark as completed
    stage.completed = true
    if (!this.progress.completedStages.includes(stageNumber)) {
      this.progress.completedStages.push(stageNumber)
    }

    // Update high score
    if (score > stage.highScore) {
      stage.highScore = score
      localStorage.setItem(`stage${stageNumber}HighScore`, score.toString())
    }

    // Unlock next stage
    const nextStage = this.stages.find(s => s.number === stageNumber + 1)
    if (nextStage && !nextStage.unlocked) {
      nextStage.unlocked = true
      if (!this.progress.unlockedStages.includes(nextStage.number)) {
        this.progress.unlockedStages.push(nextStage.number)
      }
    }

    // Update total score
    this.updateTotalScore()

    // Save progress
    this.saveProgress()
  }

  private updateTotalScore(): void {
    this.progress.totalScore = this.stages
      .filter(s => s.completed)
      .reduce((sum, stage) => sum + stage.highScore, 0)
  }

  moveToNextStage(): boolean {
    const nextStageNumber = this.currentStage + 1
    const nextStage = this.stages.find(s => s.number === nextStageNumber)
    
    if (!nextStage || !nextStage.unlocked) {
      return false
    }

    this.currentStage = nextStageNumber
    this.progress.currentStage = nextStageNumber
    this.saveProgress()
    return true
  }

  selectStage(stageNumber: number): boolean {
    const stage = this.stages.find(s => s.number === stageNumber)
    
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
    // Reset all stages
    this.stages = STAGES.map(stage => ({ ...stage }))
    
    // Reset progress
    this.currentStage = 1
    this.progress = {
      currentStage: 1,
      completedStages: [],
      totalScore: 0,
      unlockedStages: [1]
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stageProgress')
      this.stages.forEach(stage => {
        localStorage.removeItem(`stage${stage.number}HighScore`)
      })
    }
  }
}