import { DifficultyLevel, DifficultyConfig, DIFFICULTY_CONFIGS } from '../types/difficulty'

export class DifficultyManager {
  private currentDifficulty: DifficultyLevel = 'normal'
  private readonly STORAGE_KEY = 'fruitHarvestDifficulty'

  constructor() {
    this.loadDifficultyFromStorage()
  }

  private loadDifficultyFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedDifficulty = localStorage.getItem(this.STORAGE_KEY)
        if (storedDifficulty && this.isValidDifficulty(storedDifficulty)) {
          this.currentDifficulty = storedDifficulty as DifficultyLevel
        }
      } catch (error) {
        console.warn('難易度設定の読み込みに失敗しました。デフォルト値を使用します。', error)
      }
    }
  }

  private saveDifficultyToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, this.currentDifficulty)
      } catch (error) {
        console.warn('難易度設定の保存に失敗しました。', error)
      }
    }
  }

  private isValidDifficulty(difficulty: string): boolean {
    return Object.keys(DIFFICULTY_CONFIGS).includes(difficulty)
  }

  getCurrentDifficulty(): DifficultyLevel {
    return this.currentDifficulty
  }

  setDifficulty(difficulty: DifficultyLevel): void {
    if (this.isValidDifficulty(difficulty)) {
      this.currentDifficulty = difficulty
      this.saveDifficultyToStorage()
    }
  }

  getCurrentConfig(): DifficultyConfig {
    return DIFFICULTY_CONFIGS[this.currentDifficulty]
  }

  getAdjustedGameTime(baseTime: number): number {
    const config = this.getCurrentConfig()
    return Math.round(baseTime * config.timeLimitMultiplier)
  }

  getAdjustedScore(baseScore: number): number {
    const config = this.getCurrentConfig()
    return Math.round(baseScore * config.scoreMultiplier)
  }

  getAvailableDifficulties(): DifficultyLevel[] {
    return Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]
  }

  getDifficultyDescriptions(): Record<DifficultyLevel, string> {
    const descriptions: Record<DifficultyLevel, string> = {} as Record<DifficultyLevel, string>
    
    for (const [level, config] of Object.entries(DIFFICULTY_CONFIGS)) {
      descriptions[level as DifficultyLevel] = config.description
    }
    
    return descriptions
  }
}