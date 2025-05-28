import { PowerUpManager } from '../powerUpManager'
import { PowerUpType, POWERUP_CONFIGS } from '../../types/powerup'

// Mock Math.random for predictable tests
const originalRandom = Math.random
const mockRandom = jest.fn()

beforeEach(() => {
  Math.random = mockRandom
  jest.clearAllMocks()
})

afterEach(() => {
  Math.random = originalRandom
})

describe('PowerUpManager', () => {
  let manager: PowerUpManager

  beforeEach(() => {
    manager = new PowerUpManager()
  })

  describe('constructor', () => {
    it('should initialize with empty powerups and effects', () => {
      expect(manager.getPowerUps()).toEqual([])
      expect(manager.getActiveEffects()).toEqual([])
    })
  })

  describe('spawnPowerUp', () => {
    it('should spawn a powerup with correct properties', () => {
      mockRandom.mockReturnValue(0.1) // timeExtension
      
      const gameArea = { width: 800, height: 600 }
      const powerUp = manager.spawnPowerUp(gameArea)
      
      expect(powerUp).toBeDefined()
      expect(powerUp?.type).toBe('timeExtension')
      expect(powerUp?.active).toBe(true)
      expect(powerUp?.x).toBeGreaterThanOrEqual(0)
      expect(powerUp?.x).toBeLessThanOrEqual(gameArea.width - POWERUP_CONFIGS.timeExtension.size.width)
      expect(powerUp?.y).toBeGreaterThanOrEqual(0)
      expect(powerUp?.y).toBeLessThanOrEqual(gameArea.height - POWERUP_CONFIGS.timeExtension.size.height)
    })

    it('should not spawn powerup if random chance is too high', () => {
      mockRandom.mockReturnValue(0.9) // Higher than any spawn chance
      
      const gameArea = { width: 800, height: 600 }
      const powerUp = manager.spawnPowerUp(gameArea)
      
      expect(powerUp).toBeNull()
    })

    it('should add spawned powerup to powerups list', () => {
      mockRandom.mockReturnValue(0.1) // timeExtension
      
      const gameArea = { width: 800, height: 600 }
      manager.spawnPowerUp(gameArea)
      
      expect(manager.getPowerUps()).toHaveLength(1)
      expect(manager.getPowerUps()[0].type).toBe('timeExtension')
    })
  })

  describe('collectPowerUp', () => {
    it('should collect powerup and create effect', () => {
      mockRandom.mockReturnValue(0.2) // scoreMultiplier (cumulative: 0.15 + 0.12 = 0.27)
      
      const gameArea = { width: 800, height: 600 }
      const powerUp = manager.spawnPowerUp(gameArea)!
      
      const effect = manager.collectPowerUp(powerUp.id)
      
      expect(effect).toBeDefined()
      expect(effect?.type).toBe('scoreMultiplier')
      expect(effect?.value).toBe(2)
      expect(effect?.duration).toBe(15000)
      expect(effect?.active).toBe(true)
    })

    it('should mark powerup as inactive after collection', () => {
      mockRandom.mockReturnValue(0.2) // scoreMultiplier
      
      const gameArea = { width: 800, height: 600 }
      const powerUp = manager.spawnPowerUp(gameArea)!
      
      manager.collectPowerUp(powerUp.id)
      
      const powerUps = manager.getPowerUps()
      expect(powerUps[0].active).toBe(false)
    })

    it('should return null for non-existent powerup', () => {
      const effect = manager.collectPowerUp('non-existent')
      expect(effect).toBeNull()
    })

    it('should add effect to active effects list', () => {
      mockRandom.mockReturnValue(0.2) // scoreMultiplier
      
      const gameArea = { width: 800, height: 600 }
      const powerUp = manager.spawnPowerUp(gameArea)!
      
      manager.collectPowerUp(powerUp.id)
      
      expect(manager.getActiveEffects()).toHaveLength(1)
      expect(manager.getActiveEffects()[0].type).toBe('scoreMultiplier')
    })
  })

  describe('updateEffects', () => {
    it('should remove expired effects', () => {
      // Create a mock effect that's already expired
      const expiredEffect = {
        type: 'scoreMultiplier' as PowerUpType,
        value: 2,
        duration: 1000,
        startTime: Date.now() - 2000, // Started 2 seconds ago
        active: true
      }
      
      manager['activeEffects'] = [expiredEffect]
      
      manager.updateEffects()
      
      expect(manager.getActiveEffects()).toHaveLength(0)
    })

    it('should keep active effects', () => {
      const activeEffect = {
        type: 'scoreMultiplier' as PowerUpType,
        value: 2,
        duration: 10000,
        startTime: Date.now(),
        active: true
      }
      
      manager['activeEffects'] = [activeEffect]
      
      manager.updateEffects()
      
      expect(manager.getActiveEffects()).toHaveLength(1)
      expect(manager.getActiveEffects()[0].active).toBe(true)
    })
  })

  describe('cleanupExpiredPowerUps', () => {
    it('should remove expired powerups', () => {
      const expiredPowerUp = {
        id: '1',
        type: 'timeExtension' as PowerUpType,
        x: 100,
        y: 100,
        width: 40,
        height: 40,
        active: true,
        createdAt: Date.now() - 15000 // Created 15 seconds ago (expired)
      }
      
      manager['powerUps'] = [expiredPowerUp]
      
      manager.cleanupExpiredPowerUps()
      
      expect(manager.getPowerUps()).toHaveLength(0)
    })

    it('should keep fresh powerups', () => {
      const freshPowerUp = {
        id: '1',
        type: 'timeExtension' as PowerUpType,
        x: 100,
        y: 100,
        width: 40,
        height: 40,
        active: true,
        createdAt: Date.now() // Just created
      }
      
      manager['powerUps'] = [freshPowerUp]
      
      manager.cleanupExpiredPowerUps()
      
      expect(manager.getPowerUps()).toHaveLength(1)
    })
  })

  describe('isEffectActive', () => {
    it('should return true for active effects', () => {
      const activeEffect = {
        type: 'scoreMultiplier' as PowerUpType,
        value: 2,
        duration: 10000,
        startTime: Date.now(),
        active: true
      }
      
      manager['activeEffects'] = [activeEffect]
      
      expect(manager.isEffectActive('scoreMultiplier')).toBe(true)
    })

    it('should return false for inactive effects', () => {
      expect(manager.isEffectActive('scoreMultiplier')).toBe(false)
    })
  })

  describe('getEffectValue', () => {
    it('should return effect value for active effects', () => {
      const activeEffect = {
        type: 'scoreMultiplier' as PowerUpType,
        value: 2,
        duration: 10000,
        startTime: Date.now(),
        active: true
      }
      
      manager['activeEffects'] = [activeEffect]
      
      expect(manager.getEffectValue('scoreMultiplier')).toBe(2)
    })

    it('should return 1 for inactive effects', () => {
      expect(manager.getEffectValue('scoreMultiplier')).toBe(1)
    })
  })

  describe('reset', () => {
    it('should clear all powerups and effects', () => {
      mockRandom.mockReturnValue(0.1)
      
      const gameArea = { width: 800, height: 600 }
      manager.spawnPowerUp(gameArea)
      
      const activeEffect = {
        type: 'scoreMultiplier' as PowerUpType,
        value: 2,
        duration: 10000,
        startTime: Date.now(),
        active: true
      }
      manager['activeEffects'] = [activeEffect]
      
      manager.reset()
      
      expect(manager.getPowerUps()).toHaveLength(0)
      expect(manager.getActiveEffects()).toHaveLength(0)
    })
  })
})