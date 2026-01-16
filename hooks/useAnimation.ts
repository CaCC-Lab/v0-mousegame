import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimationManager } from '../lib/animationManager'
import { AnimationType, ParticleEffect, ComboInfo } from '../types/animation'

interface ComboState extends ComboInfo {
  isActive: boolean
}

interface UseAnimationReturn {
  particles: ParticleEffect[]
  combo: ComboState
  triggerAnimation: (type: AnimationType, x: number, y: number) => void
  onFruitCollected: () => void
  update: (deltaTime: number) => void
  reset: () => void
  calculateScore: (baseScore: number) => number
  isAnimating: boolean
}

const INITIAL_COMBO_STATE: ComboState = {
  count: 0,
  multiplier: 1,
  lastCollectTime: 0,
  timeWindow: 2000,
  isActive: false
}

const COMBO_THRESHOLDS = [5, 10, 15, 20, 25, 30]

function createComboState(comboInfo: ComboInfo, isActive: boolean): ComboState {
  return { ...comboInfo, isActive }
}

export function useAnimation(): UseAnimationReturn {
  const animationManagerRef = useRef(new AnimationManager())
  const [particles, setParticles] = useState<ParticleEffect[]>([])
  const [combo, setCombo] = useState<ComboState>(INITIAL_COMBO_STATE)
  const lastUpdateRef = useRef(Date.now())

  const triggerAnimation = useCallback((type: AnimationType, x: number, y: number) => {
    const newParticles = animationManagerRef.current.createParticleEffect(x, y, type)
    setParticles(prev => [...prev, ...newParticles])

    if (type === 'comboEffect') {
      const comboInfo = animationManagerRef.current.getComboInfo()
      setCombo(createComboState(comboInfo, comboInfo.count > 0))
    }
  }, [])

  const onFruitCollected = useCallback(() => {
    const manager = animationManagerRef.current
    manager.recordFruitCollect()
    const comboInfo = manager.getComboInfo()
    setCombo(createComboState(comboInfo, comboInfo.count > 0))

    if (COMBO_THRESHOLDS.includes(comboInfo.count)) {
      triggerAnimation('comboEffect', window.innerWidth / 2, window.innerHeight / 2)
    }
  }, [triggerAnimation])

  const update = useCallback((deltaTime: number) => {
    const manager = animationManagerRef.current

    manager.updateParticles(deltaTime)
    setParticles(manager.getActiveParticles())

    const comboInfo = manager.getComboInfo()
    const now = Date.now()
    const isActive = comboInfo.count > 0 && (now - comboInfo.lastCollectTime <= comboInfo.timeWindow)

    if (comboInfo.count > 0 && !isActive) {
      manager.reset()
      setCombo(INITIAL_COMBO_STATE)
    } else {
      setCombo(createComboState(comboInfo, isActive))
    }
  }, [])

  const reset = useCallback(() => {
    animationManagerRef.current.reset()
    setParticles([])
    setCombo(INITIAL_COMBO_STATE)
  }, [])

  const calculateScore = useCallback((baseScore: number): number => {
    return baseScore * combo.multiplier
  }, [combo.multiplier])

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

    return () => cancelAnimationFrame(animationFrameId)
  }, [update])

  return {
    particles,
    combo,
    triggerAnimation,
    onFruitCollected,
    update,
    reset,
    calculateScore,
    isAnimating: particles.length > 0
  }
}
