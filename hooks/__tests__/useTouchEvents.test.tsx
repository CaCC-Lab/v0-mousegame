import { renderHook, act } from '@testing-library/react'
import { useTouchEvents } from '../useTouchEvents'

describe('useTouchEvents', () => {
  let mockElement: HTMLElement
  let mockHandlers: {
    onTap: jest.Mock
    onDoubleTap: jest.Mock
    onLongPress: jest.Mock
    onDragStart: jest.Mock
    onDragMove: jest.Mock
    onDragEnd: jest.Mock
  }

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockHandlers = {
      onTap: jest.fn(),
      onDoubleTap: jest.fn(),
      onLongPress: jest.fn(),
      onDragStart: jest.fn(),
      onDragMove: jest.fn(),
      onDragEnd: jest.fn(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should handle single tap', () => {
    const { result } = renderHook(() => useTouchEvents(mockElement, mockHandlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    act(() => {
      mockElement.dispatchEvent(touchStart)
      mockElement.dispatchEvent(touchEnd)
    })
    
    expect(mockHandlers.onTap).toHaveBeenCalledWith({ x: 100, y: 100 })
    expect(mockHandlers.onDoubleTap).not.toHaveBeenCalled()
    expect(mockHandlers.onLongPress).not.toHaveBeenCalled()
  })

  it('should handle double tap', () => {
    const { result } = renderHook(() => useTouchEvents(mockElement, mockHandlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    // First tap
    act(() => {
      mockElement.dispatchEvent(touchStart)
      mockElement.dispatchEvent(touchEnd)
    })
    
    // Second tap within double tap threshold
    act(() => {
      mockElement.dispatchEvent(touchStart)
      mockElement.dispatchEvent(touchEnd)
    })
    
    expect(mockHandlers.onDoubleTap).toHaveBeenCalledWith({ x: 100, y: 100 })
    expect(mockHandlers.onTap).toHaveBeenCalledTimes(1) // Only first tap
  })

  it('should handle long press', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useTouchEvents(mockElement, mockHandlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    act(() => {
      mockElement.dispatchEvent(touchStart)
    })
    
    act(() => {
      jest.advanceTimersByTime(500) // Advance past long press threshold
    })
    
    expect(mockHandlers.onLongPress).toHaveBeenCalledWith({ x: 100, y: 100 })
    
    jest.useRealTimers()
  })

  it('should handle drag', () => {
    const { result } = renderHook(() => useTouchEvents(mockElement, mockHandlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchMove1 = new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 150 } as Touch],
    })
    const touchMove2 = new TouchEvent('touchmove', {
      touches: [{ clientX: 200, clientY: 200 } as Touch],
    })
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 200, clientY: 200 } as Touch],
    })
    
    act(() => {
      mockElement.dispatchEvent(touchStart)
      mockElement.dispatchEvent(touchMove1)
      mockElement.dispatchEvent(touchMove2)
      mockElement.dispatchEvent(touchEnd)
    })
    
    expect(mockHandlers.onDragStart).toHaveBeenCalledWith({ x: 100, y: 100 })
    expect(mockHandlers.onDragMove).toHaveBeenCalledWith({ x: 150, y: 150 })
    expect(mockHandlers.onDragMove).toHaveBeenCalledWith({ x: 200, y: 200 })
    expect(mockHandlers.onDragEnd).toHaveBeenCalledWith({ x: 200, y: 200 })
  })

  it('should cancel long press on move', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useTouchEvents(mockElement, mockHandlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 150 } as Touch],
    })
    
    act(() => {
      mockElement.dispatchEvent(touchStart)
    })
    
    act(() => {
      jest.advanceTimersByTime(200) // Advance partially
    })
    
    act(() => {
      mockElement.dispatchEvent(touchMove)
    })
    
    act(() => {
      jest.advanceTimersByTime(400) // Advance past threshold
    })
    
    expect(mockHandlers.onLongPress).not.toHaveBeenCalled()
    
    jest.useRealTimers()
  })

  it('should handle multi-touch (ignore)', () => {
    const { result } = renderHook(() => useTouchEvents(mockElement, mockHandlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [
        { clientX: 100, clientY: 100 } as Touch,
        { clientX: 200, clientY: 200 } as Touch,
      ],
    })
    
    act(() => {
      mockElement.dispatchEvent(touchStart)
    })
    
    expect(mockHandlers.onTap).not.toHaveBeenCalled()
    expect(mockHandlers.onDragStart).not.toHaveBeenCalled()
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(mockElement, 'removeEventListener')
    
    const { unmount } = renderHook(() => useTouchEvents(mockElement, mockHandlers))
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function))
  })
})