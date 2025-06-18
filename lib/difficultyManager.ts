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
        console.warn('Failed to load difficulty settings. Using default values.', error)
      }
    }
  }

  private saveDifficultyToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, this.currentDifficulty)
      } catch (error) {
        console.warn('Failed to save difficulty settings.', error)
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

  // Descriptions are now handled by i18n
  getDifficultyDescriptions(): Record<DifficultyLevel, string> {
    // Return empty descriptions as they're now handled by the useLanguage hook
    return {
      easy: '',
      normal: '',
      hard: ''
    }
  }
}