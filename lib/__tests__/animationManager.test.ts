import { AnimationManager } from '../animationManager'
import { AnimationType, ParticleEffect } from '../../types/animation'

/**
 * AnimationManagerの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('AnimationManager', () => {
  let manager: AnimationManager

  beforeEach(() => {
    manager = new AnimationManager()
  })

  describe('constructor', () => {
    it('initializes with empty particles and no combo', () => {
      expect(manager.getParticles()).toEqual([])
      expect(manager.getComboInfo()).toEqual({
        count: 0,
        multiplier: 1,
        timeWindow: 2000,
        lastCollectTime: 0
      })
    })
  })

  describe('createParticleEffect', () => {
    it('creates particle effects for fruit collection', () => {
      const particles = manager.createParticleEffect(100, 200, 'fruitCollect')
      
      expect(particles).toBeInstanceOf(Array)
      expect(particles.length).toBeGreaterThan(0)
      
      particles.forEach(particle => {
        expect(particle).toHaveProperty('id')
        expect(particle).toHaveProperty('x')
        expect(particle).toHaveProperty('y')
        expect(particle).toHaveProperty('type')
        expect(particle).toHaveProperty('color')
        expect(particle).toHaveProperty('size')
        expect(particle).toHaveProperty('duration')
        expect(particle).toHaveProperty('velocity')
      })
    })

    it('creates different particles for power-up collection', () => {
      const particles = manager.createParticleEffect(150, 250, 'powerUpCollect')
      
      expect(particles.length).toBeGreaterThan(5)
      expect(particles.some(p => p.type === 'star')).toBe(true)
    })

    it('creates confetti for stage completion', () => {
      const particles = manager.createParticleEffect(400, 300, 'stageComplete')
      
      expect(particles.length).toBeGreaterThan(20)
      expect(particles.every(p => p.type === 'confetti')).toBe(true)
    })
  })

  describe('addParticles', () => {
    it('adds particles to the manager', () => {
      const particles = manager.createParticleEffect(100, 100, 'fruitCollect')
      manager.addParticles(particles)
      
      expect(manager.getParticles().length).toBe(particles.length)
    })

    it('appends to existing particles', () => {
      const particles1 = manager.createParticleEffect(100, 100, 'fruitCollect')
      const particles2 = manager.createParticleEffect(200, 200, 'powerUpCollect')
      
      manager.addParticles(particles1)
      manager.addParticles(particles2)
      
      expect(manager.getParticles().length).toBe(particles1.length + particles2.length)
    })
  })

  describe('updateParticles', () => {
    it('updates particle positions based on velocity', () => {
      const particle: ParticleEffect = {
        id: '1',
        x: 100,
        y: 100,
        type: 'star',
        color: '#FFD700',
        size: 10,
        duration: 1000,
        velocity: { x: 10, y: -20 }
      }
      
      manager.addParticles([particle])
      manager.updateParticles(16) // 16ms delta time
      
      const updatedParticles = manager.getParticles()
      expect(updatedParticles[0].x).toBeCloseTo(100.16) // 100 + (10 * 0.016)
      expect(updatedParticles[0].y).toBeCloseTo(99.68) // 100 + (-20 * 0.016)
    })

    it('applies gravity if specified', () => {
      const particle: ParticleEffect = {
        id: '1',
        x: 100,
        y: 100,
        type: 'bubble',
        color: '#87CEEB',
        size: 10,
        duration: 1000,
        velocity: { x: 0, y: 0 },
        gravity: 500 // pixels per second²
      }
      
      manager.addParticles([particle])
      manager.updateParticles(100) // 100ms delta time
      
      const updatedParticles = manager.getParticles()
      expect(updatedParticles[0].velocity.y).toBeCloseTo(50) // 0 + (500 * 0.1)
      expect(updatedParticles[0].y).toBeCloseTo(105) // 100 + (50 * 0.1)
    })

    it('removes expired particles', () => {
      const particle: ParticleEffect = {
        id: '1',
        x: 100,
        y: 100,
        type: 'star',
        color: '#FFD700',
        size: 10,
        duration: 100, // 100ms duration
        velocity: { x: 0, y: 0 }
      }
      
      manager.addParticles([particle])
      manager.updateParticles(150) // 150ms delta time
      
      expect(manager.getParticles()).toEqual([])
    })
  })

  describe('combo system', () => {
    it('tracks combo count', () => {
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(1)
      
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(2)
    })

    it('resets combo after time window', async () => {
      // 最初のフルーツを収集
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(1)
      
      // 少し待つ（時間窓内）
      await new Promise(resolve => setTimeout(resolve, 100))
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(2)
      
      // 時間窓を超えて待つ
      await new Promise(resolve => setTimeout(resolve, 2100))
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(1) // リセットされる
    })

    it('calculates combo multiplier', () => {
      // コンボを構築
      for (let i = 0; i < 3; i++) {
        manager.recordFruitCollect()
      }
      expect(manager.getComboInfo().multiplier).toBe(1.5)
      
      // 5まで続ける
      for (let i = 0; i < 2; i++) {
        manager.recordFruitCollect()
      }
      expect(manager.getComboInfo().multiplier).toBe(2.0)
    })

    it('gets combo message', () => {
      expect(manager.getComboMessage()).toBeNull()
      
      for (let i = 0; i < 3; i++) {
        manager.recordFruitCollect()
      }
      expect(manager.getComboMessage()).toBe('コンボ x3!')
    })

    it('maintains combo within time window', (done) => {
      // 連続してフルーツを収集
      const initialTime = Date.now()
      
      manager.recordFruitCollect()
      const firstComboInfo = manager.getComboInfo()
      expect(firstComboInfo.count).toBe(1)
      expect(firstComboInfo.lastCollectTime).toBeGreaterThanOrEqual(initialTime)
      
      // 1ms待ってから次を収集（タイムスタンプが確実に異なるように）
      setTimeout(() => {
        manager.recordFruitCollect()
        const secondComboInfo = manager.getComboInfo()
        expect(secondComboInfo.count).toBe(2)
        expect(secondComboInfo.lastCollectTime).toBeGreaterThan(firstComboInfo.lastCollectTime)
        done()
      }, 1)
    })
  })

  describe('animation presets', () => {
    it('gets animation config for type', () => {
      const config = manager.getAnimationConfig('fruitCollect')
      
      expect(config).toHaveProperty('duration')
      expect(config).toHaveProperty('easing')
      expect(config).toHaveProperty('scale')
      expect(config.type).toBe('fruitCollect')
    })

    it('returns ui transition for unknown type', () => {
      const config = manager.getAnimationConfig('unknown' as AnimationType)
      
      expect(config.type).toBe('uiTransition')
    })
  })

  describe('clearParticles', () => {
    it('clears all particles', () => {
      const particles = manager.createParticleEffect(100, 100, 'fruitCollect')
      manager.addParticles(particles)
      
      manager.clearParticles()
      
      expect(manager.getParticles()).toEqual([])
    })
  })

  describe('reset', () => {
    it('resets particles and combo', () => {
      manager.addParticles(manager.createParticleEffect(100, 100, 'fruitCollect'))
      manager.recordFruitCollect()
      manager.recordFruitCollect()
      
      manager.reset()
      
      expect(manager.getParticles()).toEqual([])
      expect(manager.getComboInfo().count).toBe(0)
      expect(manager.getComboInfo().multiplier).toBe(1)
    })
  })
})