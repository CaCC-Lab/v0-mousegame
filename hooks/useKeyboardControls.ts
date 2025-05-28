import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardHandlers {
  onSpacePress?: () => void
  onEnterPress?: () => void
  onEscapePress?: () => void
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void
}

export function useKeyboardControls(
  handlers: KeyboardHandlers,
  enabled: boolean = true
) {
  const gameContainerRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    switch (event.key) {
      case ' ':
      case 'Spacebar': // For older browsers
        event.preventDefault()
        handlers.onSpacePress?.()
        break
      case 'Enter':
        handlers.onEnterPress?.()
        break
      case 'Escape':
        handlers.onEscapePress?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        handlers.onArrowKeys?.('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        handlers.onArrowKeys?.('down')
        break
      case 'ArrowLeft':
        event.preventDefault()
        handlers.onArrowKeys?.('left')
        break
      case 'ArrowRight':
        event.preventDefault()
        handlers.onArrowKeys?.('right')
        break
    }
  }, [enabled, handlers])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  const focusGame = useCallback(() => {
    if (gameContainerRef.current) {
      gameContainerRef.current.focus()
    }
  }, [])

  const blurGame = useCallback(() => {
    if (gameContainerRef.current) {
      gameContainerRef.current.blur()
    }
  }, [])

  return {
    gameContainerRef,
    focusGame,
    blurGame,
  }
}