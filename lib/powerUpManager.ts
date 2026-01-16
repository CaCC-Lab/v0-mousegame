import { PowerUp, PowerUpEffect, PowerUpType, POWERUP_CONFIGS, POWERUP_LIFETIME } from '../types/powerup'

interface GameArea {
  width: number
  height: number
}

/**
 * Generates a unique ID for a power-up.
 */
function generatePowerUpId(): string {
  return `powerup_${Date.now()}_${Math.random()}`
}

/**
 * Selects a random power-up type based on spawn chances.
 */
function selectRandomPowerUpType(): PowerUpType | null {
  const random = Math.random()
  let cumulativeChance = 0

  for (const [type, config] of Object.entries(POWERUP_CONFIGS)) {
    cumulativeChance += config.spawnChance
    if (random <= cumulativeChance) {
      return type as PowerUpType
    }
  }

  return null
}

/**
 * Generates a random position within the game area.
 */
function generateRandomPosition(gameArea: GameArea, width: number, height: number): { x: number; y: number } {
  return {
    x: Math.random() * (gameArea.width - width),
    y: Math.random() * (gameArea.height - height)
  }
}

/**
 * Checks if an effect has expired.
 */
function isEffectExpired(effect: PowerUpEffect, currentTime: number): boolean {
  if (effect.duration === 0) return true
  return currentTime - effect.startTime >= effect.duration
}

/**
 * Checks if a power-up has expired based on its age.
 */
function isPowerUpExpired(powerUp: PowerUp, currentTime: number): boolean {
  return currentTime - powerUp.createdAt >= POWERUP_LIFETIME
}

export class PowerUpManager {
  private powerUps: PowerUp[] = []
  private activeEffects: PowerUpEffect[] = []

  spawnPowerUp(gameArea: GameArea): PowerUp | null {
    const selectedType = selectRandomPowerUpType()
    if (!selectedType) return null

    const config = POWERUP_CONFIGS[selectedType]
    const position = generateRandomPosition(gameArea, config.size.width, config.size.height)

    const powerUp: PowerUp = {
      id: generatePowerUpId(),
      type: selectedType,
      x: position.x,
      y: position.y,
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
    if (!powerUp) return null

    powerUp.active = false

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
    this.activeEffects = this.activeEffects.filter(effect => !isEffectExpired(effect, currentTime))
  }

  cleanupExpiredPowerUps(): void {
    const currentTime = Date.now()
    this.powerUps = this.powerUps.filter(powerUp => !isPowerUpExpired(powerUp, currentTime))
  }

  isEffectActive(type: PowerUpType): boolean {
    return this.activeEffects.some(effect => effect.type === type && effect.active)
  }

  getEffectValue(type: PowerUpType): number {
    const effect = this.activeEffects.find(e => e.type === type && e.active)
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
