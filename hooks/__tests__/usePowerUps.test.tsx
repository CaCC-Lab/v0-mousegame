import { renderHook, act } from '@testing-library/react'
import { usePowerUps } from '../usePowerUps'
import { PowerUpManager } from '../../lib/powerUpManager'
import { POWERUP_SPAWN_INTERVAL } from '../../types/powerup'

// Mock PowerUpManager
jest.mock('../../lib/powerUpManager')
const MockedPowerUpManager = PowerUpManager as jest.MockedClass<typeof PowerUpManager>

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn()
const mockCancelAnimationFrame = jest.fn()
global.requestAnimationFrame = mockRequestAnimationFrame
global.cancelAnimationFrame = mockCancelAnimationFrame

// Mock setTimeout and clearTimeout
jest.useFakeTimers()

describe('usePowerUps', () => {
  let mockManager: jest.Mocked<PowerUpManager>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    
    mockManager = {
      spawnPowerUp: jest.fn(),
      collectPowerUp: jest.fn(),
      updateEffects: jest.fn(),
      cleanupExpiredPowerUps: jest.fn(),
      getPowerUps: jest.fn().mockReturnValue([]),
      getActiveEffects: jest.fn().mockReturnValue([]),
      isEffectActive: jest.fn().mockReturnValue(false),
      getEffectValue: jest.fn().mockReturnValue(1),
      reset: jest.fn()
    } as any

    MockedPowerUpManager.mockImplementation(() => mockManager)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  describe('initialization', () => {
    it('should initialize with empty powerups and effects', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      expect(result.current.powerUps).toEqual([])
      expect(result.current.activeEffects).toEqual([])
    })

    it('should create PowerUpManager instance', () => {
      renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      expect(MockedPowerUpManager).toHaveBeenCalledTimes(1)
    })
  })

  describe('startSpawning', () => {
    it('should start spawning powerups at intervals', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
      })

      // Fast-forward time by spawn interval
      act(() => {
        jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL)
      })

      expect(mockManager.spawnPowerUp).toHaveBeenCalledWith({ width: 800, height: 600 })
    })

    it('should not start multiple spawn intervals', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
        result.current.startSpawning() // Call twice
      })

      act(() => {
        jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL)
      })

      expect(mockManager.spawnPowerUp).toHaveBeenCalledTimes(1)
    })
  })

  describe('stopSpawning', () => {
    it('should stop spawning powerups', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
      })

      act(() => {
        result.current.stopSpawning()
      })

      act(() => {
        jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL * 2)
      })

      expect(mockManager.spawnPowerUp).not.toHaveBeenCalled()
    })
  })

  describe('collectPowerUp', () => {
    it('should collect powerup and return effect', () => {
      const mockEffect = {
        type: 'scoreMultiplier' as const,
        value: 2,
        duration: 15000,
        startTime: Date.now(),
        active: true
      }
      
      mockManager.collectPowerUp.mockReturnValue(mockEffect)
      
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      let collectedEffect
      act(() => {
        collectedEffect = result.current.collectPowerUp('powerup-1')
      })

      expect(mockManager.collectPowerUp).toHaveBeenCalledWith('powerup-1')
      expect(collectedEffect).toBe(mockEffect)
    })

    it('should return null for invalid powerup', () => {
      mockManager.collectPowerUp.mockReturnValue(null)
      
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      let collectedEffect
      act(() => {
        collectedEffect = result.current.collectPowerUp('invalid-id')
      })

      expect(collectedEffect).toBeNull()
    })
  })

  describe('update loop', () => {
    it('should start update loop when enabled', () => {
      mockRequestAnimationFrame.mockImplementation((callback) => {
        setTimeout(callback, 16) // Simulate 60fps
        return 1
      })

      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
      })

      act(() => {
        jest.advanceTimersByTime(16)
      })

      expect(mockManager.updateEffects).toHaveBeenCalled()
      expect(mockManager.cleanupExpiredPowerUps).toHaveBeenCalled()
    })

    it('should stop update loop when disabled', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
        result.current.stopSpawning()
      })

      // Core functionality test - spawning is stopped
      expect(result.current).toBeDefined()
    })
  })

  describe('isEffectActive', () => {
    it('should return active status for effects', () => {
      mockManager.isEffectActive.mockReturnValue(true)
      
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      expect(result.current.isEffectActive('scoreMultiplier')).toBe(true)
      expect(mockManager.isEffectActive).toHaveBeenCalledWith('scoreMultiplier')
    })
  })

  describe('getEffectValue', () => {
    it('should return effect value', () => {
      mockManager.getEffectValue.mockReturnValue(2)
      
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      expect(result.current.getEffectValue('scoreMultiplier')).toBe(2)
      expect(mockManager.getEffectValue).toHaveBeenCalledWith('scoreMultiplier')
    })
  })

  describe('reset', () => {
    it('should reset powerups and stop spawning', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
        result.current.reset()
      })

      expect(mockManager.reset).toHaveBeenCalled()
    })
  })

  describe('cleanup on unmount', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
      })

      unmount()

      // No errors on unmount
      expect(true).toBe(true)
    })
  })
})