import React, { useRef } from 'react'
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

const FruitComponent = React.memo<FruitProps>(({
  fruit,
  isHardMode = false,
  isSelected = false,
  onClick,
  onDoubleClick,
  onMouseDown
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const sizeClass = fruit.size === 'small' ? 'text-2xl' :
                   fruit.size === 'medium' ? 'text-3xl' :
                   'text-4xl'

  // Set up touch event handlers based on fruit type
  const touchHandlers = React.useMemo(() => {
    const handlers: Parameters<typeof useTouchEvents>[1] = {}
    
    switch (fruit.type) {
      case 'apple':
        handlers.onTap = () => onClick()
        break
      case 'blueberry':
        handlers.onDoubleTap = () => onDoubleClick()
        break
      case 'lemon':
        handlers.onLongPress = (point: { x: number; y: number }) => {
          // Simulate right-click for long press
          const syntheticEvent = {
            button: 2,
            clientX: point.x,
            clientY: point.y,
            preventDefault: () => {}
          } as unknown as React.MouseEvent
          onMouseDown(syntheticEvent)
        }
        break
      case 'watermelon':
        handlers.onDragStart = (point: { x: number; y: number }) => {
          // Simulate left-click for drag start
          const syntheticEvent = {
            button: 0,
            clientX: point.x,
            clientY: point.y,
            preventDefault: () => {}
          } as unknown as React.MouseEvent
          onMouseDown(syntheticEvent)
        }
        break
    }
    
    return handlers
  }, [fruit.type, onClick, onDoubleClick, onMouseDown])

  useTouchEvents(elementRef.current, touchHandlers)

  return (
    <motion.div
      ref={elementRef}
      className={`absolute cursor-pointer select-none ${sizeClass} ${
        isSelected ? 'ring-4 ring-yellow-400 ring-offset-2 rounded-full' : ''
      }`}
      style={{
        left: `${fruit.x}%`,
        top: `${fruit.y}%`,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
      animate={isHardMode ? { x: `${fruit.x}%`, y: `${fruit.y}%` } : {}}
      transition={{ type: "spring", stiffness: 100, damping: 10 }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      data-selected={isSelected}
      data-fruit-id={fruit.id}
    >
      {FRUIT_EMOJI[fruit.type]}
    </motion.div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return prevProps.fruit.id === nextProps.fruit.id &&
         prevProps.fruit.x === nextProps.fruit.x &&
         prevProps.fruit.y === nextProps.fruit.y &&
         prevProps.isHardMode === nextProps.isHardMode &&
         prevProps.isSelected === nextProps.isSelected
})

FruitComponent.displayName = 'Fruit'

export const Fruit = FruitComponent