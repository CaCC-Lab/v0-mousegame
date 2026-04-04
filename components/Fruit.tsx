import React, { useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Fruit as FruitType, FRUIT_EMOJI } from '@/types/game'
import { useTouchEvents } from '@/hooks/useTouchEvents'

interface FruitProps {
  fruit: FruitType
  isHardMode?: boolean
  isSelected?: boolean
  onClick: () => void
  onDoubleClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
}

const FRUIT_STYLES = {
  apple: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    shadow: 'shadow-[0_4px_12px_rgba(239,68,68,0.4)]',
    glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.6)]',
    ring: 'ring-red-400',
  },
  blueberry: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    shadow: 'shadow-[0_4px_12px_rgba(59,130,246,0.4)]',
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]',
    ring: 'ring-blue-400',
  },
  lemon: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    shadow: 'shadow-[0_4px_12px_rgba(255,210,63,0.4)]',
    glow: 'hover:shadow-[0_0_20px_rgba(255,210,63,0.6)]',
    ring: 'ring-yellow-400',
  },
  watermelon: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    shadow: 'shadow-[0_4px_12px_rgba(34,197,94,0.4)]',
    glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]',
    ring: 'ring-green-400',
  },
} as const

const ANIMATION_VARIANTS = {
  idle: {
    scale: 1,
    rotate: 0,
    y: [0, -3, 0],
    transition: {
      y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  hover: {
    scale: 1.15,
    rotate: [0, -5, 5, -5, 0] as number[],
    y: -5,
    transition: {
      rotate: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' as const },
      scale: { duration: 0.2 },
      y: { duration: 0.2 }
    }
  },
  pressed: {
    scale: 0.9,
    transition: { duration: 0.1 }
  },
  selected: {
    scale: 1.2,
    rotate: [0, -10, 10, -10, 10, 0] as number[],
    transition: {
      rotate: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' as const }
    }
  }
}

const SIZE_CLASSES = {
  small: 'text-3xl',
  medium: 'text-4xl',
  large: 'text-5xl'
} as const

function getSizeClass(size: FruitType['size']): string {
  return SIZE_CLASSES[size]
}

function getAnimationState(isSelected: boolean, isPressed: boolean, isHovered: boolean): string {
  if (isSelected) return 'selected'
  if (isPressed) return 'pressed'
  if (isHovered) return 'hover'
  return 'idle'
}

interface SparkleEffectProps {
  isVisible: boolean
}

function SparkleEffect({ isVisible }: SparkleEffectProps): React.ReactElement | null {
  if (!isVisible) return null

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-300 rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </motion.div>
  )
}

interface BackgroundCircleProps {
  fruitStyle: typeof FRUIT_STYLES[keyof typeof FRUIT_STYLES]
}

function BackgroundCircle({ fruitStyle }: BackgroundCircleProps): React.ReactElement {
  return (
    <div
      className={`
        absolute inset-0 rounded-full
        ${fruitStyle.bg}
        ${fruitStyle.border}
        border-2
        -z-10
        transform scale-110
        blur-sm
        opacity-60
      `}
    />
  )
}

const FruitComponent = React.memo<FruitProps>(function FruitComponent({
  fruit,
  isSelected = false,
  onClick,
  onDoubleClick,
  onMouseDown
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const sizeClass = getSizeClass(fruit.size)
  const fruitStyle = FRUIT_STYLES[fruit.type]
  const animationState = getAnimationState(isSelected, isPressed, isHovered)

  const touchHandlers = useMemo(() => {
    switch (fruit.type) {
      case 'apple':
        return { onTap: onClick }
      case 'blueberry':
        return { onDoubleTap: onDoubleClick }
      case 'lemon':
        return {
          onLongPress: (point: { x: number; y: number }) => {
            const syntheticEvent = {
              button: 2,
              clientX: point.x,
              clientY: point.y,
              preventDefault: () => {}
            } as unknown as React.MouseEvent
            onMouseDown(syntheticEvent)
          }
        }
      case 'watermelon':
        return {
          onDragStart: (point: { x: number; y: number }) => {
            const syntheticEvent = {
              button: 0,
              clientX: point.x,
              clientY: point.y,
              preventDefault: () => {}
            } as unknown as React.MouseEvent
            onMouseDown(syntheticEvent)
          }
        }
      default:
        return {}
    }
  }, [fruit.type, onClick, onDoubleClick, onMouseDown])

  useTouchEvents(elementRef.current, touchHandlers)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPressed(true)
    onMouseDown(e)
  }

  const handleMouseUp = () => setIsPressed(false)

  const handleMouseEnter = () => setIsHovered(true)

  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsPressed(false)
  }

  return (
    <motion.div
      ref={elementRef}
      className={`
        absolute select-none
        ${sizeClass}
        ${fruitStyle.shadow}
        ${fruitStyle.glow}
        transition-shadow duration-300
        ${isSelected ? `ring-4 ${fruitStyle.ring} ring-offset-2 animate-pulse-glow` : ''}
      `}
      style={{
        left: `${fruit.x}%`,
        top: `${fruit.y}%`,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        filter: `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) ${isHovered ? 'brightness(1.1)' : 'brightness(1)'}`,
      }}
      variants={ANIMATION_VARIANTS}
      initial="idle"
      animate={animationState}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-selected={isSelected}
      data-fruit-id={fruit.id}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      role="button"
      aria-label={`${fruit.type} fruit, size ${fruit.size}`}
      tabIndex={0}
    >
      <BackgroundCircle fruitStyle={fruitStyle} />

      <div className="relative z-10 p-2 -m-2">
        {FRUIT_EMOJI[fruit.type]}
      </div>

      <SparkleEffect isVisible={isHovered} />
    </motion.div>
  )
}, (prevProps, nextProps) => {
  return prevProps.fruit.id === nextProps.fruit.id
    && prevProps.fruit.x === nextProps.fruit.x
    && prevProps.fruit.y === nextProps.fruit.y
    && prevProps.isHardMode === nextProps.isHardMode
    && prevProps.isSelected === nextProps.isSelected
})

export const Fruit = FruitComponent
