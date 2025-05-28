import React from 'react'
import { ParticleEffect } from '../types/animation'

interface ParticleProps {
  particle: ParticleEffect
}

const particleEmojis: Record<ParticleEffect['type'], string> = {
  star: '⭐',
  heart: '❤️',
  sparkle: '✨',
  bubble: '🫧',
  confetti: '🎊'
}

export const Particle: React.FC<ParticleProps> = ({ particle }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${particle.x}px`,
    top: `${particle.y}px`,
    width: `${particle.size}px`,
    height: `${particle.size}px`,
    color: particle.color,
    fontSize: `${particle.size}px`,
    lineHeight: 1,
    transition: particle.fadeOut ? `opacity ${particle.duration}ms ease-out` : undefined,
    opacity: particle.fadeOut ? 0 : 1,
    pointerEvents: 'none'
  }

  return (
    <div
      data-testid={`particle-${particle.id}`}
      className={`absolute pointer-events-none ${particle.fadeOut ? 'animate-fadeOut' : ''}`}
      style={style}
    >
      {particleEmojis[particle.type]}
    </div>
  )
}