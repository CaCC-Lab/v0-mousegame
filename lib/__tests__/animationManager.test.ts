import { AnimationManager } from '../animationManager'
import { AnimationType, ParticleEffect } from '../../types/animation'

describe('AnimationManager', () => {
  let manager: AnimationManager

  beforeEach(() => {
    manager = new AnimationManager()
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with empty particles and no combo', () => {
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
    it('should create particle effects for fruit collection', () => {
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

    it('should create different particles for power-up collection', () => {
      const particles = manager.createParticleEffect(150, 250, 'powerUpCollect')
      
      expect(particles.length).toBeGreaterThan(5)
      expect(particles.some(p => p.type === 'star')).toBe(true)
    })

    it('should create confetti for stage completion', () => {
      const particles = manager.createParticleEffect(400, 300, 'stageComplete')
      
      expect(particles.length).toBeGreaterThan(20)
      expect(particles.every(p => p.type === 'confetti')).toBe(true)
    })
  })

  describe('addParticles', () => {
    it('should add particles to the manager', () => {
      const particles = manager.createParticleEffect(100, 100, 'fruitCollect')
      manager.addParticles(particles)
      
      expect(manager.getParticles().length).toBe(particles.length)
    })

    it('should append to existing particles', () => {
      const particles1 = manager.createParticleEffect(100, 100, 'fruitCollect')
      const particles2 = manager.createParticleEffect(200, 200, 'powerUpCollect')
      
      manager.addParticles(particles1)
      manager.addParticles(particles2)
      
      expect(manager.getParticles().length).toBe(particles1.length + particles2.length)
    })
  })

  describe('updateParticles', () => {
    it('should update particle positions based on velocity', () => {
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

    it('should apply gravity if specified', () => {
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

    it('should remove expired particles', () => {
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
    it('should track combo count', () => {
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(1)
      
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(2)
    })

    it('should reset combo after time window', () => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500) // Within 2s window
        .mockReturnValueOnce(4000) // Outside 2s window
      
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(1)
      
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(2)
      
      manager.recordFruitCollect()
      expect(manager.getComboInfo().count).toBe(1) // Reset
    })

    it('should calculate combo multiplier', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1000)
      
      // Build up combo
      for (let i = 0; i < 3; i++) {
        manager.recordFruitCollect()
      }
      expect(manager.getComboInfo().multiplier).toBe(1.5)
      
      // Continue to 5
      for (let i = 0; i < 2; i++) {
        manager.recordFruitCollect()
      }
      expect(manager.getComboInfo().multiplier).toBe(2.0)
    })

    it('should get combo message', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1000)
      
      expect(manager.getComboMessage()).toBeNull()
      
      for (let i = 0; i < 3; i++) {
        manager.recordFruitCollect()
      }
      expect(manager.getComboMessage()).toBe('コンボ x3!')
    })
  })

  describe('animation presets', () => {
    it('should get animation config for type', () => {
      const config = manager.getAnimationConfig('fruitCollect')
      
      expect(config).toHaveProperty('duration')
      expect(config).toHaveProperty('easing')
      expect(config).toHaveProperty('scale')
      expect(config.type).toBe('fruitCollect')
    })

    it('should return ui transition for unknown type', () => {
      const config = manager.getAnimationConfig('unknown' as AnimationType)
      
      expect(config.type).toBe('uiTransition')
    })
  })

  describe('clearParticles', () => {
    it('should clear all particles', () => {
      const particles = manager.createParticleEffect(100, 100, 'fruitCollect')
      manager.addParticles(particles)
      
      manager.clearParticles()
      
      expect(manager.getParticles()).toEqual([])
    })
  })

  describe('reset', () => {
    it('should reset particles and combo', () => {
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