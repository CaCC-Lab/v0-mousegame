import React from 'react'
import { PowerUp as PowerUpType, POWERUP_CONFIGS } from '../types/powerup'

interface PowerUpProps {
  powerUp: PowerUpType
  onClick: (powerUpId: string) => void
}

export function PowerUp({ powerUp, onClick }: PowerUpProps) {
  if (!powerUp.active) {
    return null
  }

  const config = POWERUP_CONFIGS[powerUp.type]

  const handleClick = () => {
    onClick(powerUp.id)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(powerUp.id)
    }
  }

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={config.name}
      title={config.description}
      className="
        absolute z-10 rounded-full border-2 border-white shadow-lg
        cursor-pointer transition-transform hover:scale-110 animate-pulse
        flex items-center justify-center text-2xl font-bold text-white
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
      "
      style={{
        left: powerUp.x,
        top: powerUp.y,
        width: powerUp.width,
        height: powerUp.height,
        backgroundColor: config.color
      }}
      data-powerup-id={powerUp.id}
    >
      {config.icon}
    </button>
  )
}