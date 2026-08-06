/**
 * Issue #42: タッチでもマウス4操作が成立することの検証。
 *
 * | ジェスチャー | 対応する操作 | 対象フルーツ |
 * |--------------|--------------|--------------|
 * | タップ | クリック | りんご |
 * | すばやく2回タップ | ダブルクリック | ブルーベリー |
 * | 長押し | 右クリック | レモン |
 * | なぞる | ドラッグ＆ドロップ | スイカ |
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Fruit } from '../Fruit'
import { TOUCH_CONFIG } from '@/lib/touchGestures'
import type { Fruit as FruitType } from '@/types/game'

/**
 * JSDOM は PointerEvent を実装していないため、最小限のポリフィルを置く。
 * モックではなく、実ブラウザが備える pointerType / pointerId を再現するだけのもの。
 * （このファイル内だけに閉じるので、他のテストの挙動には影響しない）
 */
class PolyfillPointerEvent extends MouseEvent {
  pointerId: number
  pointerType: string

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
    this.pointerType = init.pointerType ?? ''
  }
}
;(globalThis as unknown as { PointerEvent: typeof PolyfillPointerEvent }).PointerEvent =
  PolyfillPointerEvent

function makeFruit(type: FruitType['type'], id = 1): FruitType {
  return { id, type, size: 'medium', x: 50, y: 50, dx: 0, dy: 0 }
}

function setup(type: FruitType['type'] = 'apple') {
  const handlers = {
    onClick: jest.fn(),
    onDoubleClick: jest.fn(),
    onMouseDown: jest.fn(),
    onLongPress: jest.fn(),
    onTouchDragStart: jest.fn(),
  }
  render(<Fruit fruit={makeFruit(type)} {...handlers} />)
  return { ...handlers, element: screen.getByRole('button') }
}

/** タッチのポインタイベント（jsdom には PointerEvent がないので init で属性を渡す） */
const touch = (x = 100, y = 100) => ({ pointerType: 'touch', clientX: x, clientY: y, pointerId: 1 })

describe('Fruit - タッチ操作', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => { jest.clearAllTimers() })
    jest.useRealTimers()
  })

  it('タップはクリックとして扱われる', () => {
    const { element, onClick, onDoubleClick } = setup('apple')

    fireEvent.pointerDown(element, touch())
    fireEvent.pointerUp(element, touch())

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onDoubleClick).not.toHaveBeenCalled()
  })

  it('すばやく2回タップするとダブルクリックになる', () => {
    const { element, onClick, onDoubleClick } = setup('blueberry')

    fireEvent.pointerDown(element, touch())
    fireEvent.pointerUp(element, touch())
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.doubleTapMs - 100) })
    fireEvent.pointerDown(element, touch())
    fireEvent.pointerUp(element, touch())

    // マウスと同じ順序（click → click → dblclick）で通知する
    expect(onClick).toHaveBeenCalledTimes(2)
    expect(onDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('間隔があいた2回のタップはダブルクリックにならない', () => {
    const { element, onDoubleClick } = setup('blueberry')

    fireEvent.pointerDown(element, touch())
    fireEvent.pointerUp(element, touch())
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.doubleTapMs + 100) })
    fireEvent.pointerDown(element, touch())
    fireEvent.pointerUp(element, touch())

    expect(onDoubleClick).not.toHaveBeenCalled()
  })

  it('長押しは右クリック相当として通知される', () => {
    const { element, onLongPress, onClick } = setup('lemon')

    fireEvent.pointerDown(element, touch())
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.longPressMs) })

    expect(onLongPress).toHaveBeenCalledTimes(1)

    // 指を離しても、長押しに続けてタップ扱いにはしない
    fireEvent.pointerUp(element, touch())
    expect(onClick).not.toHaveBeenCalled()
  })

  it('長押しに満たない時間で離せばタップになる', () => {
    const { element, onLongPress, onClick } = setup('apple')

    fireEvent.pointerDown(element, touch())
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.longPressMs - 100) })
    fireEvent.pointerUp(element, touch())

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('スイカに触れるとドラッグが始まる', () => {
    const { element, onTouchDragStart } = setup('watermelon')

    fireEvent.pointerDown(element, touch())

    expect(onTouchDragStart).toHaveBeenCalledTimes(1)
  })

  it('スイカでは長押しでも右クリック扱いにしない（ドラッグのじゃまをしない）', () => {
    const { element, onLongPress } = setup('watermelon')

    fireEvent.pointerDown(element, touch())
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.longPressMs + 100) })

    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('指が動いたらタップにしない（なぞり操作を誤検出しない）', () => {
    const { element, onClick } = setup('watermelon')

    fireEvent.pointerDown(element, touch(100, 100))
    fireEvent.pointerMove(element, touch(100 + TOUCH_CONFIG.dragThresholdPx + 5, 100))
    fireEvent.pointerUp(element, touch(100 + TOUCH_CONFIG.dragThresholdPx + 5, 100))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('タッチ直後に合成されるマウスクリックは無視する（二重カウント防止）', () => {
    const { element, onClick } = setup('apple')

    fireEvent.pointerDown(element, touch())
    fireEvent.pointerUp(element, touch())
    fireEvent.click(element)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('マウス操作は従来どおり通知される', () => {
    const { element, onClick, onDoubleClick, onMouseDown } = setup('apple')

    fireEvent.click(element)
    fireEvent.doubleClick(element)
    fireEvent.mouseDown(element, { button: 2 })

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onDoubleClick).toHaveBeenCalledTimes(1)
    expect(onMouseDown).toHaveBeenCalledTimes(1)
  })

  it('マウスのポインタイベントではタッチ判定を動かさない', () => {
    const { element, onClick, onLongPress } = setup('lemon')

    fireEvent.pointerDown(element, { pointerType: 'mouse', clientX: 10, clientY: 10 })
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.longPressMs + 100) })
    fireEvent.pointerUp(element, { pointerType: 'mouse', clientX: 10, clientY: 10 })

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })
})
