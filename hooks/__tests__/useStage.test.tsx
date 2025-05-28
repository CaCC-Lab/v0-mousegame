import { renderHook, act } from '@testing-library/react'
import { useStage } from '../useStage'
import { StageManager } from '../../lib/stageManager'
import { HarvestedFruits } from '../../types/game'

// Mock StageManager
jest.mock('../../lib/stageManager')
const MockedStageManager = StageManager as jest.MockedClass<typeof StageManager>

describe('useStage', () => {
  let mockManager: jest.Mocked<StageManager>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockManager = {
      getCurrentStage: jest.fn().mockReturnValue(1),
      getStageInfo: jest.fn().mockReturnValue({
        number: 1,
        name: 'フルーツ畑',
        description: 'フルーツ収穫の基本を学びましょう',
        targetScore: 100,
        targetFruits: { total: 10 },
        timeLimit: 60,
        unlocked: true,
        completed: false,
        highScore: 0,
        difficulty: {
          fruitCount: 8,
          fruitSpeed: 1.0,
          powerUpSpawnRate: 0.1
        }
      }),
      getCompletedStages: jest.fn().mockReturnValue([]),
      isStageCompleted: jest.fn().mockReturnValue(false),
      completeStage: jest.fn(),
      moveToNextStage: jest.fn().mockReturnValue(true),
      selectStage: jest.fn().mockReturnValue(true),
      getTotalScore: jest.fn().mockReturnValue(0),
      getAllStages: jest.fn().mockReturnValue([]),
      reset: jest.fn()
    } as any

    MockedStageManager.mockImplementation(() => mockManager)
  })

  describe('initialization', () => {
    it('should initialize with stage manager', () => {
      const { result } = renderHook(() => useStage())
      
      expect(result.current.currentStage).toBe(1)
      expect(result.current.currentStageInfo).toBeDefined()
      expect(result.current.currentStageInfo?.name).toBe('フルーツ畑')
    })

    it('should create StageManager instance', () => {
      renderHook(() => useStage())
      
      expect(MockedStageManager).toHaveBeenCalledTimes(1)
    })
  })

  describe('checkStageCompletion', () => {
    it('should check if stage is completed', () => {
      const { result } = renderHook(() => useStage())
      
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      let isCompleted
      act(() => {
        isCompleted = result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      expect(mockManager.isStageCompleted).toHaveBeenCalledWith(1, score, harvestedFruits)
      expect(isCompleted).toBe(false)
    })

    it('should complete stage when requirements are met', () => {
      mockManager.isStageCompleted.mockReturnValue(true)
      
      const { result } = renderHook(() => useStage())
      
      const score = 150
      const harvestedFruits: HarvestedFruits = {
        apple: 5,
        blueberry: 3,
        lemon: 2,
        watermelon: 2
      }
      
      let isCompleted
      act(() => {
        isCompleted = result.current.checkStageCompletion(score, harvestedFruits)
      })
      
      expect(mockManager.completeStage).toHaveBeenCalledWith(1, score)
      expect(isCompleted).toBe(true)
    })
  })

  describe('nextStage', () => {
    it('should move to next stage', () => {
      const { result } = renderHook(() => useStage())
      
      let moved
      act(() => {
        moved = result.current.nextStage()
      })
      
      expect(mockManager.moveToNextStage).toHaveBeenCalled()
      expect(moved).toBe(true)
    })

    it('should update current stage info after moving', () => {
      mockManager.getCurrentStage.mockReturnValue(2)
      mockManager.getStageInfo.mockReturnValue({
        number: 2,
        name: 'リンゴ園',
        description: 'リンゴを中心に収穫しましょう',
        targetScore: 200,
        targetFruits: { apple: 10, total: 20 },
        timeLimit: 90,
        unlocked: true,
        completed: false,
        highScore: 0,
        difficulty: {
          fruitCount: 10,
          fruitSpeed: 1.2,
          powerUpSpawnRate: 0.15
        }
      })
      
      const { result } = renderHook(() => useStage())
      
      act(() => {
        result.current.nextStage()
      })
      
      expect(result.current.currentStage).toBe(2)
      expect(result.current.currentStageInfo?.name).toBe('リンゴ園')
    })
  })

  describe('selectStage', () => {
    it('should select a specific stage', () => {
      const { result } = renderHook(() => useStage())
      
      let selected
      act(() => {
        selected = result.current.selectStage(3)
      })
      
      expect(mockManager.selectStage).toHaveBeenCalledWith(3)
      expect(selected).toBe(true)
    })

    it('should update current stage info after selecting', () => {
      mockManager.getCurrentStage.mockReturnValue(3)
      mockManager.getStageInfo.mockReturnValue({
        number: 3,
        name: 'ブルーベリー農園',
        description: 'ブルーベリーのダブルクリックに挑戦',
        targetScore: 300,
        targetFruits: { blueberry: 15, total: 30 },
        timeLimit: 90,
        unlocked: true,
        completed: false,
        highScore: 0,
        difficulty: {
          fruitCount: 10,
          fruitSpeed: 1.3,
          powerUpSpawnRate: 0.2
        }
      })
      
      const { result } = renderHook(() => useStage())
      
      act(() => {
        result.current.selectStage(3)
      })
      
      expect(result.current.currentStage).toBe(3)
      expect(result.current.currentStageInfo?.name).toBe('ブルーベリー農園')
    })
  })

  describe('getAllStages', () => {
    it('should return all stages', () => {
      const allStages = [
        { number: 1, name: 'Stage 1', unlocked: true, completed: true },
        { number: 2, name: 'Stage 2', unlocked: true, completed: false },
        { number: 3, name: 'Stage 3', unlocked: false, completed: false }
      ]
      mockManager.getAllStages.mockReturnValue(allStages as any)
      
      const { result } = renderHook(() => useStage())
      
      expect(result.current.allStages).toEqual(allStages)
    })
  })

  describe('reset', () => {
    it('should reset stage progress', () => {
      const { result } = renderHook(() => useStage())
      
      act(() => {
        result.current.reset()
      })
      
      expect(mockManager.reset).toHaveBeenCalled()
    })

    it('should update state after reset', () => {
      mockManager.getCurrentStage.mockReturnValue(1)
      mockManager.getCompletedStages.mockReturnValue([])
      mockManager.getTotalScore.mockReturnValue(0)
      
      const { result } = renderHook(() => useStage())
      
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.currentStage).toBe(1)
      expect(result.current.completedStages).toEqual([])
      expect(result.current.totalScore).toBe(0)
    })
  })
})