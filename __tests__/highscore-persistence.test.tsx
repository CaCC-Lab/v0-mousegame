import { renderHook, act, waitFor } from '@testing-library/react'
import { useGameLogic } from '../hooks/useGameLogic'

describe('High Score Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear()
    jest.clearAllMocks()
    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0))
    global.cancelAnimationFrame = jest.fn()
  })

  afterEach(() => {
    window.localStorage.clear()
    jest.useRealTimers()
  })

  test('should initialize high score from localStorage', () => {
    // Set a high score in localStorage
    window.localStorage.setItem('fruitHarvestHighScore', '1000')
    
    const { result } = renderHook(() => useGameLogic())
    
    expect(result.current.highScore).toBe(1000)
  })

  test('should initialize high score to 0 if not in localStorage', () => {
    const { result } = renderHook(() => useGameLogic())
    
    expect(result.current.highScore).toBe(0)
  })

  test('should update high score when game ends with higher score', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useGameLogic())
    
    // Start game
    act(() => {
      result.current.startGame()
    })
    
    // Find an apple fruit and click it (apple requires click interaction)
    let scored = false
    for (const fruit of result.current.fruits) {
      if (fruit.type === 'apple') {
        act(() => {
          result.current.handleFruitInteraction(fruit, 'click')
        })
        scored = true
        break
      } else if (fruit.type === 'blueberry') {
        act(() => {
          result.current.handleFruitInteraction(fruit, 'doubleClick')
        })
        scored = true
        break
      } else if (fruit.type === 'lemon') {
        act(() => {
          result.current.handleFruitInteraction(fruit, 'rightClick')
        })
        scored = true
        break
      }
    }
    
    // If we scored, wait for score update
    if (scored) {
      await waitFor(() => {
        expect(result.current.score).toBeGreaterThan(0)
      })
    }
    
    const currentScore = result.current.score
    
    // Manually set time to 0 to end game
    act(() => {
      // Advance time by the game duration
      jest.advanceTimersByTime(180000) // 3 minutes
    })
    
    // The game should have ended
    expect(result.current.timeLeft).toBe(0)
    expect(result.current.gameState).toBe('idle')
    
    if (currentScore > 0) {
      expect(result.current.highScore).toBe(currentScore)
      // Verify it's persisted to localStorage
      expect(window.localStorage.getItem('fruitHarvestHighScore')).toBe(String(currentScore))
    }
  })

  test('should not update high score if current score is lower', () => {
    jest.useFakeTimers()
    // Set existing high score
    window.localStorage.setItem('fruitHarvestHighScore', '1000')
    
    const { result } = renderHook(() => useGameLogic())
    
    expect(result.current.highScore).toBe(1000)
    
    // Start game
    act(() => {
      result.current.startGame()
    })
    
    // Don't score any points
    expect(result.current.score).toBe(0)
    
    // Fast forward to end of game
    act(() => {
      jest.advanceTimersByTime(180000) // 3 minutes
    })
    
    // Game should have ended
    expect(result.current.timeLeft).toBe(0)
    expect(result.current.gameState).toBe('idle')
    expect(result.current.highScore).toBe(1000) // Should remain unchanged
    
    // Verify localStorage still has the old high score
    expect(window.localStorage.getItem('fruitHarvestHighScore')).toBe('1000')
  })

  test('should persist high score across multiple games', async () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useGameLogic())
    
    // Play first game
    act(() => {
      result.current.startGame()
    })
    
    // Score some points with correct interaction
    let scored = false
    for (const fruit of result.current.fruits) {
      if (fruit.type === 'apple') {
        act(() => {
          result.current.handleFruitInteraction(fruit, 'click')
        })
        scored = true
        break
      }
    }
    
    if (scored) {
      await waitFor(() => {
        expect(result.current.score).toBeGreaterThan(0)
      })
    }
    
    const firstGameScore = result.current.score
    
    // End first game
    act(() => {
      jest.advanceTimersByTime(180000) // 3 minutes
    })
    
    // Game should have ended
    expect(result.current.timeLeft).toBe(0)
    expect(result.current.gameState).toBe('idle')
    
    if (firstGameScore > 0) {
      expect(result.current.highScore).toBe(firstGameScore)
    }
    
    // Start second game
    act(() => {
      result.current.startGame()
    })
    
    // Verify high score persists
    if (firstGameScore > 0) {
      expect(result.current.highScore).toBe(firstGameScore)
    }
    expect(result.current.score).toBe(0) // New game should reset current score
  })

  test('should sync high score across multiple hook instances', () => {
    const { result: result1 } = renderHook(() => useGameLogic())
    const { result: result2 } = renderHook(() => useGameLogic())
    
    // Both should start with 0
    expect(result1.current.highScore).toBe(0)
    expect(result2.current.highScore).toBe(0)
    
    // Update high score in localStorage (simulating another tab/window)
    act(() => {
      window.localStorage.setItem('fruitHarvestHighScore', '500')
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'fruitHarvestHighScore',
        newValue: '500',
        storageArea: window.localStorage,
      }))
    })
    
    // Both hooks should reflect the updated high score
    expect(result1.current.highScore).toBe(500)
    expect(result2.current.highScore).toBe(500)
  })

  test('should handle corrupted localStorage data gracefully', () => {
    // Mock console.warn to suppress expected warning
    const originalWarn = console.warn
    console.warn = jest.fn()
    
    // Set invalid data in localStorage
    window.localStorage.setItem('fruitHarvestHighScore', 'invalid-number')
    
    const { result } = renderHook(() => useGameLogic())
    
    // Should default to 0
    expect(result.current.highScore).toBe(0)
    
    // Verify warning was called
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Error parsing localStorage key'),
      expect.any(Error)
    )
    
    // Restore original console.warn
    console.warn = originalWarn
  })

  test('should persist hard mode setting', () => {
    const { result } = renderHook(() => useGameLogic())
    
    // Initially false
    expect(result.current.isHardMode).toBe(false)
    
    // Set to hard mode
    act(() => {
      result.current.setIsHardMode(true)
    })
    
    expect(result.current.isHardMode).toBe(true)
    expect(window.localStorage.getItem('fruitHarvestHardMode')).toBe('true')
  })

  test('should restore hard mode setting from localStorage', () => {
    // Set hard mode in localStorage
    window.localStorage.setItem('fruitHarvestHardMode', 'true')
    
    const { result } = renderHook(() => useGameLogic())
    
    expect(result.current.isHardMode).toBe(true)
  })
})