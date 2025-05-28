import { useState, useCallback, useRef, useEffect } from 'react'
import { PowerUpManager } from '../lib/powerUpManager'
import { PowerUp, PowerUpEffect, PowerUpType, POWERUP_SPAWN_INTERVAL } from '../types/powerup'

interface GameArea {
  width: number
  height: number
}

export function usePowerUps(gameArea: GameArea) {
  const managerRef = useRef<PowerUpManager | null>(null)
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isActiveRef = useRef(false)

  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [activeEffects, setActiveEffects] = useState<PowerUpEffect[]>([])

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new PowerUpManager()
  }

  const updateState = useCallback(() => {
    if (managerRef.current) {
      setPowerUps(managerRef.current.getPowerUps())
      setActiveEffects(managerRef.current.getActiveEffects())
    }
  }, [])

  const startUpdateLoop = useCallback(() => {
    const update = () => {
      if (isActiveRef.current && managerRef.current) {
        managerRef.current.updateEffects()
        managerRef.current.cleanupExpiredPowerUps()
        updateState()
        
        if (isActiveRef.current) {
          animationFrameRef.current = requestAnimationFrame(update)
        }
      }
    }
    
    if (isActiveRef.current) {
      animationFrameRef.current = requestAnimationFrame(update)
    }
  }, [updateState])

  const stopUpdateLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const spawnPowerUp = useCallback(() => {
    if (managerRef.current && isActiveRef.current) {
      managerRef.current.spawnPowerUp(gameArea)
      updateState()
    }
  }, [gameArea, updateState])

  const startSpawning = useCallback(() => {
    if (isActiveRef.current) {
      return // Already started
    }
    
    isActiveRef.current = true
    
    // Start spawn interval
    spawnIntervalRef.current = setInterval(spawnPowerUp, POWERUP_SPAWN_INTERVAL)
    
    // Start update loop
    startUpdateLoop()
  }, [spawnPowerUp, startUpdateLoop])

  const stopSpawning = useCallback(() => {
    isActiveRef.current = false
    
    // Clear spawn interval
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current)
      spawnIntervalRef.current = null
    }
    
    // Stop update loop
    stopUpdateLoop()
  }, [stopUpdateLoop])

  const collectPowerUp = useCallback((powerUpId: string): PowerUpEffect | null => {
    if (!managerRef.current) {
      return null
    }
    
    const effect = managerRef.current.collectPowerUp(powerUpId)
    updateState()
    return effect
  }, [updateState])

  const isEffectActive = useCallback((type: PowerUpType): boolean => {
    return managerRef.current?.isEffectActive(type) ?? false
  }, [])

  const getEffectValue = useCallback((type: PowerUpType): number => {
    return managerRef.current?.getEffectValue(type) ?? 1
  }, [])

  const reset = useCallback(() => {
    stopSpawning()
    managerRef.current?.reset()
    updateState()
  }, [stopSpawning, updateState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpawning()
    }
  }, [stopSpawning])

  return {
    powerUps,
    activeEffects,
    startSpawning,
    stopSpawning,
    collectPowerUp,
    isEffectActive,
    getEffectValue,
    reset
  }
}