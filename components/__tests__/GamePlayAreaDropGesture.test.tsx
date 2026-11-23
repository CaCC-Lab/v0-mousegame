import React, { createRef } from 'react'
import { render, screen, fireEvent, createEvent } from '@testing-library/react'
import { GamePlayArea } from '../game/GamePlayArea'
import type { Fruit } from '@/types/game'

/**
 * スイカのドラッグ＆ドロップの判定（docs/game-spec.md §2）。
 * jsdom の getBoundingClientRect は 0 なので、ドロップエリアは (0,0) の1点だけ。
 *
 * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
 * |---|---|---|---|---|
 * | DG-N-01 | 20px 動かして畑の中（エリア外）で離す | Equivalence – normal | drop のミスを1回だけ | - |
 * | DG-N-02 | 動かさずにエリアの中で離す | Equivalence – normal | drop の成功 | 既存どおり |
 * | DG-A-01 | 動かさずにクリック | クリックとの区別 | click の1回だけ（drop のミスは数えない） | 1回の操作で2回ミスにしない |
 * | DG-B-01 | 7px 動かして離す | Boundary – しきい値-1 | drop は数えない | しきい値 8px |
 * | DG-B-02 | 8px 動かして離す | Boundary – しきい値 | drop のミス | - |
 * | DG-A-02 | 畑の外で離す | 外で離す | その場で drop のミス。あとで畑の中で離しても数えない | 古いドラッグを持ち越さない |
 * | DG-A-03 | タッチでスイカを動かさずにタップ | タッチ | drop のミスは数えない | - |
 * | DG-A-04 | タッチで 20px なぞって離す | タッチ | drop のミス | - |
 */
const watermelon: Fruit = { id: 1, type: 'watermelon', size: 'medium', x: 20, y: 20, dx: 0, dy: 0 }

function renderArea() {
  const onFruitClick = jest.fn()
  render(
    <GamePlayArea
      fruits={[watermelon]}
      powerUps={[]}
      particles={[]}
      isHardMode={false}
      selectedFruitIndex={-1}
      onFruitClick={onFruitClick}
      onPowerUpCollect={jest.fn()}
      onTriggerAnimation={jest.fn()}
      onFruitCollected={jest.fn()}
      gameAreaRef={createRef<HTMLDivElement>()}
    />
  )
  const area = screen.getByTestId('game-area')
  const node = area.querySelector('[data-fruit-id="1"]') as HTMLElement
  return { onFruitClick, area, node }
}

const dropCalls = (fn: jest.Mock) => fn.mock.calls.filter(c => c[1] === 'drop')

function touch(kind: 'pointerDown' | 'pointerUp', target: Element, x: number, y: number) {
  const ev = createEvent[kind](target)
  Object.defineProperty(ev, 'pointerType', { value: 'touch' })
  Object.defineProperty(ev, 'clientX', { value: x })
  Object.defineProperty(ev, 'clientY', { value: y })
  fireEvent(target, ev)
}

describe('GamePlayArea: スイカのドロップ判定', () => {
  it('DG-N-01: 動かしてエリアの外で離すと、drop のミスを1回だけ数える', () => {
    // Given: スイカ When: (100,100) で押して (120,100) で離す
    const { onFruitClick, area, node } = renderArea()
    fireEvent.mouseDown(node, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(area, { clientX: 120, clientY: 100 })
    // Then: missedTarget つき drop が1回
    expect(dropCalls(onFruitClick)).toEqual([[expect.objectContaining({ id: 1 }), 'drop', { missedTarget: true }]])
  })

  it('DG-N-02: エリアの中で離すと成功', () => {
    // Given: スイカ When: エリア (0,0) で押して離す Then: 成功の drop
    const { onFruitClick, area, node } = renderArea()
    fireEvent.mouseDown(node, { button: 0, clientX: 0, clientY: 0 })
    fireEvent.mouseUp(area, { clientX: 0, clientY: 0 })
    expect(dropCalls(onFruitClick)).toEqual([[expect.objectContaining({ id: 1 }), 'drop']])
  })

  it('DG-A-01: 動かさずにクリックしたら click だけ（drop のミスは数えない）', () => {
    // Given: スイカ When: 同じ場所で押して離してクリック
    const { onFruitClick, node } = renderArea()
    fireEvent.mouseDown(node, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(node, { clientX: 100, clientY: 100 })
    fireEvent.click(node, { clientX: 100, clientY: 100 })
    // Then: click の1回だけ
    expect(onFruitClick.mock.calls).toEqual([[expect.objectContaining({ id: 1 }), 'click']])
  })

  it('DG-B-01: 7px しか動かさずに離したら drop は数えない', () => {
    // Given: スイカ When: 7px 動かして離す Then: drop なし
    const { onFruitClick, area, node } = renderArea()
    fireEvent.mouseDown(node, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(area, { clientX: 107, clientY: 100 })
    expect(dropCalls(onFruitClick)).toHaveLength(0)
  })

  it('DG-B-02: 8px 動かして離したら drop のミス', () => {
    // Given: スイカ When: 8px 動かして離す Then: ミスの drop
    const { onFruitClick, area, node } = renderArea()
    fireEvent.mouseDown(node, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(area, { clientX: 108, clientY: 100 })
    expect(dropCalls(onFruitClick)).toEqual([[expect.objectContaining({ id: 1 }), 'drop', { missedTarget: true }]])
  })

  it('DG-A-02: 畑の外で離したら、その場でミスにして、ドラッグを持ち越さない', () => {
    // Given: スイカを持った When: 畑の外（window）で離す
    const { onFruitClick, area, node } = renderArea()
    fireEvent.mouseDown(node, { button: 0, clientX: 100, clientY: 100 })
    fireEvent.mouseUp(window, { clientX: 2000, clientY: 100 })
    // Then: その場で1回ミス
    expect(dropCalls(onFruitClick)).toEqual([[expect.objectContaining({ id: 1 }), 'drop', { missedTarget: true }]])
    // When: あとで畑の中で離す Then: もう数えない
    fireEvent.mouseUp(area, { clientX: 300, clientY: 100 })
    expect(dropCalls(onFruitClick)).toHaveLength(1)
  })

  it('DG-A-03: タッチで動かさずにタップしても drop のミスは数えない', () => {
    // Given: スイカ When: 同じ場所でタッチして離す Then: drop なし
    const { onFruitClick, node } = renderArea()
    touch('pointerDown', node, 100, 100)
    touch('pointerUp', node, 100, 100)
    expect(dropCalls(onFruitClick)).toHaveLength(0)
  })

  it('DG-A-04: タッチで 20px なぞって離すと drop のミス', () => {
    // Given: スイカ When: タッチで 20px 動かして離す Then: ミスの drop
    const { onFruitClick, area, node } = renderArea()
    touch('pointerDown', node, 100, 100)
    touch('pointerUp', area, 120, 100)
    expect(dropCalls(onFruitClick)).toEqual([[expect.objectContaining({ id: 1 }), 'drop', { missedTarget: true }]])
  })
})
