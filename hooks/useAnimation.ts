import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimationManager } from '../lib/animationManager'
import { AnimationType, ParticleEffect, ComboInfo } from '../types/animation'

interface UseAnimationReturn {
  particles: ParticleEffect[]
  combo: ComboInfo & { isActive: boolean }
  triggerAnimation: (type: AnimationType, x: number, y: number) => void
  onFruitCollected: () => void
  update: (deltaTime: number) => void
  reset: () => void
  calculateScore: (baseScore: number) => number
  isAnimating: boolean
}

export function useAnimation(): UseAnimationReturn {
  const animationManagerRef = useRef(new AnimationManager())
  const [particles, setParticles] = useState<ParticleEffect[]>([])
  const [combo, setCombo] = useState<ComboInfo & { isActive: boolean }>({
    count: 0,
    multiplier: 1,
    lastCollectTime: 0,
    timeWindow: 2000,
    isActive: false
  })
  const lastUpdateRef = useRef(Date.now())

  const triggerAnimation = useCallback((type: AnimationType, x: number, y: number) => {
    const newParticles = animationManagerRef.current.createParticleEffect(x, y, type)
    setParticles(prev => [...prev, ...newParticles])
    
    // If combo effect was triggered, update combo state
    if (type === 'comboEffect') {
      const comboInfo = animationManagerRef.current.getComboInfo()
      setCombo({ ...comboInfo, isActive: comboInfo.count > 0 })
    }
  }, [])

  const onFruitCollected = useCallback(() => {
    const manager = animationManagerRef.current
    manager.recordFruitCollect()
    const comboInfo = manager.getComboInfo()
    setCombo({ ...comboInfo, isActive: comboInfo.count > 0 })
    
    // Check if we just reached a new multiplier threshold
    const thresholds = [5, 10, 15, 20, 25, 30]
    if (thresholds.includes(comboInfo.count)) {
      // Trigger combo effect animation at a default position (center of screen)
      triggerAnimation('comboEffect', window.innerWidth / 2, window.innerHeight / 2)
    }
  }, [triggerAnimation])

  const update = useCallback((deltaTime: number) => {
    const manager = animationManagerRef.current
    
    // Update particles
    manager.updateParticles(deltaTime)
    setParticles(manager.getActiveParticles())
    
    // Update combo
    const comboInfo = manager.getComboInfo()
    const now = Date.now()
    const isActive = comboInfo.count > 0 && (now - comboInfo.lastCollectTime <= comboInfo.timeWindow)
    
    // Reset combo if it's expired
    if (comboInfo.count > 0 && !isActive) {
      manager.reset()
      setCombo({
        count: 0,
        multiplier: 1,
        lastCollectTime: 0,
        timeWindow: 2000,
        isActive: false
      })
    } else {
      setCombo({ ...comboInfo, isActive })
    }
  }, [])

  const reset = useCallback(() => {
    const manager = animationManagerRef.current
    manager.reset()
    setParticles([])
    setCombo({
      count: 0,
      multiplier: 1,
      lastCollectTime: 0,
      timeWindow: 2000,
      isActive: false
    })
  }, [])

  const calculateScore = useCallback((baseScore: number): number => {
    return baseScore * combo.multiplier
  }, [combo.multiplier])

  // Animation loop
  useEffect(() => {
    let animationFrameId: number

    const animate = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateRef.current
      lastUpdateRef.current = now
      
      update(deltaTime)
      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [update])

  const isAnimating = particles.length > 0

  return {
    particles,
    combo,
    triggerAnimation,
    onFruitCollected,
    update,
    reset,
    calculateScore,
    isAnimating
  }
}