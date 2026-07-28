import { renderHook, act } from '@testing-library/react'
import { useKeyboardControls } from '../useKeyboardControls'

describe('useKeyboardControls', () => {
  const mockHandlers = {
    onSpacePress: jest.fn(),
    onEnterPress: jest.fn(),
    onEscapePress: jest.fn(),
    onArrowKeys: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle space key press', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).toHaveBeenCalledTimes(1)
  })

  it('should handle enter key press', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onEnterPress).toHaveBeenCalledTimes(1)
  })

  it('should handle escape key press', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onEscapePress).toHaveBeenCalledTimes(1)
  })

  it('should handle arrow key presses', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    const directions = [
      { key: 'ArrowUp', direction: 'up' },
      { key: 'ArrowDown', direction: 'down' },
      { key: 'ArrowLeft', direction: 'left' },
      { key: 'ArrowRight', direction: 'right' },
    ]

    directions.forEach(({ key, direction }) => {
      act(() => {
        const event = new KeyboardEvent('keydown', { key, code: key })
        window.dispatchEvent(event)
      })

      expect(mockHandlers.onArrowKeys).toHaveBeenCalledWith(direction)
    })

    expect(mockHandlers.onArrowKeys).toHaveBeenCalledTimes(4)
  })

  it('should prevent default for arrow keys to avoid scrolling', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown' })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    
    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useKeyboardControls(mockHandlers))
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should not call handlers for other keys', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).not.toHaveBeenCalled()
    expect(mockHandlers.onEnterPress).not.toHaveBeenCalled()
    expect(mockHandlers.onEscapePress).not.toHaveBeenCalled()
    expect(mockHandlers.onArrowKeys).not.toHaveBeenCalled()
  })

  it('should respect enabled state', () => {
    const { result, rerender } = renderHook(
      ({ handlers, enabled }) => useKeyboardControls(handlers, enabled),
      {
        initialProps: { handlers: mockHandlers, enabled: false },
      }
    )
    
    // When disabled, should not respond to keys
    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).not.toHaveBeenCalled()

    // Enable and test again
    rerender({ handlers: mockHandlers, enabled: true })

    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).toHaveBeenCalledTimes(1)
  })

  it('should provide focus management functions', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    expect(result.current.focusGame).toBeDefined()
    expect(result.current.blurGame).toBeDefined()
    expect(typeof result.current.focusGame).toBe('function')
    expect(typeof result.current.blurGame).toBe('function')
  })

  describe('フォーム要素にフォーカスがあるとき', () => {
    /** 指定タグの要素を実際にDOMへ追加してフォーカスする */
    const focusElement = (tagName: string, type?: string) => {
      const el = document.createElement(tagName) as HTMLInputElement
      if (type) el.type = type
      document.body.appendChild(el)
      el.focus()
      return el
    }

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it.each([
      ['input', 'checkbox'],
      ['input', 'text'],
      ['select', undefined],
      ['textarea', undefined],
      ['button', undefined],
    ])('%s(%s) にフォーカスがあるとスペースキーを横取りしない', (tagName, type) => {
      // ゲームのショートカットが優先されると、チェックボックスの切り替えなど
      // 要素本来のキー操作ができなくなる
      renderHook(() => useKeyboardControls(mockHandlers))
      const el = focusElement(tagName, type as string | undefined)

      act(() => {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }))
      })

      expect(mockHandlers.onSpacePress).not.toHaveBeenCalled()
    })

    it('フォーム要素以外にフォーカスがあるときは従来どおり動作する', () => {
      renderHook(() => useKeyboardControls(mockHandlers))
      const div = document.createElement('div')
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      act(() => {
        div.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }))
      })

      expect(mockHandlers.onSpacePress).toHaveBeenCalledTimes(1)
    })

    it('矢印キーもフォーム要素にフォーカスがあるときは横取りしない', () => {
      renderHook(() => useKeyboardControls(mockHandlers))
      const select = focusElement('select')

      act(() => {
        select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      })

      expect(mockHandlers.onArrowKeys).not.toHaveBeenCalled()
    })
  })
})