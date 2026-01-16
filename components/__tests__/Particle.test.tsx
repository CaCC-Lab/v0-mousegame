import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Particle } from '../Particle'
import { ParticleEffect } from '../../types/animation'

describe('Particle', () => {
  const mockParticle: ParticleEffect = {
    id: 'test-particle',
    x: 100,
    y: 200,
    type: 'star',
    color: '#FFD700',
    size: 20,
    duration: 1000,
    velocity: { x: 0, y: 0 },
    fadeOut: true
  }

  it('should render a particle with correct position', () => {
    render(<Particle particle={mockParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toBeInTheDocument()
    expect(particle).toHaveStyle({
      left: '100px',
      top: '200px'
    })
  })

  it('should apply correct size via fontSize', () => {
    render(<Particle particle={mockParticle} />)

    const particle = screen.getByTestId('particle-test-particle')
    // Particle uses fontSize for sizing instead of width/height
    expect(particle).toHaveStyle({
      fontSize: '20px'
    })
  })

  it('should apply correct color', () => {
    render(<Particle particle={mockParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveStyle({
      color: '#FFD700'
    })
  })

  it('should render star type correctly', () => {
    render(<Particle particle={mockParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveTextContent('⭐')
  })

  it('should render heart type correctly', () => {
    const heartParticle = { ...mockParticle, type: 'heart' as const }
    render(<Particle particle={heartParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveTextContent('❤️')
  })

  it('should render sparkle type correctly', () => {
    const sparkleParticle = { ...mockParticle, type: 'sparkle' as const }
    render(<Particle particle={sparkleParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveTextContent('✨')
  })

  it('should render bubble type correctly', () => {
    const bubbleParticle = { ...mockParticle, type: 'bubble' as const }
    render(<Particle particle={bubbleParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveTextContent('🫧')
  })

  it('should render confetti type correctly', () => {
    const confettiParticle = { ...mockParticle, type: 'confetti' as const }
    render(<Particle particle={confettiParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveTextContent('🎊')
  })

  it('should render with Framer Motion animation', () => {
    render(<Particle particle={mockParticle} />)

    const particle = screen.getByTestId('particle-test-particle')
    // Framer Motion handles animations via style prop, not CSS classes
    expect(particle).toBeInTheDocument()
    expect(particle).toHaveClass('absolute')
  })

  it('should have z-index for proper layering', () => {
    render(<Particle particle={mockParticle} />)

    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveStyle({
      zIndex: '100'
    })
  })

  it('should have absolute positioning', () => {
    render(<Particle particle={mockParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveClass('absolute')
  })

  it('should be pointer-events-none', () => {
    render(<Particle particle={mockParticle} />)
    
    const particle = screen.getByTestId('particle-test-particle')
    expect(particle).toHaveClass('pointer-events-none')
  })
})