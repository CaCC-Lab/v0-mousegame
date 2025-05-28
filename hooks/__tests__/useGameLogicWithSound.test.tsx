import { renderHook, act } from '@testing-library/react'

// Mock dependencies before imports
const mockSoundEffects = {
  playCollectSound: jest.fn(),
  playGameStartSound: jest.fn(),
  playGameOverSound: jest.fn(),
  playHighScoreSound: jest.fn(),
  toggleSound: jest.fn(),
  setVolume: jest.fn(),
  soundEnabled: true,
  volume: 0.5,
}

jest.mock('../useSoundEffects', () => ({
  useSoundEffects: () => mockSoundEffects
}))

jest.mock('../useLocalStorage', () => ({
  useLocalStorage: jest.fn((key, initialValue) => {
    const [value, setValue] = jest.requireActual('react').useState(initialValue)
    return [value, setValue]
  })
}))

jest.mock('../../lib/gameLogic', () => ({
  generateFruit: jest.fn(() => ({
    id: Math.random().toString(),
    type: 'apple',
    x: 50,
    y: 50,
    radius: 20,
    vx: 0,
    vy: 0,
  })),
  generateFruits: jest.fn((count: number) => 
    Array.from({ length: count }, (_, i) => ({
      id: i.toString(),
      type: 'apple',
      x: 50 + i * 10,
      y: 50,
      radius: 20,
      vx: 0,
      vy: 0,
    }))
  ),
  calculateScore: jest.fn(() => 10),
  updateFruitPosition: jest.fn((fruit) => fruit),
  isValidHarvestAction: jest.fn(() => true),
}))

import { useGameLogic } from '../useGameLogic'

describe('useGameLogic with Sound Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should play game start sound when starting game', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    expect(mockSoundEffects.playGameStartSound).toHaveBeenCalled()
  })

  it('should play collect sound when harvesting fruit', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // Ensure we have fruits
    expect(result.current.fruits.length).toBeGreaterThan(0)
    
    const fruit = result.current.fruits[0]
    act(() => {
      result.current.handleFruitInteraction(fruit, 'click')
    })

    expect(mockSoundEffects.playCollectSound).toHaveBeenCalled()
  })

  it('should play game over sound when time runs out', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')
    expect(result.current.timeLeft).toBe(180)

    // Advance time by intervals to trigger setInterval callbacks
    for (let i = 0; i < 180; i++) {
      act(() => {
        jest.advanceTimersByTime(1000)
      })
    }

    // One more tick to trigger the game over logic
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.timeLeft).toBe(0)
    expect(result.current.gameState).toBe('idle')
    expect(mockSoundEffects.playGameOverSound).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('should play high score sound when achieving new high score', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useGameLogic())

    // Start game
    act(() => {
      result.current.startGame()
    })

    // Collect fruits to get score
    act(() => {
      for (let i = 0; i < 10; i++) {
        const fruit = result.current.fruits[0]
        result.current.handleFruitInteraction(fruit, 'click')
      }
    })

    expect(result.current.score).toBeGreaterThan(0)

    // Advance time to end the game
    for (let i = 0; i < 180; i++) {
      act(() => {
        jest.advanceTimersByTime(1000)
      })
    }

    // One more tick to trigger the game over logic
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.timeLeft).toBe(0)
    expect(result.current.gameState).toBe('idle')
    expect(mockSoundEffects.playGameOverSound).toHaveBeenCalled()
    expect(mockSoundEffects.playHighScoreSound).toHaveBeenCalled()
    jest.useRealTimers()
  })
})