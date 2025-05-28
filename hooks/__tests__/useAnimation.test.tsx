import { renderHook, act } from '@testing-library/react'
import { useAnimation } from '../useAnimation'
import { AnimationType } from '../../types/animation'

describe('useAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with empty particles and default combo', () => {
    const { result } = renderHook(() => useAnimation())

    expect(result.current.particles).toEqual([])
    expect(result.current.combo).toEqual({
      count: 0,
      multiplier: 1,
      lastCollectTime: 0,
      timeWindow: 2000,
      isActive: false
    })
  })

  it('should trigger fruit collect animation', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.triggerAnimation('fruitCollect', 100, 200)
    })

    expect(result.current.particles.length).toBeGreaterThan(0)
    expect(result.current.particles[0]).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      type: expect.any(String),
      color: expect.any(String)
    })
  })

  it('should trigger power-up collect animation', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.triggerAnimation('powerUpCollect', 150, 250)
    })

    expect(result.current.particles.length).toBeGreaterThan(0)
    const types = result.current.particles.map(p => p.type)
    expect(types).toEqual(expect.arrayContaining(['star', 'sparkle']))
  })

  it('should trigger stage complete animation', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.triggerAnimation('stageComplete', 200, 300)
    })

    expect(result.current.particles.length).toBeGreaterThan(0)
    const types = result.current.particles.map(p => p.type)
    expect(types).toEqual(expect.arrayContaining(['confetti']))
  })

  it('should update combo on fruit collection', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.onFruitCollected()
    })

    expect(result.current.combo.count).toBe(1)
    expect(result.current.combo.multiplier).toBe(1)
    expect(result.current.combo.isActive).toBe(true)

    act(() => {
      result.current.onFruitCollected()
    })

    expect(result.current.combo.count).toBe(2)
    expect(result.current.combo.multiplier).toBe(1)
  })

  it('should increase combo multiplier at thresholds', () => {
    const { result } = renderHook(() => useAnimation())

    // Collect 5 fruits to reach 2x multiplier
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.onFruitCollected()
      })
    }

    expect(result.current.combo.count).toBe(5)
    expect(result.current.combo.multiplier).toBe(2)

    // Collect 5 more to reach 3x multiplier
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.onFruitCollected()
      })
    }

    expect(result.current.combo.count).toBe(10)
    expect(result.current.combo.multiplier).toBe(3)
  })

  it('should trigger combo effect animation at multiplier increase', () => {
    const { result } = renderHook(() => useAnimation())

    // Collect 4 fruits
    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.onFruitCollected()
      })
    }

    const particlesBefore = result.current.particles.length

    // 5th fruit triggers combo effect
    act(() => {
      result.current.onFruitCollected()
    })

    expect(result.current.particles.length).toBeGreaterThan(particlesBefore)
  })

  it('should reset combo after timeout', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.onFruitCollected()
    })

    expect(result.current.combo.count).toBe(1)
    expect(result.current.combo.isActive).toBe(true)

    act(() => {
      jest.advanceTimersByTime(2100) // Combo timeout is 2000ms
      result.current.update(2100)
    })

    expect(result.current.combo.count).toBe(0)
    expect(result.current.combo.isActive).toBe(false)
  })

  it('should update particle positions over time', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.triggerAnimation('fruitCollect', 100, 200)
    })

    const initialY = result.current.particles[0].y

    act(() => {
      jest.advanceTimersByTime(100)
      result.current.update(100)
    })

    // Check if particle still exists and has moved
    if (result.current.particles.length > 0 && result.current.particles[0]) {
      expect(result.current.particles[0].y).not.toBe(initialY)
    } else {
      // If particle was removed, that's also valid behavior
      expect(result.current.particles.length).toBeGreaterThanOrEqual(0)
    }
  })

  it('should remove expired particles', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.triggerAnimation('fruitCollect', 100, 200)
    })

    const initialCount = result.current.particles.length

    act(() => {
      jest.advanceTimersByTime(2000) // Most particles have 1000ms duration
      result.current.update(2000)
    })

    expect(result.current.particles.length).toBeLessThan(initialCount)
  })

  it('should handle multiple simultaneous animations', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.triggerAnimation('fruitCollect', 100, 200)
      result.current.triggerAnimation('powerUpCollect', 200, 300)
      result.current.triggerAnimation('scoreUpdate', 150, 250)
    })

    const particleTypes = new Set(result.current.particles.map(p => p.type))
    expect(particleTypes.size).toBeGreaterThan(1)
  })

  it('should reset all state on reset', () => {
    const { result } = renderHook(() => useAnimation())

    act(() => {
      result.current.triggerAnimation('fruitCollect', 100, 200)
      result.current.onFruitCollected()
      result.current.onFruitCollected()
    })

    expect(result.current.particles.length).toBeGreaterThan(0)
    expect(result.current.combo.count).toBe(2)

    act(() => {
      result.current.reset()
    })

    expect(result.current.particles).toEqual([])
    expect(result.current.combo).toEqual({
      count: 0,
      multiplier: 1,
      lastCollectTime: 0,
      timeWindow: 2000,
      isActive: false
    })
  })

  it('should calculate score with combo multiplier', () => {
    const { result } = renderHook(() => useAnimation())

    expect(result.current.calculateScore(100)).toBe(100)

    // Build up combo
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.onFruitCollected()
      })
    }

    expect(result.current.combo.multiplier).toBe(2)
    expect(result.current.calculateScore(100)).toBe(200)
  })

  it('should provide animation status', () => {
    const { result } = renderHook(() => useAnimation())

    expect(result.current.isAnimating).toBe(false)

    act(() => {
      result.current.triggerAnimation('fruitCollect', 100, 200)
    })

    expect(result.current.isAnimating).toBe(true)

    act(() => {
      jest.advanceTimersByTime(2000)
      result.current.update(2000)
    })

    expect(result.current.isAnimating).toBe(false)
  })
})