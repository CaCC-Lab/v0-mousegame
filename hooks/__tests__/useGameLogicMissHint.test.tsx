import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'
import type { Fruit } from '../../types/game'

/**
 * 誤操作したときに正解の操作を伝える（プレイテストの離脱要因）。
 *
 * 初見プレイヤーがブルーベリーを右クリックして0点になり、
 * 「正解が何か一切出ない」ことを理由に25秒で離脱した。
 * 誤操作の瞬間に、何をすればよかったのかを画面へ出せるようにする。
 */
describe('useGameLogic 誤操作のヒント', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers() })
    jest.useRealTimers()
  })

  const startAndGetFruit = (result: { current: ReturnType<typeof useGameLogic> }): Fruit => {
    act(() => { result.current.startGame() })
    return result.current.fruits[0]
  }

  it('はじめはヒントを出さない', () => {
    const { result } = renderHook(() => useGameLogic())

    expect(result.current.missHint).toBeNull()
  })

  it('誤った操作をすると、そのフルーツと正解の操作を伝える', () => {
    const { result } = renderHook(() => useGameLogic())
    const fruit = startAndGetFruit(result)

    // ブルーベリーはダブルクリックが正解。右クリックは誤り
    const blueberry: Fruit = { ...fruit, type: 'blueberry' }
    act(() => { result.current.handleFruitInteraction(blueberry, 'rightClick') })

    expect(result.current.missHint).toMatchObject({
      fruitType: 'blueberry',
      requiredAction: 'doubleClick',
    })
  })

  it('正しい操作ではヒントを出さない', () => {
    const { result } = renderHook(() => useGameLogic())
    const fruit = startAndGetFruit(result)

    const apple: Fruit = { ...fruit, type: 'apple' }
    act(() => { result.current.handleFruitInteraction(apple, 'click') })

    expect(result.current.missHint).toBeNull()
  })

  it('正しく取り直すとヒントは消える', () => {
    const { result } = renderHook(() => useGameLogic())
    const fruit = startAndGetFruit(result)

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'lemon' }, 'click') })
    expect(result.current.missHint).not.toBeNull()

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'apple' }, 'click') })
    expect(result.current.missHint).toBeNull()
  })

  it('続けて間違えると、そのつど最新のヒントに入れ替わる', () => {
    const { result } = renderHook(() => useGameLogic())
    const fruit = startAndGetFruit(result)

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'lemon' }, 'click') })
    expect(result.current.missHint?.requiredAction).toBe('rightClick')

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'watermelon' }, 'click') })
    expect(result.current.missHint?.requiredAction).toBe('drop')
  })

  it('同じ間違いを繰り返しても表示し直せる', () => {
    // 同じ内容だと state が変わらず再表示されないため、識別子で区別する
    const { result } = renderHook(() => useGameLogic())
    const fruit = startAndGetFruit(result)

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'lemon' }, 'click') })
    const first = result.current.missHint

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'lemon' }, 'click') })

    expect(result.current.missHint?.id).not.toBe(first?.id)
  })

  it('時間切れでゲームが終わるとヒントも消える', () => {
    // 遊び終わって待機画面に戻ったあとまで、直前の失敗が残り続けないようにする
    const { result } = renderHook(() => useGameLogic())
    const fruit = startAndGetFruit(result)

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'lemon' }, 'click') })
    expect(result.current.missHint).not.toBeNull()

    act(() => { jest.advanceTimersByTime(70_000) })

    expect(result.current.gameState).toBe('idle')
    expect(result.current.missHint).toBeNull()
  })

  it('ゲームをリセットするとヒントも消える', () => {
    const { result } = renderHook(() => useGameLogic())
    const fruit = startAndGetFruit(result)

    act(() => { result.current.handleFruitInteraction({ ...fruit, type: 'lemon' }, 'click') })
    expect(result.current.missHint).not.toBeNull()

    act(() => { result.current.resetGame() })
    expect(result.current.missHint).toBeNull()
  })
})
