import React from 'react'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { Fruit } from '../Fruit'
import { Fruit as FruitType } from '@/types/game'
import { MOUSE_CONFIG } from '@/lib/touchGestures'

/**
 * マウスのダブルクリックの途中のクリックを、ミスとして数えない（v1.1 計画 G1、仕様 docs/game-spec.md §2）。
 *
 * ブラウザはダブルクリックのとき click(detail=1) → click(detail=2) → dblclick の順に発火する。
 * 以前は2回の click がそれぞれ「ブルーベリーにクリック＝ミス」として判定され、
 * 正しくダブルクリックした子に「ブルーベリーはダブルクリックだよ！」が出て、連続・コンボが切れていた。
 */
describe('Fruit: マウスのダブルクリック判別', () => {
  const base: FruitType = { id: 1, type: 'blueberry', size: 'medium', x: 50, y: 50, dx: 0, dy: 0 }

  const handlers = () => ({
    onClick: jest.fn(),
    onDoubleClick: jest.fn(),
    onMouseDown: jest.fn(),
  })

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  /** ブラウザが実際に出すダブルクリックのイベント列 */
  const realDoubleClick = (el: HTMLElement) => {
    fireEvent.click(el, { detail: 1 })
    fireEvent.click(el, { detail: 2 })
    fireEvent.doubleClick(el, { detail: 2 })
  }

  it('ブルーベリーを正しくダブルクリックすると、クリックは1回も通知されずダブルクリックが1回通知される', () => {
    const h = handlers()
    render(<Fruit fruit={base} {...h} />)

    realDoubleClick(screen.getByRole('button'))
    act(() => {
      jest.advanceTimersByTime(MOUSE_CONFIG.doubleClickWaitMs + 50)
    })

    expect(h.onDoubleClick).toHaveBeenCalledTimes(1)
    expect(h.onClick).not.toHaveBeenCalled()
  })

  it('ブルーベリーを1回だけクリックすると、待ち時間のあとにクリック（＝ミス）として1回通知される', () => {
    const h = handlers()
    render(<Fruit fruit={base} {...h} />)

    fireEvent.click(screen.getByRole('button'), { detail: 1 })
    expect(h.onClick).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(MOUSE_CONFIG.doubleClickWaitMs + 50)
    })
    expect(h.onClick).toHaveBeenCalledTimes(1)
    expect(h.onDoubleClick).not.toHaveBeenCalled()
  })

  it('待ち時間は OS の標準的なダブルクリック間隔（500ms）より短くしない', () => {
    // 短いと、ゆっくりダブルクリックする子の1回目が先にミスとして確定してしまう
    expect(MOUSE_CONFIG.doubleClickWaitMs).toBeGreaterThanOrEqual(500)
  })

  it('りんごのクリックは待たずにすぐ通知される', () => {
    const h = handlers()
    render(<Fruit fruit={{ ...base, type: 'apple' }} {...h} />)

    fireEvent.click(screen.getByRole('button'), { detail: 1 })
    expect(h.onClick).toHaveBeenCalledTimes(1)
  })

  it('クリック保留中に消えた（アンマウントされた）ブルーベリーは、あとからクリックを通知しない', () => {
    const h = handlers()
    const { unmount } = render(<Fruit fruit={base} {...h} />)

    fireEvent.click(screen.getByRole('button'), { detail: 1 })
    unmount()
    act(() => {
      jest.advanceTimersByTime(MOUSE_CONFIG.doubleClickWaitMs + 50)
    })
    expect(h.onClick).not.toHaveBeenCalled()
  })
})
