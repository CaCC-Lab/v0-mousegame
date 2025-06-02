import { StageManager } from '../stageManager'
import { HarvestedFruits } from '../../types/game'

/**
 * StageManagerの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('StageManager', () => {
  let manager: StageManager

  beforeEach(() => {
    localStorage.clear()
    manager = new StageManager()
  })

  describe('constructor', () => {
    it('initializes with stage 1', () => {
      expect(manager.getCurrentStage()).toBe(1)
      expect(manager.getStageInfo(1)?.unlocked).toBe(true)
    })

    it('loads saved progress from localStorage', () => {
      // 事前にプログレスを保存
      const savedProgress = {
        currentStage: 3,
        completedStages: [1, 2],
        totalScore: 500,
        unlockedStages: [1, 2, 3]
      }
      localStorage.setItem('stageProgress', JSON.stringify(savedProgress))
      
      const savedManager = new StageManager()
      expect(savedManager.getCurrentStage()).toBe(3)
      expect(savedManager.getCompletedStages()).toEqual([1, 2])
    })

    it('handles invalid localStorage data gracefully', () => {
      localStorage.setItem('stageProgress', 'invalid json')
      
      const newManager = new StageManager()
      expect(newManager.getCurrentStage()).toBe(1)
      expect(newManager.getCompletedStages()).toEqual([])
    })
  })

  describe('getStageInfo', () => {
    it('returns stage information', () => {
      const stage1 = manager.getStageInfo(1)
      expect(stage1).toBeDefined()
      expect(stage1?.name).toBe('フルーツ畑')
      expect(stage1?.targetScore).toBe(100)
    })

    it('returns null for invalid stage', () => {
      expect(manager.getStageInfo(0)).toBeNull()
      expect(manager.getStageInfo(999)).toBeNull()
    })
  })

  describe('isStageCompleted', () => {
    it('checks if stage requirements are met', () => {
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

    it('fails if score requirement not met', () => {
      const score = 50
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      expect(manager.isStageCompleted(1, score, harvestedFruits)).toBe(false)
    })

    it('fails if fruit requirement not met', () => {
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 2,
        blueberry: 2,
        lemon: 1,
        watermelon: 1
      }
      
      expect(manager.isStageCompleted(1, score, harvestedFruits)).toBe(false)
    })

    it('checks specific fruit requirements', () => {
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
    it('marks stage as completed and unlocks next stage', () => {
      const score = 150
      manager.completeStage(1, score)
      
      expect(manager.getStageInfo(1)?.completed).toBe(true)
      expect(manager.getStageInfo(1)?.highScore).toBe(150)
      expect(manager.getStageInfo(2)?.unlocked).toBe(true)
      expect(manager.getCompletedStages()).toContain(1)
    })

    it('updates high score if better', () => {
      manager.completeStage(1, 150)
      manager.completeStage(1, 200)
      
      expect(manager.getStageInfo(1)?.highScore).toBe(200)
    })

    it('does not update high score if worse', () => {
      manager.completeStage(1, 200)
      manager.completeStage(1, 150)
      
      expect(manager.getStageInfo(1)?.highScore).toBe(200)
    })

    it('saves progress to localStorage', () => {
      manager.completeStage(1, 150)
      
      const savedData = localStorage.getItem('stageProgress')
      expect(savedData).toBeTruthy()
      
      const parsed = JSON.parse(savedData!)
      expect(parsed.completedStages).toContain(1)
      expect(parsed.unlockedStages).toContain(2)
    })
  })

  describe('moveToNextStage', () => {
    it('advances to next stage if available', () => {
      manager.completeStage(1, 150)
      const moved = manager.moveToNextStage()
      
      expect(moved).toBe(true)
      expect(manager.getCurrentStage()).toBe(2)
    })

    it('does not advance if next stage is locked', () => {
      const moved = manager.moveToNextStage()
      
      expect(moved).toBe(false)
      expect(manager.getCurrentStage()).toBe(1)
    })

    it('does not advance past last stage', () => {
      // すべてのステージを完了
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
    it('selects unlocked stage', () => {
      manager.completeStage(1, 150)
      manager.completeStage(2, 250)
      
      const selected = manager.selectStage(2)
      expect(selected).toBe(true)
      expect(manager.getCurrentStage()).toBe(2)
    })

    it('does not select locked stage', () => {
      const selected = manager.selectStage(3)
      expect(selected).toBe(false)
      expect(manager.getCurrentStage()).toBe(1)
    })

    it('allows selecting stage 1 always', () => {
      manager.completeStage(1, 150)
      manager.moveToNextStage()
      
      const selected = manager.selectStage(1)
      expect(selected).toBe(true)
      expect(manager.getCurrentStage()).toBe(1)
    })
  })

  describe('getTotalScore', () => {
    it('calculates total score across all stages', () => {
      manager.completeStage(1, 150)
      manager.completeStage(2, 250)
      manager.completeStage(1, 180) // ステージ1を更新
      
      expect(manager.getTotalScore()).toBe(430) // 180 + 250
    })

    it('returns 0 when no stages completed', () => {
      expect(manager.getTotalScore()).toBe(0)
    })
  })

  describe('reset', () => {
    it('resets all progress', () => {
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

    it('clears localStorage', () => {
      manager.completeStage(1, 150)
      manager.reset()
      
      expect(localStorage.getItem('stageProgress')).toBeNull()
    })
  })

  describe('getAllStages', () => {
    it('returns all stages with current state', () => {
      manager.completeStage(1, 150)
      
      const allStages = manager.getAllStages()
      expect(allStages).toHaveLength(6)
      expect(allStages[0].completed).toBe(true)
      expect(allStages[0].highScore).toBe(150)
      expect(allStages[1].unlocked).toBe(true)
    })
  })

  describe('persistence across instances', () => {
    it('maintains state across StageManager instances', () => {
      manager.completeStage(1, 150)
      manager.completeStage(2, 200)
      manager.selectStage(2)
      
      // 新しいインスタンスを作成
      const newManager = new StageManager()
      expect(newManager.getCurrentStage()).toBe(2)
      expect(newManager.getCompletedStages()).toEqual([1, 2])
      expect(newManager.getStageInfo(1)?.highScore).toBe(150)
      expect(newManager.getStageInfo(2)?.highScore).toBe(200)
    })
  })
})