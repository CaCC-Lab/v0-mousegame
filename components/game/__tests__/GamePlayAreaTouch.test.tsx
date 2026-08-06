/**
 * Issue #42: プレイエリア側のタッチ操作。
 * 長押し→右クリック相当、指でなぞる→ドラッグ＆ドロップ。
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GamePlayArea } from '../GamePlayArea'
import { TOUCH_CONFIG } from '@/lib/touchGestures'
import type { Fruit as FruitType } from '@/types/game'

/** JSDOM は PointerEvent 未実装のため最小ポリフィル（このファイル内のみ） */
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

const DROP_AREA_RECT = { left: 500, right: 600, top: 0, bottom: 400 }

function makeFruit(type: FruitType['type'], id: number): FruitType {
  return { id, type, size: 'medium', x: 20, y: 20, dx: 0, dy: 0 }
}

function setup(fruits: FruitType[]) {
  const onFruitClick = jest.fn()
  const gameAreaRef = React.createRef<HTMLDivElement>()

  render(
    <GamePlayArea
      fruits={fruits}
      powerUps={[]}
      particles={[]}
      isHardMode={false}
      selectedFruitIndex={-1}
      dropAreaText="ドロップエリア"
      onFruitClick={onFruitClick}
      onPowerUpCollect={jest.fn()}
      onTriggerAnimation={jest.fn()}
      onFruitCollected={jest.fn()}
      gameAreaRef={gameAreaRef as React.RefObject<HTMLDivElement>}
    />
  )

  // ドロップ判定は矩形に依存するので、JSDOM が返さない値を補う
  const dropArea = document.querySelector('.drop-area') as HTMLElement
  dropArea.getBoundingClientRect = () => ({
    ...DROP_AREA_RECT,
    width: DROP_AREA_RECT.right - DROP_AREA_RECT.left,
    height: DROP_AREA_RECT.bottom - DROP_AREA_RECT.top,
    x: DROP_AREA_RECT.left,
    y: DROP_AREA_RECT.top,
    toJSON: () => ({}),
  }) as unknown as () => DOMRect

  return { onFruitClick }
}

const touch = (x: number, y: number) => ({
  pointerType: 'touch',
  clientX: x,
  clientY: y,
  pointerId: 1,
})

describe('GamePlayArea - タッチ操作', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => { jest.clearAllTimers() })
    jest.useRealTimers()
  })

  it('レモンの長押しは右クリックとして収穫される', () => {
    const lemon = makeFruit('lemon', 1)
    const { onFruitClick } = setup([lemon])

    const element = screen.getByRole('button')
    fireEvent.pointerDown(element, touch(10, 10))
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.longPressMs) })

    expect(onFruitClick).toHaveBeenCalledWith(lemon, 'rightClick')
  })

  it('レモン以外の長押しも右クリックとして通知される（失敗として記録される）', () => {
    const apple = makeFruit('apple', 2)
    const { onFruitClick } = setup([apple])

    const element = screen.getByRole('button')
    fireEvent.pointerDown(element, touch(10, 10))
    act(() => { jest.advanceTimersByTime(TOUCH_CONFIG.longPressMs) })

    expect(onFruitClick).toHaveBeenCalledWith(apple, 'rightClick')
  })

  it('スイカを指でドロップエリアまで運ぶと収穫される', () => {
    const watermelon = makeFruit('watermelon', 3)
    const { onFruitClick } = setup([watermelon])

    const element = screen.getByRole('button')
    fireEvent.pointerDown(element, touch(10, 100))
    fireEvent.pointerMove(element, touch(300, 100))
    fireEvent.pointerUp(element, touch(550, 100))

    expect(onFruitClick).toHaveBeenCalledWith(watermelon, 'drop')
  })

  it('ドロップエリアの外で指を離すと収穫にならない（失敗として通知）', () => {
    const watermelon = makeFruit('watermelon', 4)
    const { onFruitClick } = setup([watermelon])

    const element = screen.getByRole('button')
    fireEvent.pointerDown(element, touch(10, 100))
    fireEvent.pointerMove(element, touch(100, 100))
    fireEvent.pointerUp(element, touch(120, 100))

    // マウスと同じく 'drop' で通知し、成否は上位（得点0）が判断する
    expect(onFruitClick).toHaveBeenCalledWith(watermelon, 'drop')
  })

  it('りんごのタップはクリックとして収穫される', () => {
    const apple = makeFruit('apple', 5)
    const { onFruitClick } = setup([apple])

    const element = screen.getByRole('button')
    fireEvent.pointerDown(element, touch(10, 10))
    fireEvent.pointerUp(element, touch(10, 10))

    expect(onFruitClick).toHaveBeenCalledWith(apple, 'click')
  })
})
