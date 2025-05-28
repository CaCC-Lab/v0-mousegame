import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PowerUp } from '../PowerUp'
import { PowerUp as PowerUpType, POWERUP_CONFIGS } from '../../types/powerup'

const mockPowerUp: PowerUpType = {
  id: 'test-powerup-1',
  type: 'timeExtension',
  x: 100,
  y: 150,
  width: 40,
  height: 40,
  active: true,
  createdAt: Date.now()
}

describe('PowerUp', () => {
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render powerup with correct position and size', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      
      expect(powerUpElement).toBeInTheDocument()
      expect(powerUpElement).toHaveStyle({
        left: '100px',
        top: '150px',
        width: '40px',
        height: '40px'
      })
    })

    it('should display correct icon for timeExtension', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const icon = screen.getByText('⏰')
      expect(icon).toBeInTheDocument()
    })

    it('should display correct icon for scoreMultiplier', () => {
      const scoreMultiplierPowerUp = {
        ...mockPowerUp,
        type: 'scoreMultiplier' as const
      }
      
      render(<PowerUp powerUp={scoreMultiplierPowerUp} onClick={mockOnClick} />)
      
      const icon = screen.getByText('⭐')
      expect(icon).toBeInTheDocument()
    })

    it('should apply correct background color for each type', () => {
      const { rerender } = render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      let powerUpElement = screen.getByRole('button')
      expect(powerUpElement).toHaveStyle({ backgroundColor: POWERUP_CONFIGS.timeExtension.color })

      const scoreMultiplierPowerUp = { ...mockPowerUp, type: 'scoreMultiplier' as const }
      rerender(<PowerUp powerUp={scoreMultiplierPowerUp} onClick={mockOnClick} />)
      
      powerUpElement = screen.getByRole('button')
      expect(powerUpElement).toHaveStyle({ backgroundColor: POWERUP_CONFIGS.scoreMultiplier.color })
    })

    it('should have correct accessibility attributes', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      
      expect(powerUpElement).toHaveAttribute('aria-label', POWERUP_CONFIGS.timeExtension.name)
      expect(powerUpElement).toHaveAttribute('title', POWERUP_CONFIGS.timeExtension.description)
    })
  })

  describe('interaction', () => {
    it('should call onClick when clicked', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      fireEvent.click(powerUpElement)
      
      expect(mockOnClick).toHaveBeenCalledWith(mockPowerUp.id)
    })

    it('should handle keyboard interaction', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      fireEvent.keyDown(powerUpElement, { key: 'Enter' })
      
      expect(mockOnClick).toHaveBeenCalledWith(mockPowerUp.id)
    })

    it('should handle space key', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      fireEvent.keyDown(powerUpElement, { key: ' ' })
      
      expect(mockOnClick).toHaveBeenCalledWith(mockPowerUp.id)
    })
  })

  describe('visual effects', () => {
    it('should have hover effect classes', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      
      expect(powerUpElement).toHaveClass('hover:scale-110')
      expect(powerUpElement).toHaveClass('transition-transform')
    })

    it('should have pulse animation', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      
      expect(powerUpElement).toHaveClass('animate-pulse')
    })

    it('should have proper cursor style', () => {
      render(<PowerUp powerUp={mockPowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.getByRole('button')
      
      expect(powerUpElement).toHaveClass('cursor-pointer')
    })
  })

  describe('different powerup types', () => {
    const powerUpTypes: Array<{ type: keyof typeof POWERUP_CONFIGS; expectedIcon: string }> = [
      { type: 'timeExtension', expectedIcon: '⏰' },
      { type: 'scoreMultiplier', expectedIcon: '⭐' },
      { type: 'speedBoost', expectedIcon: '💨' },
      { type: 'extraFruits', expectedIcon: '🍎' },
      { type: 'freezeTime', expectedIcon: '❄️' }
    ]

    powerUpTypes.forEach(({ type, expectedIcon }) => {
      it(`should render ${type} correctly`, () => {
        const powerUp = { ...mockPowerUp, type }
        render(<PowerUp powerUp={powerUp} onClick={mockOnClick} />)
        
        const icon = screen.getByText(expectedIcon)
        expect(icon).toBeInTheDocument()
        
        const powerUpElement = screen.getByRole('button')
        expect(powerUpElement).toHaveAttribute('aria-label', POWERUP_CONFIGS[type].name)
        expect(powerUpElement).toHaveAttribute('title', POWERUP_CONFIGS[type].description)
        expect(powerUpElement).toHaveStyle({ backgroundColor: POWERUP_CONFIGS[type].color })
      })
    })
  })

  describe('inactive powerup', () => {
    it('should not render when powerup is inactive', () => {
      const inactivePowerUp = { ...mockPowerUp, active: false }
      render(<PowerUp powerUp={inactivePowerUp} onClick={mockOnClick} />)
      
      const powerUpElement = screen.queryByRole('button')
      expect(powerUpElement).not.toBeInTheDocument()
    })
  })
})