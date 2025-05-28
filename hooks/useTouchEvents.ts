import { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
}

interface TouchHandlers {
  onTap?: (point: Point) => void
  onDoubleTap?: (point: Point) => void
  onLongPress?: (point: Point) => void
  onDragStart?: (point: Point) => void
  onDragMove?: (point: Point) => void
  onDragEnd?: (point: Point) => void
}

const DOUBLE_TAP_DELAY = 300 // ms
const LONG_PRESS_DELAY = 500 // ms
const MOVE_THRESHOLD = 10 // pixels

export function useTouchEvents(
  element: HTMLElement | null,
  handlers: TouchHandlers
) {
  const touchStartTimeRef = useRef<number>(0)
  const touchStartPointRef = useRef<Point | null>(null)
  const lastTapTimeRef = useRef<number>(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const hasTappedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      // Ignore multi-touch
      if (e.touches.length > 1) return

      const touch = e.touches[0]
      const point = { x: touch.clientX, y: touch.clientY }
      
      touchStartTimeRef.current = Date.now()
      touchStartPointRef.current = point
      isDraggingRef.current = false
      hasTappedRef.current = false

      // Set up long press timer
      if (handlers.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (!isDraggingRef.current && touchStartPointRef.current) {
            handlers.onLongPress!(touchStartPointRef.current)
            hasTappedRef.current = true
          }
        }, LONG_PRESS_DELAY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPointRef.current || e.touches.length > 1) return

      const touch = e.touches[0]
      const point = { x: touch.clientX, y: touch.clientY }
      
      const deltaX = Math.abs(point.x - touchStartPointRef.current.x)
      const deltaY = Math.abs(point.y - touchStartPointRef.current.y)
      
      if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
        // Cancel long press
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }

        if (!isDraggingRef.current) {
          isDraggingRef.current = true
          handlers.onDragStart?.(touchStartPointRef.current)
        }

        handlers.onDragMove?.(point)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (!touchStartPointRef.current) return

      const touch = e.changedTouches[0]
      const point = { x: touch.clientX, y: touch.clientY }
      
      if (isDraggingRef.current) {
        handlers.onDragEnd?.(point)
      } else if (!hasTappedRef.current) {
        const now = Date.now()
        const tapDuration = now - touchStartTimeRef.current

        // Check for double tap
        if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
          handlers.onDoubleTap?.(point)
          lastTapTimeRef.current = 0 // Reset to prevent triple tap
        } else if (tapDuration < LONG_PRESS_DELAY) {
          handlers.onTap?.(point)
          lastTapTimeRef.current = now
        }
      }

      touchStartPointRef.current = null
    }

    const handleTouchCancel = () => {
      // Clear any ongoing gestures
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      touchStartPointRef.current = null
      isDraggingRef.current = false
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [element, handlers])
}