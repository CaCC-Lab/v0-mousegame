import { renderHook, act } from '@testing-library/react'
import { useTouchEvents } from '../useTouchEvents'

/**
 * useTouchEventsの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('useTouchEvents', () => {
  let element: HTMLElement
  let handlers: {
    onTap?: (point: { x: number; y: number }) => void
    onDoubleTap?: (point: { x: number; y: number }) => void
    onLongPress?: (point: { x: number; y: number }) => void
    onDragStart?: (point: { x: number; y: number }) => void
    onDragMove?: (point: { x: number; y: number }) => void
    onDragEnd?: (point: { x: number; y: number }) => void
  }
  let handlerCalls: Record<string, Array<{ x: number; y: number }>>

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
    
    handlerCalls = {
      onTap: [],
      onDoubleTap: [],
      onLongPress: [],
      onDragStart: [],
      onDragMove: [],
      onDragEnd: [],
    }
    
    handlers = {
      onTap: (point) => handlerCalls.onTap.push(point),
      onDoubleTap: (point) => handlerCalls.onDoubleTap.push(point),
      onLongPress: (point) => handlerCalls.onLongPress.push(point),
      onDragStart: (point) => handlerCalls.onDragStart.push(point),
      onDragMove: (point) => handlerCalls.onDragMove.push(point),
      onDragEnd: (point) => handlerCalls.onDragEnd.push(point),
    }
  })

  afterEach(() => {
    document.body.removeChild(element)
  })

  it('handles single tap', () => {
    renderHook(() => useTouchEvents(element, handlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    act(() => {
      element.dispatchEvent(touchStart)
      element.dispatchEvent(touchEnd)
    })
    
    expect(handlerCalls.onTap).toHaveLength(1)
    expect(handlerCalls.onTap[0]).toEqual({ x: 100, y: 100 })
    expect(handlerCalls.onDoubleTap).toHaveLength(0)
    expect(handlerCalls.onLongPress).toHaveLength(0)
  })

  it('handles double tap', () => {
    renderHook(() => useTouchEvents(element, handlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    // 最初のタップ
    act(() => {
      element.dispatchEvent(touchStart)
      element.dispatchEvent(touchEnd)
    })
    
    // ダブルタップの閾値内で2回目のタップ
    act(() => {
      element.dispatchEvent(touchStart)
      element.dispatchEvent(touchEnd)
    })
    
    expect(handlerCalls.onDoubleTap).toHaveLength(1)
    expect(handlerCalls.onDoubleTap[0]).toEqual({ x: 100, y: 100 })
    expect(handlerCalls.onTap).toHaveLength(1) // 最初のタップのみ
  })

  it('handles long press', () => {
    jest.useFakeTimers()
    renderHook(() => useTouchEvents(element, handlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    act(() => {
      element.dispatchEvent(touchStart)
    })
    
    act(() => {
      jest.advanceTimersByTime(500) // 長押しの閾値を超える
    })
    
    expect(handlerCalls.onLongPress).toHaveLength(1)
    expect(handlerCalls.onLongPress[0]).toEqual({ x: 100, y: 100 })
    
    jest.useRealTimers()
  })

  it('handles drag', () => {
    renderHook(() => useTouchEvents(element, handlers))
    
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
      element.dispatchEvent(touchStart)
      element.dispatchEvent(touchMove1)
      element.dispatchEvent(touchMove2)
      element.dispatchEvent(touchEnd)
    })
    
    expect(handlerCalls.onDragStart).toHaveLength(1)
    expect(handlerCalls.onDragStart[0]).toEqual({ x: 100, y: 100 })
    expect(handlerCalls.onDragMove.length).toBeGreaterThan(0)
    expect(handlerCalls.onDragEnd).toHaveLength(1)
    expect(handlerCalls.onDragEnd[0]).toEqual({ x: 200, y: 200 })
  })

  it('ignores multi-touch', () => {
    renderHook(() => useTouchEvents(element, handlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [
        { clientX: 100, clientY: 100 } as Touch,
        { clientX: 200, clientY: 200 } as Touch,
      ],
    })
    
    act(() => {
      element.dispatchEvent(touchStart)
    })
    
    // マルチタッチは無視される
    expect(handlerCalls.onTap).toHaveLength(0)
    expect(handlerCalls.onDragStart).toHaveLength(0)
  })

  it('cancels long press on movement', () => {
    jest.useFakeTimers()
    renderHook(() => useTouchEvents(element, handlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientX: 150, clientY: 150 } as Touch],
    })
    
    act(() => {
      element.dispatchEvent(touchStart)
    })
    
    act(() => {
      jest.advanceTimersByTime(250) // 長押しの途中
    })
    
    act(() => {
      element.dispatchEvent(touchMove) // 移動で長押しキャンセル
    })
    
    act(() => {
      jest.advanceTimersByTime(500) // さらに時間を進める
    })
    
    expect(handlerCalls.onLongPress).toHaveLength(0)
    expect(handlerCalls.onDragStart).toHaveLength(1)
    
    jest.useRealTimers()
  })

  it('handles tap after double tap timeout', async () => {
    renderHook(() => useTouchEvents(element, handlers))
    
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    // 最初のタップ
    act(() => {
      element.dispatchEvent(touchStart)
      element.dispatchEvent(touchEnd)
    })
    
    // ダブルタップのタイムアウトを待つ
    await new Promise(resolve => setTimeout(resolve, 350))
    
    // 2回目のタップ（新しいシングルタップとして扱われる）
    act(() => {
      element.dispatchEvent(touchStart)
      element.dispatchEvent(touchEnd)
    })
    
    expect(handlerCalls.onTap).toHaveLength(2)
    expect(handlerCalls.onDoubleTap).toHaveLength(0)
  })

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useTouchEvents(element, handlers))
    
    unmount()
    
    // アンマウント後はイベントが処理されない
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch],
    })
    
    act(() => {
      element.dispatchEvent(touchStart)
    })
    
    expect(handlerCalls.onTap).toHaveLength(0)
    expect(handlerCalls.onDragStart).toHaveLength(0)
  })

  it('handles null element gracefully', () => {
    const { result } = renderHook(() => useTouchEvents(null, handlers))
    
    // エラーが発生しないことを確認
    expect(result).toBeDefined()
  })
})