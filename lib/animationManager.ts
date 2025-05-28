import {
  AnimationType,
  AnimationConfig,
  ParticleEffect,
  ComboInfo,
  DEFAULT_ANIMATION_PRESETS,
  COMBO_THRESHOLDS,
  PARTICLE_COLORS
} from '../types/animation'

export class AnimationManager {
  private particles: ParticleEffect[] = []
  private comboInfo: ComboInfo = {
    count: 0,
    multiplier: 1,
    timeWindow: 2000,
    lastCollectTime: 0
  }
  private particleIdCounter = 0

  constructor() {
    // Initialize
  }

  createParticleEffect(x: number, y: number, animationType: AnimationType): ParticleEffect[] {
    const particles: ParticleEffect[] = []
    
    switch (animationType) {
      case 'fruitCollect':
        // Create star particles
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8
          const speed = 150 + Math.random() * 100
          particles.push(this.createParticle(x, y, 'star', {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed - 50
          }, 800, 15 + Math.random() * 10))
        }
        break

      case 'powerUpCollect':
        // Create mixed particles
        for (let i = 0; i < 12; i++) {
          const angle = (Math.PI * 2 * i) / 12
          const speed = 200 + Math.random() * 150
          const type = Math.random() > 0.5 ? 'star' : 'sparkle'
          particles.push(this.createParticle(x, y, type, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed - 100
          }, 1000, 20 + Math.random() * 15))
        }
        break

      case 'stageComplete':
        // Create confetti rain
        for (let i = 0; i < 30; i++) {
          const spreadX = (Math.random() - 0.5) * 600
          const startY = -50 - Math.random() * 200
          particles.push(this.createParticle(
            x + spreadX,
            startY,
            'confetti',
            {
              x: (Math.random() - 0.5) * 100,
              y: 200 + Math.random() * 100
            },
            3000,
            15 + Math.random() * 10,
            300
          ))
        }
        break

      case 'comboEffect':
        // Create heart particles
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6
          const speed = 100 + Math.random() * 50
          particles.push(this.createParticle(x, y, 'heart', {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed - 30
          }, 600, 12 + Math.random() * 8))
        }
        break

      case 'scoreUpdate':
        // Create bubble particles
        for (let i = 0; i < 4; i++) {
          particles.push(this.createParticle(x, y, 'bubble', {
            x: (Math.random() - 0.5) * 50,
            y: -100 - Math.random() * 50
          }, 1000, 8 + Math.random() * 6, -200))
        }
        break
    }
    
    return particles
  }

  private createParticle(
    x: number,
    y: number,
    type: ParticleEffect['type'],
    velocity: { x: number; y: number },
    duration: number,
    size: number,
    gravity?: number
  ): ParticleEffect {
    const colors = PARTICLE_COLORS[type]
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    return {
      id: `particle_${this.particleIdCounter++}`,
      x,
      y,
      type,
      color,
      size,
      duration,
      velocity,
      gravity,
      fadeOut: true
    }
  }

  addParticles(particles: ParticleEffect[]): void {
    this.particles.push(...particles)
  }

  updateParticles(deltaTime: number): void {
    const dt = deltaTime / 1000 // Convert to seconds
    
    this.particles = this.particles
      .map(particle => {
        // Apply gravity first
        if (particle.gravity) {
          particle.velocity.y += particle.gravity * dt
        }
        
        // Update position
        particle.x += particle.velocity.x * dt
        particle.y += particle.velocity.y * dt
        
        // Update lifetime
        particle.duration -= deltaTime
        
        return particle
      })
      .filter(particle => particle.duration > 0)
  }

  getParticles(): ParticleEffect[] {
    return [...this.particles]
  }

  clearParticles(): void {
    this.particles = []
  }

  recordFruitCollect(): void {
    const now = Date.now()
    
    if (now - this.comboInfo.lastCollectTime > this.comboInfo.timeWindow) {
      // Reset combo
      this.comboInfo.count = 1
    } else {
      this.comboInfo.count++
    }
    
    this.comboInfo.lastCollectTime = now
    
    // Update multiplier based on thresholds
    const threshold = COMBO_THRESHOLDS
      .slice()
      .reverse()
      .find(t => this.comboInfo.count >= t.count)
    
    this.comboInfo.multiplier = threshold ? threshold.multiplier : 1
  }

  getComboInfo(): ComboInfo {
    return { ...this.comboInfo }
  }

  getComboMessage(): string | null {
    const threshold = COMBO_THRESHOLDS.find(t => t.count === this.comboInfo.count)
    return threshold ? threshold.message : null
  }

  getAnimationConfig(type: AnimationType): AnimationConfig {
    return DEFAULT_ANIMATION_PRESETS[type] || DEFAULT_ANIMATION_PRESETS.uiTransition
  }

  reset(): void {
    this.particles = []
    this.comboInfo = {
      count: 0,
      multiplier: 1,
      timeWindow: 2000,
      lastCollectTime: 0
    }
    this.particleIdCounter = 0
  }

  getActiveParticles(): ParticleEffect[] {
    return [...this.particles]
  }
}