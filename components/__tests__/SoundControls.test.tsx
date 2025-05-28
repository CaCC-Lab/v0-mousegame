import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SoundControls } from '../SoundControls'

// Mock the useLanguage hook
jest.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: {
      muteSound: 'Mute sound',
      unmuteSound: 'Unmute sound',
      volume: 'Volume',
    },
    language: 'en',
    setLanguage: jest.fn(),
  }),
}))

describe('SoundControls', () => {
  const mockProps = {
    soundEnabled: true,
    volume: 0.5,
    onToggleSound: jest.fn(),
    onVolumeChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Sound Toggle', () => {
    it('should render sound enabled state', () => {
      render(<SoundControls {...mockProps} />)
      
      const toggleButton = screen.getByRole('button', { name: /sound|mute|音/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should render sound disabled state', () => {
      render(<SoundControls {...mockProps} soundEnabled={false} />)
      
      const toggleButton = screen.getByRole('button', { name: /sound|mute|音/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should call onToggleSound when clicked', () => {
      render(<SoundControls {...mockProps} />)
      
      const toggleButton = screen.getByRole('button', { name: /sound|mute|音/i })
      fireEvent.click(toggleButton)
      
      expect(mockProps.onToggleSound).toHaveBeenCalledTimes(1)
    })
  })

  describe('Volume Control', () => {
    it('should render volume slider', () => {
      render(<SoundControls {...mockProps} />)
      
      const volumeSlider = screen.getByRole('slider', { name: /volume|音量/i })
      expect(volumeSlider).toBeInTheDocument()
      expect(volumeSlider).toHaveAttribute('value', '0.5')
    })

    it('should display volume percentage', () => {
      render(<SoundControls {...mockProps} />)
      
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should call onVolumeChange when slider is moved', () => {
      render(<SoundControls {...mockProps} />)
      
      const volumeSlider = screen.getByRole('slider', { name: /volume|音量/i })
      fireEvent.change(volumeSlider, { target: { value: '0.8' } })
      
      expect(mockProps.onVolumeChange).toHaveBeenCalledWith(0.8)
    })

    it('should be disabled when sound is disabled', () => {
      render(<SoundControls {...mockProps} soundEnabled={false} />)
      
      const volumeSlider = screen.getByRole('slider', { name: /volume|音量/i })
      expect(volumeSlider).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SoundControls {...mockProps} />)
      
      const toggleButton = screen.getByRole('button', { name: /sound|mute|音/i })
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true')
      
      const volumeSlider = screen.getByRole('slider', { name: /volume|音量/i })
      expect(volumeSlider).toHaveAttribute('aria-valuemin', '0')
      expect(volumeSlider).toHaveAttribute('aria-valuemax', '1')
      expect(volumeSlider).toHaveAttribute('aria-valuenow', '0.5')
    })
  })
})