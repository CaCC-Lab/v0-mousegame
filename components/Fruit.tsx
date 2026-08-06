import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Fruit as FruitType, FRUIT_NAME } from '@/types/game'
import { FruitSprite } from './game/FruitSprite'
import {
  TOUCH_CONFIG,
  classifyTap,
  exceedsDragThreshold,
  isGhostClick,
} from '@/lib/touchGestures'

interface FruitProps {
  fruit: FruitType
  isHardMode?: boolean
  isSelected?: boolean
  onClick: () => void
  onDoubleClick: () => void
  onMouseDown: (e: React.MouseEvent) => void
  /** 長押し（タッチでの右クリック相当） */
  onLongPress?: () => void
  /** タッチでのドラッグ開始（スイカ用） */
  onTouchDragStart?: (e: React.PointerEvent) => void
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
    y: 0,
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
  onMouseDown,
  onLongPress,
  onTouchDragStart
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  // タッチ操作の状態。再描画を挟まず即座に判定したいので ref に持つ
  const lastTouchAtRef = useRef(0)
  const lastTapAtRef = useRef(0)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** 長押し・なぞりでジェスチャーが消費済み（＝指を離してもタップにしない） */
  const gestureConsumedRef = useRef(false)

  const sizeClass = getSizeClass(fruit.size)
  const fruitStyle = FRUIT_STYLES[fruit.type]
  const animationState = getAnimationState(isSelected, isPressed, isHovered)

  // スイカは「なぞって運ぶ」が正解の操作なので、長押しは待たない
  const usesDragGesture = fruit.type === 'watermelon'

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  useEffect(() => clearLongPressTimer, [clearLongPressTimer])

  /** タッチ直後にブラウザが合成するマウスイベントを弾く */
  const shouldIgnoreMouseEvent = useCallback(
    () => isGhostClick(lastTouchAtRef.current, Date.now()),
    []
  )

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return

    lastTouchAtRef.current = Date.now()
    gestureConsumedRef.current = false
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    setIsPressed(true)

    if (usesDragGesture) {
      onTouchDragStart?.(e)
      return
    }

    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      gestureConsumedRef.current = true
      onLongPress?.()
    }, TOUCH_CONFIG.longPressMs)
  }, [usesDragGesture, onTouchDragStart, onLongPress, clearLongPressTimer])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return

    const start = pointerStartRef.current
    if (!start) return

    if (exceedsDragThreshold(e.clientX - start.x, e.clientY - start.y)) {
      // 指が動いたらタップではない（なぞり操作）
      clearLongPressTimer()
      gestureConsumedRef.current = true
    }
  }, [clearLongPressTimer])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return

    clearLongPressTimer()
    setIsPressed(false)
    lastTouchAtRef.current = Date.now()
    pointerStartRef.current = null

    if (gestureConsumedRef.current) {
      gestureConsumedRef.current = false
      return
    }

    const now = Date.now()
    const kind = classifyTap(lastTapAtRef.current, now)
    lastTapAtRef.current = now

    // マウスと同じ順序（click → click → dblclick）で通知し、上位の判定を共通化する
    onClick()
    if (kind === 'double') {
      onDoubleClick()
    }
  }, [clearLongPressTimer, onClick, onDoubleClick])

  /**
   * タッチ操作のあとにブラウザが合成するマウスイベントを、仕様どおり抑止する。
   *
   * 時間窓（isGhostClick）だけに頼ると、端末が重くて合成クリックが遅れて届いたときに
   * 同じ1回のタップを2回数えてしまう。touchend の既定動作を止めるのが確実な手段。
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
  }, [])

  const handlePointerCancel = useCallback(() => {
    clearLongPressTimer()
    setIsPressed(false)
    pointerStartRef.current = null
    gestureConsumedRef.current = false
  }, [clearLongPressTimer])

  const handleClick = useCallback(() => {
    if (shouldIgnoreMouseEvent()) return
    onClick()
  }, [shouldIgnoreMouseEvent, onClick])

  const handleDoubleClick = useCallback(() => {
    if (shouldIgnoreMouseEvent()) return
    onDoubleClick()
  }, [shouldIgnoreMouseEvent, onDoubleClick])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (shouldIgnoreMouseEvent()) return
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
        // 指でなぞってスイカを運ぶあいだ、ページがスクロール・ズームしないようにする。
        // 長押しでの選択メニュー（iOS のコールアウト）も出さない。
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        filter: `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) ${isHovered ? 'brightness(1.1)' : 'brightness(1)'}`,
      }}
      variants={ANIMATION_VARIANTS}
      initial="idle"
      animate={animationState}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onTouchEnd={handleTouchEnd}
      data-selected={isSelected}
      data-fruit-id={fruit.id}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      role="button"
      aria-label={`${FRUIT_NAME[fruit.type]}（${fruit.type} fruit, size ${fruit.size}）`}
      tabIndex={0}
    >
      <BackgroundCircle fruitStyle={fruitStyle} />

      <div className="relative z-10 p-2 -m-2">
        {/* サイズは親のfont-size（text-3xl等）に追従させる */}
        <FruitSprite type={fruit.type} decorative />
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
