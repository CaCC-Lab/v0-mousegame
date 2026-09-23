import React, { createRef } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { GamePlayArea } from '../GamePlayArea'
import type { Fruit } from '@/types/game'

/**
 * 誤操作では収穫の演出（星のパーティクル・見た目のコンボ）を出さない（docs/game-spec.md §2）。
 *
 * 以前は左クリックでさえあれば、レモンやスイカにも星が飛び、見た目のコンボが伸びていた。
 * 画面は「取れた」と言い、ヒントは「まちがい」と言う食い違いになる。
 */
describe('GamePlayArea: 誤操作の演出', () => {
  const apple: Fruit = { id: 1, type: 'apple', size: 'medium', x: 10, y: 20, dx: 0, dy: 0 }
  const lemon: Fruit = { id: 2, type: 'lemon', size: 'medium', x: 40, y: 20, dx: 0, dy: 0 }

  const setup = () => {
    const props = {
      fruits: [apple, lemon],
      powerUps: [],
      particles: [],
      isHardMode: false,
      selectedFruitIndex: -1,
      onFruitClick: jest.fn(),
      onPowerUpCollect: jest.fn(),
      onTriggerAnimation: jest.fn(),
      onFruitCollected: jest.fn(),
      gameAreaRef: createRef<HTMLDivElement>(),
    }
    const utils = render(<GamePlayArea {...props} />)
    const fruitEl = (id: number) =>
      utils.container.querySelector(`[data-fruit-id="${id}"]`) as HTMLElement
    return { props, fruitEl }
  }

  it('りんごをクリックすると、判定と収穫の演出の両方が出る', () => {
    const { props, fruitEl } = setup()
    fireEvent.click(fruitEl(apple.id), { detail: 1 })

    expect(props.onFruitClick).toHaveBeenCalledWith(apple, 'click')
    expect(props.onTriggerAnimation).toHaveBeenCalledWith('fruitCollect', expect.any(Number), expect.any(Number))
    expect(props.onFruitCollected).toHaveBeenCalledTimes(1)
  })

  it('レモンを左クリック（誤操作）すると、判定には渡すが収穫の演出は出さない', () => {
    const { props, fruitEl } = setup()
    fireEvent.click(fruitEl(lemon.id), { detail: 1 })

    expect(props.onFruitClick).toHaveBeenCalledWith(lemon, 'click')
    expect(props.onTriggerAnimation).not.toHaveBeenCalled()
    expect(props.onFruitCollected).not.toHaveBeenCalled()
  })
})
