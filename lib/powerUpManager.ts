import { PowerUp, PowerUpEffect, PowerUpType, POWERUP_CONFIGS, POWERUP_LIFETIME } from '../types/powerup'

export class PowerUpManager {
  private powerUps: PowerUp[] = []
  private activeEffects: PowerUpEffect[] = []

  constructor() {
    // Initialize empty state
  }

  spawnPowerUp(gameArea: { width: number; height: number }): PowerUp | null {
    // Determine which powerup to spawn based on spawn chances
    const random = Math.random()
    let cumulativeChance = 0
    let selectedType: PowerUpType | null = null

    for (const [type, config] of Object.entries(POWERUP_CONFIGS)) {
      cumulativeChance += config.spawnChance
      if (random <= cumulativeChance) {
        selectedType = type as PowerUpType
        break
      }
    }

    if (!selectedType) {
      return null
    }

    const config = POWERUP_CONFIGS[selectedType]
    
    // Generate random position within game area
    const x = Math.random() * (gameArea.width - config.size.width)
    const y = Math.random() * (gameArea.height - config.size.height)

    const powerUp: PowerUp = {
      id: `powerup_${Date.now()}_${Math.random()}`,
      type: selectedType,
      x,
      y,
      width: config.size.width,
      height: config.size.height,
      active: true,
      createdAt: Date.now()
    }

    this.powerUps.push(powerUp)
    return powerUp
  }

  collectPowerUp(powerUpId: string): PowerUpEffect | null {
    const powerUp = this.powerUps.find(p => p.id === powerUpId && p.active)
    if (!powerUp) {
      return null
    }

    // Mark powerup as inactive
    powerUp.active = false

    // Create effect
    const config = POWERUP_CONFIGS[powerUp.type]
    const effect: PowerUpEffect = {
      type: powerUp.type,
      value: config.effect.value,
      duration: config.effect.duration,
      startTime: Date.now(),
      active: true
    }

    this.activeEffects.push(effect)
    return effect
  }

  updateEffects(): void {
    const currentTime = Date.now()
    this.activeEffects = this.activeEffects.filter(effect => {
      if (effect.duration === 0) {
        // Instant effects are already applied, remove them
        return false
      }
      
      const elapsed = currentTime - effect.startTime
      if (elapsed >= effect.duration) {
        // Effect has expired
        return false
      }
      
      return true
    })
  }

  cleanupExpiredPowerUps(): void {
    const currentTime = Date.now()
    this.powerUps = this.powerUps.filter(powerUp => {
      const age = currentTime - powerUp.createdAt
      return age < POWERUP_LIFETIME
    })
  }

  isEffectActive(type: PowerUpType): boolean {
    return this.activeEffects.some(effect => effect.type === type && effect.active)
  }

  getEffectValue(type: PowerUpType): number {
    const effect = this.activeEffects.find(effect => effect.type === type && effect.active)
    return effect ? effect.value : 1
  }

  getPowerUps(): PowerUp[] {
    return [...this.powerUps]
  }

  getActiveEffects(): PowerUpEffect[] {
    return [...this.activeEffects]
  }

  reset(): void {
    this.powerUps = []
    this.activeEffects = []
  }
}