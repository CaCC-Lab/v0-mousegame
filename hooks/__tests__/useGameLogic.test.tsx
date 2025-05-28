import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'

// Mock the useLocalStorage hook
jest.mock('../useLocalStorage', () => ({
  useLocalStorage: jest.fn((key, initialValue) => {
    const [value, setValue] = jest.requireActual('react').useState(initialValue)
    return [value, setValue]
  })
}))

// Mock the useSoundEffects hook
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
  })
}))

describe('useGameLogic', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGameLogic())

    expect(result.current.gameState).toBe('idle')
    expect(result.current.score).toBe(0)
    expect(result.current.timeLeft).toBe(180)
    expect(result.current.fruits).toHaveLength(0)
    expect(result.current.harvestedFruits).toEqual({
      apple: 0,
      blueberry: 0,
      lemon: 0,
      watermelon: 0,
    })
  })

  it('should start game when startGame is called', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')
    expect(result.current.score).toBe(0)
    expect(result.current.timeLeft).toBe(180)
    expect(result.current.fruits).toHaveLength(10)
  })

  it('should pause and resume game', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')

    act(() => {
      result.current.pauseGame()
    })

    expect(result.current.gameState).toBe('paused')

    act(() => {
      result.current.pauseGame()
    })

    expect(result.current.gameState).toBe('playing')
  })

  it('should reset game state', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      result.current.resetGame()
    })

    expect(result.current.gameState).toBe('idle')
    expect(result.current.score).toBe(0)
    expect(result.current.timeLeft).toBe(180)
    expect(result.current.fruits).toHaveLength(0)
  })

  it('should handle fruit interaction correctly', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    const appleFruit = result.current.fruits.find(f => f.type === 'apple')
    if (appleFruit) {
      act(() => {
        result.current.handleFruitInteraction(appleFruit, 'click')
      })

      expect(result.current.score).toBe(10)
      expect(result.current.harvestedFruits.apple).toBe(1)
      expect(result.current.fruits).toHaveLength(10) // New fruit generated
    }
  })

  it('should decrease time when game is playing', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.timeLeft).toBe(179)
  })

  it('should end game when time runs out', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      jest.advanceTimersByTime(180000) // 180 seconds
    })

    expect(result.current.gameState).toBe('idle')
    expect(result.current.timeLeft).toBe(0)
  })

  it('should update high score when game ends with higher score', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // Simulate getting some score
    const appleFruit = result.current.fruits.find(f => f.type === 'apple')
    expect(appleFruit).toBeDefined()
    
    act(() => {
      result.current.handleFruitInteraction(appleFruit!, 'click')
    })
    
    expect(result.current.score).toBe(10) // Apple gives 10 points

    // Advance time to end the game
    for (let i = 0; i < 180; i++) {
      act(() => {
        jest.advanceTimersByTime(1000)
      })
    }

    // One more tick to trigger game end
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.gameState).toBe('idle')
    expect(result.current.highScore).toBe(10)
  })

  it('should move fruits when hard mode is enabled', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.setIsHardMode(true)
      result.current.startGame()
    })

    const initialPositions = result.current.fruits.map(f => ({ x: f.x, y: f.y }))

    act(() => {
      jest.advanceTimersByTime(100)
    })

    const newPositions = result.current.fruits.map(f => ({ x: f.x, y: f.y }))
    
    // At least some fruits should have moved
    const hasMoved = newPositions.some((pos, index) => 
      pos.x !== initialPositions[index].x || pos.y !== initialPositions[index].y
    )
    
    expect(hasMoved).toBe(true)
  })
})