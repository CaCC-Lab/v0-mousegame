import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PowerUp as PowerUpType, POWERUP_CONFIGS } from '../types/powerup'

interface PowerUpProps {
  powerUp: PowerUpType
  onClick: (powerUpId: string) => void
}

const ENTRY_ANIMATION = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0, y: [0, -5, 0] },
  transition: {
    scale: { duration: 0.5, type: 'spring', bounce: 0.6 },
    rotate: { duration: 0.6 },
    y: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  }
}

const HOVER_ANIMATION = {
  scale: 1.2,
  rotate: [0, -10, 10, -10, 10, 0],
  transition: { rotate: { duration: 0.5 }, scale: { duration: 0.2 } }
}

const TAP_ANIMATION = {
  scale: 0.9,
  transition: { duration: 0.1 }
}

function RotatingRing(): React.ReactElement {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-4 border-dashed opacity-50"
      style={{ borderColor: 'rgba(255, 255, 255, 0.7)' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />
  )
}

function PulsingGlow({ color }: { color: string }): React.ReactElement {
  return (
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{ backgroundColor: color, filter: 'blur(8px)' }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function PowerUpIcon({ icon, isHovered }: { icon: string; isHovered: boolean }): React.ReactElement {
  return (
    <motion.div
      className="relative z-10 text-shadow"
      animate={{ scale: isHovered ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.3, repeat: isHovered ? Infinity : 0 }}
    >
      {icon}
    </motion.div>
  )
}

function SparkleParticles({ isVisible }: { isVisible: boolean }): React.ReactElement | null {
  if (!isVisible) return null

  return (
    <motion.div className="absolute inset-0 pointer-events-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-white rounded-full"
          style={{ top: '50%', left: '50%' }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * 2 * Math.PI) / 5) * 30,
            y: Math.sin((i * 2 * Math.PI) / 5) * 30,
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </motion.div>
  )
}

function ShineEffect(): React.ReactElement {
  return (
    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function PowerUp({ powerUp, onClick }: PowerUpProps): React.ReactElement | null {
  const [isHovered, setIsHovered] = useState(false)

  const config = POWERUP_CONFIGS[powerUp.type]

  const handleClick = useCallback(() => {
    onClick(powerUp.id)
  }, [onClick, powerUp.id])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(powerUp.id)
    }
  }, [onClick, powerUp.id])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  if (!powerUp.active) {
    return null
  }

  return (
    <motion.button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={config.name}
      title={config.description}
      className="
        absolute z-10 rounded-full
        flex items-center justify-center text-2xl font-bold text-white
        focus:outline-none shadow-playful
        overflow-visible
      "
      style={{
        left: powerUp.x,
        top: powerUp.y,
        width: powerUp.width,
        height: powerUp.height,
        backgroundColor: config.color,
        boxShadow: `
          0 0 0 3px rgba(255, 255, 255, 0.8),
          0 0 20px ${config.color},
          0 8px 16px rgba(0, 0, 0, 0.3)
        `,
      }}
      data-powerup-id={powerUp.id}
      initial={ENTRY_ANIMATION.initial}
      animate={ENTRY_ANIMATION.animate}
      transition={ENTRY_ANIMATION.transition}
      whileHover={HOVER_ANIMATION}
      whileTap={TAP_ANIMATION}
    >
      <RotatingRing />
      <PulsingGlow color={config.color} />
      <PowerUpIcon icon={config.icon} isHovered={isHovered} />
      <SparkleParticles isVisible={isHovered} />
      <ShineEffect />
    </motion.button>
  )
}
