import React from 'react'
import { motion } from 'framer-motion'
import { ParticleEffect } from '../types/animation'

interface ParticleProps {
  particle: ParticleEffect
}

const PARTICLE_EMOJIS: Record<ParticleEffect['type'], string> = {
  star: '\u2b50',
  heart: '\u2764\ufe0f',
  sparkle: '\u2728',
  bubble: '\ud83e\udee7',
  confetti: '\ud83c\udf8a'
}

const ANIMATION_TIMINGS = [0, 0.2, 0.5, 0.8, 1]

interface ParticleAnimationConfig {
  initial: { scale: number; rotate?: number; opacity: number }
  animate: {
    scale: number[]
    rotate?: number[]
    y: number[]
    x?: number[]
    opacity: number[]
  }
}

const PARTICLE_ANIMATIONS: Record<ParticleEffect['type'], ParticleAnimationConfig> = {
  star: {
    initial: { scale: 0, rotate: -180, opacity: 1 },
    animate: {
      scale: [0, 1.5, 1],
      rotate: [-180, 0, 360],
      y: [-50, -100],
      opacity: [1, 1, 0],
    },
  },
  heart: {
    initial: { scale: 0, opacity: 1 },
    animate: {
      scale: [0, 1.2, 1, 0.8, 0],
      y: [-20, -60, -100],
      x: [0, -10, 10, -5, 0],
      opacity: [1, 1, 1, 0.5, 0],
    },
  },
  sparkle: {
    initial: { scale: 0, rotate: 0, opacity: 1 },
    animate: {
      scale: [0, 1.3, 0.8, 1.5, 0],
      rotate: [0, 180, 360, 540, 720],
      y: [-30, -70],
      opacity: [1, 1, 1, 0.7, 0],
    },
  },
  bubble: {
    initial: { scale: 0, opacity: 1 },
    animate: {
      scale: [0, 1, 1.2, 1, 0.5],
      y: [-10, -40, -80, -120],
      x: [0, 15, -10, 5, 0],
      opacity: [1, 1, 0.8, 0.5, 0],
    },
  },
  confetti: {
    initial: { scale: 0, rotate: 0, opacity: 1 },
    animate: {
      scale: [0, 1.5, 1, 0.8, 0],
      rotate: [0, 360, 720, 1080],
      y: [-20, -50, -90],
      x: [0, 20, -15, 10, -5],
      opacity: [1, 1, 1, 0.6, 0],
    },
  },
}

export function Particle({ particle }: ParticleProps): React.ReactElement {
  const animation = PARTICLE_ANIMATIONS[particle.type]

  return (
    <motion.div
      data-testid={`particle-${particle.id}`}
      className="absolute pointer-events-none select-none"
      style={{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        fontSize: `${particle.size}px`,
        color: particle.color,
        filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))',
        zIndex: 100,
      }}
      initial={animation.initial}
      animate={animation.animate}
      transition={{
        duration: particle.duration / 1000,
        ease: 'easeOut',
        times: ANIMATION_TIMINGS,
      }}
    >
      {PARTICLE_EMOJIS[particle.type]}
    </motion.div>
  )
}
