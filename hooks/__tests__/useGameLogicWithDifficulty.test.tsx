import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'

// Mock the dependencies
jest.mock('../useLocalStorage', () => ({
  useLocalStorage: jest.fn((key, initialValue) => {
    const [value, setValue] = jest.requireActual('react').useState(initialValue)
    return [value, setValue]
  }),
}))

jest.mock('../useSoundEffects', () => ({
  useSoundEffects: () => ({
    playCollectSound: jest.fn(),
    playGameStartSound: jest.fn(),
    playGameOverSound: jest.fn(),
    playHighScoreSound: jest.fn(),
    toggleSound: jest.fn(),
    setVolume: jest.fn(),
    soundEnabled: true,
    volume: 0.5,
  }),
}))

// Mock the difficulty hook
const mockDifficultyHook = {
  currentDifficulty: 'normal' as const,
  currentConfig: {
    fruitCount: 10,
    gameSpeed: 1.0,
    timeLimitMultiplier: 1.0,
    fruitSpeedMultiplier: 1.0,
    scoreMultiplier: 1.0,
    description: 'バランスの取れた標準的な難易度です',
  },
  getAdjustedGameTime: jest.fn((time: number) => time),
  getAdjustedScore: jest.fn((score: number) => score),
  setDifficulty: jest.fn(),
  availableDifficulties: ['easy', 'normal', 'hard'] as const,
  difficultyDescriptions: {
    easy: 'フルーツが少なく、時間に余裕があります',
    normal: 'バランスの取れた標準的な難易度です',
    hard: 'フルーツが多く、時間制限が厳しくなります',
  },
}

jest.mock('../useDifficulty', () => ({
  useDifficulty: () => mockDifficultyHook,
}))

describe('useGameLogic with Difficulty Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    
    // Reset mock values to defaults
    mockDifficultyHook.currentDifficulty = 'normal'
    mockDifficultyHook.currentConfig = {
      fruitCount: 10,
      gameSpeed: 1.0,
      timeLimitMultiplier: 1.0,
      fruitSpeedMultiplier: 1.0,
      scoreMultiplier: 1.0,
      description: 'バランスの取れた標準的な難易度です',
    }
    mockDifficultyHook.getAdjustedGameTime.mockImplementation((time: number) => time)
    mockDifficultyHook.getAdjustedScore.mockImplementation((score: number) => score)
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  describe('Difficulty-Based Game Configuration', () => {
    it('should use difficulty-based fruit count', () => {
      mockDifficultyHook.currentConfig.fruitCount = 8 // Easy mode
      
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.startGame()
      })
      
      expect(result.current.fruits).toHaveLength(8)
    })

    it('should adjust game time based on difficulty', () => {
      mockDifficultyHook.getAdjustedGameTime.mockReturnValue(270) // Easy mode: 180 * 1.5
      
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.startGame()
      })
      
      expect(mockDifficultyHook.getAdjustedGameTime).toHaveBeenCalledWith(180)
      expect(result.current.timeLeft).toBe(270)
    })

    it('should adjust scores based on difficulty multiplier', () => {
      mockDifficultyHook.getAdjustedScore.mockImplementation((score: number) => score * 1.2) // Hard mode
      
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.startGame()
      })
      
      // Simulate fruit collection
      const appleFruit = result.current.fruits.find(f => f.type === 'apple')
      if (appleFruit) {
        act(() => {
          result.current.handleFruitInteraction(appleFruit, 'click')
        })
      }
      
      expect(mockDifficultyHook.getAdjustedScore).toHaveBeenCalledWith(10) // Apple base score
    })
  })

  describe('Easy Difficulty', () => {
    beforeEach(() => {
      mockDifficultyHook.currentDifficulty = 'easy'
      mockDifficultyHook.currentConfig = {
        fruitCount: 8,
        gameSpeed: 0.8,
        timeLimitMultiplier: 1.5,
        fruitSpeedMultiplier: 0.5,
        scoreMultiplier: 0.8,
        description: 'フルーツが少なく、時間に余裕があります',
      }
      mockDifficultyHook.getAdjustedGameTime.mockReturnValue(270) // 180 * 1.5
      mockDifficultyHook.getAdjustedScore.mockImplementation((score: number) => Math.round(score * 0.8))
    })

    it('should have fewer fruits and longer time in easy mode', () => {
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.startGame()
      })
      
      expect(result.current.fruits).toHaveLength(8)
      expect(result.current.timeLeft).toBe(270)
    })

    it('should apply score reduction in easy mode', () => {
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.startGame()
      })
      
      const appleFruit = result.current.fruits.find(f => f.type === 'apple')
      if (appleFruit) {
        act(() => {
          result.current.handleFruitInteraction(appleFruit, 'click')
        })
      }
      
      expect(mockDifficultyHook.getAdjustedScore).toHaveBeenCalledWith(10)
      expect(result.current.score).toBe(8) // 10 * 0.8
    })
  })

  describe('Hard Difficulty', () => {
    beforeEach(() => {
      mockDifficultyHook.currentDifficulty = 'hard'
      mockDifficultyHook.currentConfig = {
        fruitCount: 12,
        gameSpeed: 1.3,
        timeLimitMultiplier: 0.8,
        fruitSpeedMultiplier: 1.5,
        scoreMultiplier: 1.2,
        description: 'フルーツが多く、時間制限が厳しくなります',
      }
      mockDifficultyHook.getAdjustedGameTime.mockReturnValue(144) // 180 * 0.8
      mockDifficultyHook.getAdjustedScore.mockImplementation((score: number) => Math.round(score * 1.2))
    })

    it('should have more fruits and shorter time in hard mode', () => {
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.startGame()
      })
      
      expect(result.current.fruits).toHaveLength(12)
      expect(result.current.timeLeft).toBe(144)
    })

    it('should apply score bonus in hard mode', () => {
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.startGame()
      })
      
      const appleFruit = result.current.fruits.find(f => f.type === 'apple')
      if (appleFruit) {
        act(() => {
          result.current.handleFruitInteraction(appleFruit, 'click')
        })
      }
      
      expect(mockDifficultyHook.getAdjustedScore).toHaveBeenCalledWith(10)
      expect(result.current.score).toBe(12) // 10 * 1.2
    })
  })

  describe('Difficulty Hook Integration', () => {
    it('should expose difficulty settings through game logic', () => {
      const { result } = renderHook(() => useGameLogic())
      
      expect(result.current.difficulty).toBeDefined()
      expect(result.current.difficulty.currentDifficulty).toBe('normal')
      expect(result.current.difficulty.setDifficulty).toBe(mockDifficultyHook.setDifficulty)
    })

    it('should allow changing difficulty through game logic', () => {
      const { result } = renderHook(() => useGameLogic())
      
      act(() => {
        result.current.difficulty.setDifficulty('hard')
      })
      
      expect(mockDifficultyHook.setDifficulty).toHaveBeenCalledWith('hard')
    })

    it('should reflect difficulty changes in game configuration', () => {
      const { result } = renderHook(() => useGameLogic())
      
      // Simulate difficulty change to hard
      mockDifficultyHook.currentDifficulty = 'hard'
      mockDifficultyHook.currentConfig.fruitCount = 12
      
      act(() => {
        result.current.startGame()
      })
      
      expect(result.current.fruits).toHaveLength(12)
    })
  })
})