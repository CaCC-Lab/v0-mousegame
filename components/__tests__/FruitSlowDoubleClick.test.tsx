import React from 'react'
import { render, fireEvent, createEvent, screen, act } from '@testing-library/react'
import { Fruit } from '../Fruit'
import { Fruit as FruitType } from '@/types/game'
import { DOUBLE_CLICK_SPEEDS } from '@/lib/touchGestures'

/**
 * ゆっくりダブルクリック（docs/game-spec.md §2）。
 * OS のダブルクリック間隔より遅い2回目は、ブラウザでは detail=1 の click が2回届くだけになる。
 * 待ち時間のあいだに2回目のクリックが来たら、detail に関係なくダブルクリックとして数える。
 *
 * | Case ID | Input | Perspective | Expected |
 * |---|---|---|---|
 * | FS-N-01 | slow、800ms 間隔で detail=1 を2回 | normal | ダブルクリック1回、クリック0回 |
 * | FS-N-02 | verySlow、1300ms 間隔 | normal | ダブルクリック1回 |
 * | FS-N-03 | slow、ブラウザのダブルクリック（detail=2 + dblclick） | normal | ダブルクリック1回（二重に数えない） |
 * | FS-A-01 | normal、800ms 間隔 | Boundary – 窓の外 | クリック（ミス）2回 |
 * | FS-A-02 | slow、1回だけ | Boundary – 2回目なし | 900ms 後にクリック1回、899ms では0回 |
 * | FS-A-03 | slow、窓 +1ms で2回目 | Boundary – +1 | クリック2回 |
 * | FS-A-04 | タッチ slow、500ms 間隔 | normal | ダブルクリック1回（タッチも同じ設定） |
 * | FS-A-05 | りんご、slow | Equivalence | 待たずにクリック |
 * | FS-A-06 | 止まったまま normal→slow に変更 | 設定の変更（別タブ） | 新しい窓で判定 |
 */
