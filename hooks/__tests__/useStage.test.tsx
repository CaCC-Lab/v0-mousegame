import { renderHook, act } from '@testing-library/react'
import { useStage } from '../useStage'
import { HarvestedFruits } from '../../types/game'

/**
 * useStageの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('useStage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('initializes with stage 1', () => {
      const { result } = renderHook(() => useStage())
      
      expect(result.current.currentStage).toBe(1)
      expect(result.current.currentStageInfo).toBeDefined()
      expect(result.current.currentStageInfo?.name).toBe('フルーツ畑')
      expect(result.current.currentStageInfo?.unlocked).toBe(true)
    })

    it('loads saved stage progress', () => {
      // 事前にプログレスを保存
      const savedProgress = {
        currentStage: 2,
        completedStages: [1],
        totalScore: 150,
        unlockedStages: [1, 2]
      }
      localStorage.setItem('stageProgress', JSON.stringify(savedProgress))
      
      const { result } = renderHook(() => useStage())
      
      expect(result.current.currentStage).toBe(2)
      expect(result.current.completedStages).toEqual([1])
      expect(result.current.totalScore).toBe(150)
    })
  })

  describe('checkStageCompletion', () => {
    it('checks if stage is completed', () => {
      const { result } = renderHook(() => useStage())
      
      const score = 50
      const harvestedFruits: HarvestedFruits = {
        apple: 2,
        blueberry: 2,
        lemon: 1,
        watermelon: 1
      }
      
      let isCompleted = false
      act(() => {
        isCompleted = result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      // Stage 1 requires 100 score and 10 total fruits
      expect(isCompleted).toBe(false)
    })

    it('completes stage when requirements are met', () => {
      const { result } = renderHook(() => useStage())
      
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      let isCompleted = false
      act(() => {
        isCompleted = result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      expect(isCompleted).toBe(true)
      expect(result.current.completedStages).toContain(1)
      expect(result.current.currentStageInfo?.completed).toBe(true)
      expect(result.current.currentStageInfo?.highScore).toBeGreaterThanOrEqual(score)
    })

    it('unlocks next stage after completion', () => {
      const { result } = renderHook(() => useStage())
      
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      act(() => {
        result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      // Stage 2 should be unlocked
      const stage2 = result.current.allStages.find(s => s.number === 2)
      expect(stage2?.unlocked).toBe(true)
    })
  })

  describe('nextStage', () => {
    it('moves to next stage when available', () => {
      const { result } = renderHook(() => useStage())
      
      // まずステージ1を完了
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      act(() => {
        result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      let moved = false
      act(() => {
        moved = result.current.nextStage()
      })
      
      expect(moved).toBe(true)
      expect(result.current.currentStage).toBe(2)
      expect(result.current.currentStageInfo?.name).toBe('リンゴ園')
    })

    it('does not move if next stage is locked', () => {
      const { result } = renderHook(() => useStage())
      
      // ステージ1を完了していない状態
      let moved = false
      act(() => {
        moved = result.current.nextStage()
      })
      
      expect(moved).toBe(false)
      expect(result.current.currentStage).toBe(1)
    })
  })

  describe('selectStage', () => {
    it('selects an unlocked stage', () => {
      const { result } = renderHook(() => useStage())
      
      // ステージ1と2を完了
      act(() => {
        const score = 150
        const harvestedFruits: HarvestedFruits = {
          apple: 5,
          blueberry: 3,
          lemon: 2,
          watermelon: 2
        }
        result.current.checkStageCompletion(score, harvestedFruits)
        result.current.nextStage()
        
        // ステージ2も完了
        const score2 = 250
        const harvestedFruits2: HarvestedFruits = {
          apple: 12,
          blueberry: 5,
          lemon: 3,
          watermelon: 2
        }
        result.current.checkStageCompletion(score2, harvestedFruits2)
      })
      
      let selected = false
      act(() => {
        selected = result.current.selectStage(1)
      })
      
      expect(selected).toBe(true)
      expect(result.current.currentStage).toBe(1)
    })

    it('does not select a locked stage', () => {
      const { result } = renderHook(() => useStage())
      
      let selected = false
      act(() => {
        selected = result.current.selectStage(3)
      })
      
      expect(selected).toBe(false)
      expect(result.current.currentStage).toBe(1)
    })
  })

  describe('getAllStages', () => {
    it('returns all stages with their current state', () => {
      const { result } = renderHook(() => useStage())
      
      expect(result.current.allStages).toHaveLength(6)
      expect(result.current.allStages[0].unlocked).toBe(true)
      expect(result.current.allStages[1].unlocked).toBe(false)
      
      // ステージ1を完了
      act(() => {
        const score = 150
        const harvestedFruits: HarvestedFruits = {
          apple: 5,
          blueberry: 3,
          lemon: 2,
          watermelon: 2
        }
        result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      expect(result.current.allStages[0].completed).toBe(true)
      expect(result.current.allStages[1].unlocked).toBe(true)
    })
  })

  describe('reset', () => {
    it('resets all stage progress', () => {
      const { result } = renderHook(() => useStage())
      
      // いくつかのステージを完了
      act(() => {
        const score = 150
        const harvestedFruits: HarvestedFruits = {
          apple: 5,
          blueberry: 3,
          lemon: 2,
          watermelon: 2
        }
        result.current.checkStageCompletion(score, harvestedFruits)
        result.current.nextStage()
      })
      
      expect(result.current.currentStage).toBe(2)
      expect(result.current.completedStages.length).toBeGreaterThan(0)
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.currentStage).toBe(1)
      expect(result.current.completedStages).toEqual([])
      expect(result.current.totalScore).toBe(0)
      expect(result.current.currentStageInfo?.completed).toBe(false)
      expect(result.current.currentStageInfo?.highScore).toBe(0)
    })

    it('clears localStorage on reset', () => {
      const { result } = renderHook(() => useStage())
      
      // ステージを進める
      act(() => {
        const score = 150
        const harvestedFruits: HarvestedFruits = {
          apple: 5,
          blueberry: 3,
          lemon: 2,
          watermelon: 2
        }
        result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      expect(localStorage.getItem('stageProgress')).toBeTruthy()
      
      act(() => {
        result.current.reset()
      })
      
      expect(localStorage.getItem('stageProgress')).toBeNull()
    })
  })

  describe('stage persistence', () => {
    it('maintains progress across hook instances', () => {
      const { result: result1 } = renderHook(() => useStage())
      
      // 最初のインスタンスでステージを進める
      act(() => {
        const score = 150
        const harvestedFruits: HarvestedFruits = {
          apple: 5,
          blueberry: 3,
          lemon: 2,
          watermelon: 2
        }
        result1.current.checkStageCompletion(score, harvestedFruits)
        result1.current.nextStage()
      })
      
      // 新しいインスタンスを作成
      const { result: result2 } = renderHook(() => useStage())
      
      expect(result2.current.currentStage).toBe(2)
      expect(result2.current.completedStages).toContain(1)
      expect(result2.current.allStages[0].completed).toBe(true)
    })
  })
})