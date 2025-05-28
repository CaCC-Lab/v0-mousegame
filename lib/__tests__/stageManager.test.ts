import { StageManager } from '../stageManager'
import { HarvestedFruits } from '../../types/game'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('StageManager', () => {
  let manager: StageManager

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    manager = new StageManager()
  })

  describe('constructor', () => {
    it('should initialize with stage 1', () => {
      expect(manager.getCurrentStage()).toBe(1)
      expect(manager.getStageInfo(1)?.unlocked).toBe(true)
    })

    it('should load saved progress from localStorage', () => {
      const savedProgress = {
        currentStage: 3,
        completedStages: [1, 2],
        totalScore: 500,
        unlockedStages: [1, 2, 3]
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedProgress))
      
      const savedManager = new StageManager()
      expect(savedManager.getCurrentStage()).toBe(3)
      expect(savedManager.getCompletedStages()).toEqual([1, 2])
    })
  })

  describe('getStageInfo', () => {
    it('should return stage information', () => {
      const stage1 = manager.getStageInfo(1)
      expect(stage1).toBeDefined()
      expect(stage1?.name).toBe('フルーツ畑')
      expect(stage1?.targetScore).toBe(100)
    })

    it('should return null for invalid stage', () => {
      expect(manager.getStageInfo(0)).toBeNull()
      expect(manager.getStageInfo(999)).toBeNull()
    })
  })

  describe('isStageCompleted', () => {
    it('should check if stage requirements are met', () => {
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      // Stage 1 requires 100 score and 10 total fruits
      expect(manager.isStageCompleted(1, score, harvestedFruits)).toBe(true)
    })

    it('should fail if score requirement not met', () => {
      const score = 50
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      expect(manager.isStageCompleted(1, score, harvestedFruits)).toBe(false)
    })

    it('should fail if fruit requirement not met', () => {
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 2,
        blueberry: 2,
        lemon: 1,
        watermelon: 1
      }
      
      expect(manager.isStageCompleted(1, score, harvestedFruits)).toBe(false)
    })

    it('should check specific fruit requirements', () => {
      const score = 250
      const harvestedFruits: HarvestedFruits = {
        apple: 12,
        blueberry: 5,
        lemon: 3,
        watermelon: 2
      }
      
      // Stage 2 requires 200 score, 10 apples, and 20 total fruits
      expect(manager.isStageCompleted(2, score, harvestedFruits)).toBe(true)
    })
  })

  describe('completeStage', () => {
    it('should mark stage as completed and unlock next stage', () => {
      const score = 150
      manager.completeStage(1, score)
      
      expect(manager.getStageInfo(1)?.completed).toBe(true)
      expect(manager.getStageInfo(1)?.highScore).toBe(150)
      expect(manager.getStageInfo(2)?.unlocked).toBe(true)
      expect(manager.getCompletedStages()).toContain(1)
    })

    it('should update high score if better', () => {
      manager.completeStage(1, 150)
      manager.completeStage(1, 200)
      
      expect(manager.getStageInfo(1)?.highScore).toBe(200)
    })

    it('should not update high score if worse', () => {
      manager.completeStage(1, 200)
      manager.completeStage(1, 150)
      
      expect(manager.getStageInfo(1)?.highScore).toBe(200)
    })

    it('should save progress to localStorage', () => {
      manager.completeStage(1, 150)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'stageProgress',
        expect.any(String)
      )
    })
  })

  describe('moveToNextStage', () => {
    it('should advance to next stage if available', () => {
      manager.completeStage(1, 150)
      const moved = manager.moveToNextStage()
      
      expect(moved).toBe(true)
      expect(manager.getCurrentStage()).toBe(2)
    })

    it('should not advance if next stage is locked', () => {
      const moved = manager.moveToNextStage()
      
      expect(moved).toBe(false)
      expect(manager.getCurrentStage()).toBe(1)
    })

    it('should not advance past last stage', () => {
      // Complete all stages
      for (let i = 1; i <= 5; i++) {
        manager.completeStage(i, 1000)
        manager.moveToNextStage()
      }
      
      const moved = manager.moveToNextStage()
      expect(moved).toBe(false)
      expect(manager.getCurrentStage()).toBe(6)
    })
  })

  describe('selectStage', () => {
    it('should select unlocked stage', () => {
      manager.completeStage(1, 150)
      manager.completeStage(2, 250)
      
      const selected = manager.selectStage(2)
      expect(selected).toBe(true)
      expect(manager.getCurrentStage()).toBe(2)
    })

    it('should not select locked stage', () => {
      const selected = manager.selectStage(3)
      expect(selected).toBe(false)
      expect(manager.getCurrentStage()).toBe(1)
    })
  })

  describe('getTotalScore', () => {
    it('should calculate total score across all stages', () => {
      manager.completeStage(1, 150)
      manager.completeStage(2, 250)
      manager.completeStage(1, 180) // Update stage 1
      
      expect(manager.getTotalScore()).toBe(430) // 180 + 250
    })
  })

  describe('reset', () => {
    it('should reset all progress', () => {
      manager.completeStage(1, 150)
      manager.completeStage(2, 250)
      manager.moveToNextStage()
      
      manager.reset()
      
      expect(manager.getCurrentStage()).toBe(1)
      expect(manager.getCompletedStages()).toEqual([])
      expect(manager.getStageInfo(1)?.completed).toBe(false)
      expect(manager.getStageInfo(1)?.highScore).toBe(0)
      expect(manager.getStageInfo(2)?.unlocked).toBe(false)
    })

    it('should clear localStorage', () => {
      manager.completeStage(1, 150)
      manager.reset()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('stageProgress')
    })
  })

  describe('getAllStages', () => {
    it('should return all stages with current state', () => {
      manager.completeStage(1, 150)
      
      const allStages = manager.getAllStages()
      expect(allStages).toHaveLength(6)
      expect(allStages[0].completed).toBe(true)
      expect(allStages[0].highScore).toBe(150)
      expect(allStages[1].unlocked).toBe(true)
    })
  })
})