import { PowerUpManager } from '../powerUpManager'
import { PowerUpType } from '../../types/powerup'

/**
 * PowerUpManagerの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('PowerUpManager', () => {
  let manager: PowerUpManager

  beforeEach(() => {
    manager = new PowerUpManager()
  })

  describe('constructor', () => {
    it('initializes with empty powerups and effects', () => {
      expect(manager.getPowerUps()).toEqual([])
      expect(manager.getActiveEffects()).toEqual([])
    })
  })

  describe('spawnPowerUp', () => {
    it('spawns powerups based on random chance', () => {
      const gameArea = { width: 800, height: 600 }
      let spawnedCount = 0
      
      // 複数回試行してスポーン率をテスト
      for (let i = 0; i < 100; i++) {
        const powerUp = manager.spawnPowerUp(gameArea)
        if (powerUp) {
          spawnedCount++
          
          // 基本的なプロパティの検証
          expect(powerUp).toHaveProperty('id')
          expect(powerUp).toHaveProperty('type')
          expect(powerUp).toHaveProperty('x')
          expect(powerUp).toHaveProperty('y')
          expect(powerUp).toHaveProperty('width')
          expect(powerUp).toHaveProperty('height')
          expect(powerUp.active).toBe(true)
          
          // 位置が範囲内にあることを確認
          expect(powerUp.x).toBeGreaterThanOrEqual(0)
          expect(powerUp.x).toBeLessThanOrEqual(gameArea.width - powerUp.width)
          expect(powerUp.y).toBeGreaterThanOrEqual(0)
          expect(powerUp.y).toBeLessThanOrEqual(gameArea.height - powerUp.height)
          
          // クリーンアップ
          manager.reset()
        }
      }
      
      // ある程度のパワーアップがスポーンされることを確認
      expect(spawnedCount).toBeGreaterThan(0)
      expect(spawnedCount).toBeLessThan(100) // すべてではない
    })

    it('adds spawned powerup to powerups list', () => {
      const gameArea = { width: 800, height: 600 }
      
      // パワーアップがスポーンされるまで試行
      let powerUp = null
      for (let i = 0; i < 1000 && !powerUp; i++) {
        powerUp = manager.spawnPowerUp(gameArea)
      }
      
      if (powerUp) {
        expect(manager.getPowerUps()).toHaveLength(1)
        expect(manager.getPowerUps()[0].id).toBe(powerUp.id)
      }
    })
  })

  describe('collectPowerUp', () => {
    it('collects powerup and creates effect', () => {
      const gameArea = { width: 800, height: 600 }
      
      // パワーアップをスポーンするまで試行
      let powerUp = null
      for (let i = 0; i < 1000 && !powerUp; i++) {
        powerUp = manager.spawnPowerUp(gameArea)
      }
      
      if (powerUp) {
        const effect = manager.collectPowerUp(powerUp.id)
        
        expect(effect).toBeDefined()
        expect(effect?.type).toBe(powerUp.type)
        expect(effect?.active).toBe(true)
        expect(effect?.value).toBeGreaterThan(0)
        expect(effect?.duration).toBeGreaterThan(0)
      }
    })

    it('marks powerup as inactive after collection', () => {
      const gameArea = { width: 800, height: 600 }
      
      // パワーアップをスポーンするまで試行
      let powerUp = null
      for (let i = 0; i < 1000 && !powerUp; i++) {
        powerUp = manager.spawnPowerUp(gameArea)
      }
      
      if (powerUp) {
        manager.collectPowerUp(powerUp.id)
        
        const powerUps = manager.getPowerUps()
        const collectedPowerUp = powerUps.find(p => p.id === powerUp.id)
        expect(collectedPowerUp?.active).toBe(false)
      }
    })

    it('returns null for non-existent powerup', () => {
      const effect = manager.collectPowerUp('non-existent')
      expect(effect).toBeNull()
    })

    it('adds effect to active effects list', () => {
      const gameArea = { width: 800, height: 600 }
      
      // パワーアップをスポーンするまで試行
      let powerUp = null
      for (let i = 0; i < 1000 && !powerUp; i++) {
        powerUp = manager.spawnPowerUp(gameArea)
      }
      
      if (powerUp) {
        const initialEffectsCount = manager.getActiveEffects().length
        manager.collectPowerUp(powerUp.id)
        
        expect(manager.getActiveEffects().length).toBe(initialEffectsCount + 1)
      }
    })
  })

  describe('updateEffects', () => {
    it('removes expired effects', async () => {
      // 短い期間のエフェクトを直接追加
      const expiredEffect = {
        type: 'scoreMultiplier' as PowerUpType,
        value: 2,
        duration: 100, // 100ms
        startTime: Date.now(),
        active: true
      }
      
      manager['activeEffects'] = [expiredEffect]
      
      // エフェクトが期限切れになるまで待つ
      await new Promise(resolve => setTimeout(resolve, 150))
      
      manager.updateEffects()
      
      expect(manager.getActiveEffects()).toHaveLength(0)
    })

    it('keeps active effects', () => {
      const activeEffect = {
        type: 'scoreMultiplier' as PowerUpType,
        value: 2,
        duration: 10000, // 10秒
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
    it('removes expired powerups', async () => {
      const expiredPowerUp = {
        id: '1',
        type: 'timeExtension' as PowerUpType,
        x: 100,
        y: 100,
        width: 40,
        height: 40,
        active: true,
        createdAt: Date.now() - 15000 // 15秒前に作成（期限切れ）
      }
      
      manager['powerUps'] = [expiredPowerUp]
      
      manager.cleanupExpiredPowerUps()
      
      expect(manager.getPowerUps()).toHaveLength(0)
    })

    it('keeps fresh powerups', () => {
      const freshPowerUp = {
        id: '1',
        type: 'timeExtension' as PowerUpType,
        x: 100,
        y: 100,
        width: 40,
        height: 40,
        active: true,
        createdAt: Date.now() // 今作成
      }
      
      manager['powerUps'] = [freshPowerUp]
      
      manager.cleanupExpiredPowerUps()
      
      expect(manager.getPowerUps()).toHaveLength(1)
    })
  })

  describe('isEffectActive', () => {
    it('returns true for active effects', () => {
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

    it('returns false for inactive effects', () => {
      expect(manager.isEffectActive('scoreMultiplier')).toBe(false)
    })
  })

  describe('getEffectValue', () => {
    it('returns effect value for active effects', () => {
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

    it('returns 1 for inactive effects', () => {
      expect(manager.getEffectValue('scoreMultiplier')).toBe(1)
    })
  })

  describe('reset', () => {
    it('clears all powerups and effects', () => {
      const gameArea = { width: 800, height: 600 }
      
      // パワーアップをスポーンするまで試行
      for (let i = 0; i < 100; i++) {
        manager.spawnPowerUp(gameArea)
      }
      
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