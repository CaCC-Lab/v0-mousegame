import React from 'react'
import { ParticleEffect } from '../types/animation'
import { Particle } from './Particle'

interface ParticleContainerProps {
  particles: ParticleEffect[]
}

export const ParticleContainer: React.FC<ParticleContainerProps> = ({ particles }) => {
  return (
    <div
      data-testid="particle-container"
      className="absolute inset-0 pointer-events-none overflow-hidden z-50"
    >
      {particles.map(particle => (
        <Particle key={particle.id} particle={particle} />
      ))}
    </div>
  )
}