describe('Fruit: ゆっくりダブルクリック', () => {
  const base: FruitType = { id: 1, type: 'blueberry', size: 'medium', x: 50, y: 50, dx: 0, dy: 0 }
  const handlers = () => ({ onClick: jest.fn(), onDoubleClick: jest.fn(), onMouseDown: jest.fn() })
  const slow = DOUBLE_CLICK_SPEEDS.slow.mouseWaitMs

  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  // jsdom の PointerEvent には pointerType が無いので、タッチとして足す
  const touch = (el: HTMLElement, kind: 'pointerDown' | 'pointerUp') => {
    const event = createEvent[kind](el, { clientX: 0, clientY: 0 })
    Object.defineProperty(event, 'pointerType', { value: 'touch' })
    fireEvent(el, event)
  }

  const clickTwice = (el: HTMLElement, gapMs: number) => {
    fireEvent.click(el, { detail: 1 })
    act(() => { jest.advanceTimersByTime(gapMs) })
    fireEvent.click(el, { detail: 1 })
    act(() => { jest.advanceTimersByTime(3000) })
  }

  it('FS-N-01: ゆっくりでは、800ms 空いた2回のクリックをダブルクリックにする', () => {
    // Given: slow When: 800ms 間隔で2回クリック Then: ダブルクリック1回だけ
    const h = handlers()
    render(<Fruit fruit={base} doubleClickSpeed="slow" {...h} />)
    clickTwice(screen.getByRole('button'), 800)
    expect(h.onDoubleClick).toHaveBeenCalledTimes(1)
    expect(h.onClick).not.toHaveBeenCalled()
  })

  it('FS-N-02: もっとゆっくりでは、1300ms 空いてもダブルクリック', () => {
    // Given: verySlow When: 1300ms 間隔 Then: ダブルクリック1回
    const h = handlers()
    render(<Fruit fruit={base} doubleClickSpeed="verySlow" {...h} />)
    clickTwice(screen.getByRole('button'), 1300)
    expect(h.onDoubleClick).toHaveBeenCalledTimes(1)
    expect(h.onClick).not.toHaveBeenCalled()
  })

  it('FS-N-03: ゆっくりでも、ブラウザのダブルクリックは1回だけ数える', () => {
    // Given: slow When: click(1)→click(2)→dblclick Then: ダブルクリック1回
    const h = handlers()
    render(<Fruit fruit={base} doubleClickSpeed="slow" {...h} />)
    const el = screen.getByRole('button')
    fireEvent.click(el, { detail: 1 })
    fireEvent.click(el, { detail: 2 })
    fireEvent.doubleClick(el, { detail: 2 })
    act(() => { jest.advanceTimersByTime(3000) })
    expect(h.onDoubleClick).toHaveBeenCalledTimes(1)
    expect(h.onClick).not.toHaveBeenCalled()
  })

  it('FS-A-01: ふつうでは、800ms 空いた2回はクリック2回（ミス）', () => {
    // Given: 指定なし（ふつう） When: 800ms 間隔 Then: クリック2回
    const h = handlers()
    render(<Fruit fruit={base} {...h} />)
    clickTwice(screen.getByRole('button'), 800)
    expect(h.onClick).toHaveBeenCalledTimes(2)
    expect(h.onDoubleClick).not.toHaveBeenCalled()
  })

  it('FS-A-02: ゆっくりで1回だけなら、待ち時間ちょうどでクリック', () => {
    // Given: slow When: 1回クリック Then: 待ち時間 -1ms では未確定、ちょうどでクリック1回
    const h = handlers()
    render(<Fruit fruit={base} doubleClickSpeed="slow" {...h} />)
    fireEvent.click(screen.getByRole('button'), { detail: 1 })
    act(() => { jest.advanceTimersByTime(slow - 1) })
    expect(h.onClick).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(1) })
    expect(h.onClick).toHaveBeenCalledTimes(1)
  })

  it('FS-A-03: ゆっくりでも、待ち時間 +1ms 後の2回目は別のクリック', () => {
    // Given: slow When: 待ち時間 +1ms 間隔で2回 Then: クリック2回
    const h = handlers()
    render(<Fruit fruit={base} doubleClickSpeed="slow" {...h} />)
    clickTwice(screen.getByRole('button'), slow + 1)
    expect(h.onClick).toHaveBeenCalledTimes(2)
    expect(h.onDoubleClick).not.toHaveBeenCalled()
  })

  it('FS-A-04: タッチのダブルタップも、ゆっくりの窓で判定する', () => {
    // Given: slow、タッチ When: 500ms 間隔で2回タップ Then: ダブルクリック1回
    const h = handlers()
    const now = jest.spyOn(Date, 'now')
    render(<Fruit fruit={base} doubleClickSpeed="slow" {...h} />)
    const el = screen.getByRole('button')
    now.mockReturnValue(10_000)
    touch(el, 'pointerDown')
    touch(el, 'pointerUp')
    now.mockReturnValue(10_500)
    act(() => { jest.advanceTimersByTime(500) })
    touch(el, 'pointerDown')
    touch(el, 'pointerUp')
    act(() => { jest.advanceTimersByTime(3000) })
    now.mockRestore()
    expect(h.onDoubleClick).toHaveBeenCalledTimes(1)
    expect(h.onClick).not.toHaveBeenCalled()
  })

  it('FS-A-05: りんごはゆっくりでも待たない', () => {
    // Given: slow、りんご When: クリック Then: すぐクリック
    const h = handlers()
    render(<Fruit fruit={{ ...base, type: 'apple' }} doubleClickSpeed="slow" {...h} />)
    fireEvent.click(screen.getByRole('button'), { detail: 1 })
    expect(h.onClick).toHaveBeenCalledTimes(1)
  })

  it('FS-A-06: 止まったままの果物も、設定を変えたら新しい待ち時間で判定する', () => {
    // Given: normal で描画した止まっているブルーベリー
    const h = handlers()
    const { rerender } = render(<Fruit fruit={base} doubleClickSpeed="normal" {...h} />)
    // When: 位置は同じまま slow に変え、800ms 間隔で2回クリック
    rerender(<Fruit fruit={base} doubleClickSpeed="slow" {...h} />)
    clickTwice(screen.getByRole('button'), 800)
    // Then: ダブルクリック1回
    expect(h.onDoubleClick).toHaveBeenCalledTimes(1)
    expect(h.onClick).not.toHaveBeenCalled()
  })
})
