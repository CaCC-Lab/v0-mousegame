import { DifficultyManager } from '../difficultyManager'
import { DifficultyLevel } from '../../types/difficulty'

describe('DifficultyManager', () => {
  let difficultyManager: DifficultyManager

  beforeEach(() => {
    localStorage.clear()
    difficultyManager = new DifficultyManager()
  })

  describe('Initialization', () => {
    it('should initialize with normal difficulty as default', () => {
      expect(difficultyManager.getCurrentDifficulty()).toBe('normal')
    })

    it('should load difficulty from localStorage if available', () => {
      localStorage.setItem('fruitHarvestDifficulty', 'hard')
      const manager = new DifficultyManager()
      expect(manager.getCurrentDifficulty()).toBe('hard')
    })

    it('should default to normal if invalid difficulty in localStorage', () => {
      localStorage.setItem('fruitHarvestDifficulty', 'invalid')
      const manager = new DifficultyManager()
      expect(manager.getCurrentDifficulty()).toBe('normal')
    })
  })

  describe('Difficulty Setting', () => {
    it('should set difficulty level', () => {
      difficultyManager.setDifficulty('hard')
      expect(difficultyManager.getCurrentDifficulty()).toBe('hard')
    })

    it('should save difficulty to localStorage', () => {
      difficultyManager.setDifficulty('easy')
      expect(localStorage.getItem('fruitHarvestDifficulty')).toBe('easy')
    })

    it('should not accept invalid difficulty levels', () => {
      difficultyManager.setDifficulty('invalid' as DifficultyLevel)
      expect(difficultyManager.getCurrentDifficulty()).toBe('normal')
    })
  })

  describe('Configuration Retrieval', () => {
    it('should return correct config for easy difficulty', () => {
      difficultyManager.setDifficulty('easy')
      const config = difficultyManager.getCurrentConfig()
      
      expect(config.fruitCount).toBe(8)
      expect(config.gameSpeed).toBe(0.8)
      expect(config.timeLimitMultiplier).toBe(1.5)
      expect(config.fruitSpeedMultiplier).toBe(0.5)
      expect(config.scoreMultiplier).toBe(0.8)
    })

    it('should return correct config for normal difficulty', () => {
      difficultyManager.setDifficulty('normal')
      const config = difficultyManager.getCurrentConfig()
      
      expect(config.fruitCount).toBe(10)
      expect(config.gameSpeed).toBe(1.0)
      expect(config.timeLimitMultiplier).toBe(1.0)
      expect(config.fruitSpeedMultiplier).toBe(1.0)
      expect(config.scoreMultiplier).toBe(1.0)
    })

    it('should return correct config for hard difficulty', () => {
      difficultyManager.setDifficulty('hard')
      const config = difficultyManager.getCurrentConfig()
      
      expect(config.fruitCount).toBe(12)
      expect(config.gameSpeed).toBe(1.3)
      expect(config.timeLimitMultiplier).toBe(0.8)
      expect(config.fruitSpeedMultiplier).toBe(1.5)
      expect(config.scoreMultiplier).toBe(1.2)
    })
  })

  describe('Game Time Calculation', () => {
    it('should calculate correct game time for easy mode', () => {
      difficultyManager.setDifficulty('easy')
      const baseTime = 180 // 3 minutes
      const adjustedTime = difficultyManager.getAdjustedGameTime(baseTime)
      expect(adjustedTime).toBe(270) // 180 * 1.5
    })

    it('should calculate correct game time for hard mode', () => {
      difficultyManager.setDifficulty('hard')
      const baseTime = 180
      const adjustedTime = difficultyManager.getAdjustedGameTime(baseTime)
      expect(adjustedTime).toBe(144) // 180 * 0.8
    })
  })

  describe('Score Calculation', () => {
    it('should calculate adjusted score for easy mode', () => {
      difficultyManager.setDifficulty('easy')
      const baseScore = 100
      const adjustedScore = difficultyManager.getAdjustedScore(baseScore)
      expect(adjustedScore).toBe(80) // 100 * 0.8
    })

    it('should calculate adjusted score for hard mode', () => {
      difficultyManager.setDifficulty('hard')
      const baseScore = 100
      const adjustedScore = difficultyManager.getAdjustedScore(baseScore)
      expect(adjustedScore).toBe(120) // 100 * 1.2
    })
  })

  describe('Available Difficulties', () => {
    it('should return all available difficulty levels', () => {
      const difficulties = difficultyManager.getAvailableDifficulties()
      expect(difficulties).toEqual(['easy', 'normal', 'hard'])
    })

    it('should return difficulty descriptions', () => {
      const descriptions = difficultyManager.getDifficultyDescriptions()
      expect(descriptions.easy).toContain('フルーツが少なく')
      expect(descriptions.normal).toContain('バランス')
      expect(descriptions.hard).toContain('時間制限が厳しく')
    })
  })
})