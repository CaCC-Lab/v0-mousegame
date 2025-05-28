import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ParticleContainer } from '../ParticleContainer'
import { ParticleEffect } from '../../types/animation'

describe('ParticleContainer', () => {
  const mockParticles: ParticleEffect[] = [
    {
      id: 'particle-1',
      x: 100,
      y: 200,
      type: 'star',
      color: '#FFD700',
      size: 20,
      duration: 1000,
      velocity: { x: 0, y: 0 },
      fadeOut: true
    },
    {
      id: 'particle-2',
      x: 150,
      y: 250,
      type: 'heart',
      color: '#FF0000',
      size: 25,
      duration: 800,
      velocity: { x: 10, y: -10 },
      fadeOut: true
    }
  ]

  it('should render a container with correct styling', () => {
    render(<ParticleContainer particles={[]} />)
    
    const container = screen.getByTestId('particle-container')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('absolute', 'inset-0', 'pointer-events-none', 'overflow-hidden')
  })

  it('should render no particles when array is empty', () => {
    render(<ParticleContainer particles={[]} />)
    
    const container = screen.getByTestId('particle-container')
    expect(container.children).toHaveLength(0)
  })

  it('should render all particles', () => {
    render(<ParticleContainer particles={mockParticles} />)
    
    expect(screen.getByTestId('particle-particle-1')).toBeInTheDocument()
    expect(screen.getByTestId('particle-particle-2')).toBeInTheDocument()
  })

  it('should render particles with correct types', () => {
    render(<ParticleContainer particles={mockParticles} />)
    
    expect(screen.getByTestId('particle-particle-1')).toHaveTextContent('⭐')
    expect(screen.getByTestId('particle-particle-2')).toHaveTextContent('❤️')
  })

  it('should have high z-index', () => {
    render(<ParticleContainer particles={mockParticles} />)
    
    const container = screen.getByTestId('particle-container')
    expect(container).toHaveClass('z-50')
  })

  it('should update when particles change', () => {
    const { rerender } = render(<ParticleContainer particles={[mockParticles[0]]} />)
    
    expect(screen.getByTestId('particle-particle-1')).toBeInTheDocument()
    expect(screen.queryByTestId('particle-particle-2')).not.toBeInTheDocument()
    
    rerender(<ParticleContainer particles={mockParticles} />)
    
    expect(screen.getByTestId('particle-particle-1')).toBeInTheDocument()
    expect(screen.getByTestId('particle-particle-2')).toBeInTheDocument()
  })

  it('should remove particles when they are no longer in the array', () => {
    const { rerender } = render(<ParticleContainer particles={mockParticles} />)
    
    expect(screen.getByTestId('particle-particle-1')).toBeInTheDocument()
    expect(screen.getByTestId('particle-particle-2')).toBeInTheDocument()
    
    rerender(<ParticleContainer particles={[mockParticles[1]]} />)
    
    expect(screen.queryByTestId('particle-particle-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('particle-particle-2')).toBeInTheDocument()
  })

  it('should handle large numbers of particles', () => {
    const manyParticles = Array.from({ length: 100 }, (_, i) => ({
      id: `particle-${i}`,
      x: Math.random() * 500,
      y: Math.random() * 500,
      type: 'sparkle' as const,
      color: '#FFFFFF',
      size: 10,
      duration: 1000,
      velocity: { x: 0, y: 0 },
      fadeOut: true
    }))
    
    render(<ParticleContainer particles={manyParticles} />)
    
    const container = screen.getByTestId('particle-container')
    expect(container.children).toHaveLength(100)
  })
})