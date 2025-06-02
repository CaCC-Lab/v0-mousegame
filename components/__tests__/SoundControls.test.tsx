import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoundControls } from '../SoundControls'

/**
 * SoundControlsの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('SoundControls', () => {
  it('renders sound toggle button', () => {
    render(
      <SoundControls 
        soundEnabled={true}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('displays correct icon based on sound state', () => {
    const { rerender } = render(
      <SoundControls 
        soundEnabled={true}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    // サウンドONの時はVolumeアイコン
    let button = screen.getByRole('button')
    expect(button.querySelector('svg')).toBeInTheDocument()
    
    // サウンドOFFの時
    rerender(
      <SoundControls 
        soundEnabled={false}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    button = screen.getByRole('button')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('calls onToggleSound when button is clicked', async () => {
    const user = userEvent.setup()
    let toggleCalled = false
    
    render(
      <SoundControls 
        soundEnabled={true}
        volume={0.5}
        onToggleSound={() => { toggleCalled = true }}
        onVolumeChange={() => {}}
      />
    )
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(toggleCalled).toBe(true)
  })

  it('renders volume slider', () => {
    render(
      <SoundControls 
        soundEnabled={true}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('value', '0.5')
  })

  it('calls onVolumeChange when slider is moved', async () => {
    const user = userEvent.setup()
    let newVolume: number | null = null
    
    render(
      <SoundControls 
        soundEnabled={true}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={(vol) => { newVolume = vol }}
      />
    )
    
    const slider = screen.getByRole('slider')
    
    // スライダーの値を変更（rangeインプットは直接値を設定）
    fireEvent.change(slider, { target: { value: '0.75' } })
    
    // onVolumeChangeが呼ばれたことを確認
    expect(newVolume).toBe(0.75)
  })

  it('has correct aria-label for accessibility', () => {
    render(
      <SoundControls 
        soundEnabled={true}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
    
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-label')
  })

  it('disables volume slider when sound is disabled', () => {
    render(
      <SoundControls 
        soundEnabled={false}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    const slider = screen.getByRole('slider')
    expect(slider).toBeDisabled()
  })

  it('enables volume slider when sound is enabled', () => {
    render(
      <SoundControls 
        soundEnabled={true}
        volume={0.5}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    const slider = screen.getByRole('slider')
    expect(slider).not.toBeDisabled()
  })

  it('displays volume value correctly', () => {
    render(
      <SoundControls 
        soundEnabled={true}
        volume={0.75}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('value', '0.75')
  })

  it('handles edge cases for volume values', () => {
    const { rerender } = render(
      <SoundControls 
        soundEnabled={true}
        volume={0}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    let slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('value', '0')
    
    rerender(
      <SoundControls 
        soundEnabled={true}
        volume={1}
        onToggleSound={() => {}}
        onVolumeChange={() => {}}
      />
    )
    
    slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('value', '1')
  })
})