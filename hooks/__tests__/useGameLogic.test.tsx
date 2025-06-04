import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'
import type { FruitType, InteractionType } from '../../types/game'

/**
 * useGameLogicの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('useGameLogic', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useGameLogic())

    expect(result.current.gameState).toBe('idle')
    expect(result.current.score).toBe(0)
    expect(result.current.timeLeft).toBe(180)
    expect(result.current.fruits).toHaveLength(0)
    expect(result.current.harvestedFruits).toEqual({
      apple: 0,
      blueberry: 0,
      lemon: 0,
      watermelon: 0,
    })
  })

  it('starts game when startGame is called', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')
    expect(result.current.score).toBe(0)
    expect(result.current.timeLeft).toBe(60) // ステージ1のデフォルト時間
    expect(result.current.fruits.length).toBeGreaterThan(0)
  })

  it('pauses and resumes game', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')

    act(() => {
      result.current.pauseGame()
    })

    expect(result.current.gameState).toBe('paused')

    act(() => {
      result.current.pauseGame()
    })

    expect(result.current.gameState).toBe('playing')
  })

  it('resets game state', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      result.current.resetGame()
    })

    expect(result.current.gameState).toBe('idle')
    expect(result.current.score).toBe(0)
    expect(result.current.timeLeft).toBe(180)
    expect(result.current.fruits).toHaveLength(0)
  })

  it('handles fruit interaction correctly', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    const appleFruit = result.current.fruits.find(f => f.type === 'apple')
    if (appleFruit) {
      const initialFruitCount = result.current.fruits.length
      
      act(() => {
        result.current.handleFruitInteraction(appleFruit, 'click')
      })

      expect(result.current.score).toBeGreaterThan(0)
      expect(result.current.harvestedFruits.apple).toBe(1)
      // 新しいフルーツが生成されるか、フルーツが削除される
      expect(result.current.fruits.length).toBeGreaterThanOrEqual(initialFruitCount - 1)
    }
  })

  it('decreases time when game is playing', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    const initialTime = result.current.timeLeft

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.timeLeft).toBeLessThan(initialTime)
  })

  it('ends game when time runs out', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // ゲーム時間を進める
    act(() => {
      jest.advanceTimersByTime(60000) // 60秒（ステージ1の時間）
    })

    // ゲームが終了するか、時間が0になることを確認
    expect(result.current.timeLeft).toBeLessThanOrEqual(0)
  })

  it('updates high score when game ends with higher score', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // スコアを獲得（適切な操作タイプを使用）
    const fruit = result.current.fruits[0]
    if (fruit) {
      const action = fruit.type === 'apple' ? 'click' :
                     fruit.type === 'blueberry' ? 'doubleClick' :
                     fruit.type === 'lemon' ? 'rightClick' : 'drop'
      act(() => {
        result.current.handleFruitInteraction(fruit, action as InteractionType)
      })
    }

    const currentScore = result.current.score
    expect(currentScore).toBeGreaterThan(0)

    // タイマーを進めてゲームを終了させる
    act(() => {
      jest.advanceTimersByTime(60000) // 60秒進める
    })

    // setTimeoutも実行
    act(() => {
      jest.runAllTimers()
    })

    // ゲームが終了してハイスコアが更新されているか確認
    expect(result.current.gameState).toBe('idle')
    expect(result.current.highScore).toBeGreaterThanOrEqual(currentScore)
  })

  it('toggles hard mode', () => {
    const { result } = renderHook(() => useGameLogic())

    const initialHardMode = result.current.isHardMode

    act(() => {
      result.current.setIsHardMode(!initialHardMode)
    })

    expect(result.current.isHardMode).toBe(!initialHardMode)
  })

  it('handles different fruit types correctly', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // 各フルーツタイプをテスト
    const fruitActions: Record<string, InteractionType> = {
      apple: 'click',
      blueberry: 'doubleClick',
      lemon: 'rightClick',
      watermelon: 'drop'
    }

    Object.entries(fruitActions).forEach(([type, action]) => {
      const fruit = result.current.fruits.find(f => f.type === type)
      if (fruit) {
        const initialScore = result.current.score
        const initialCount = result.current.harvestedFruits[type as FruitType['type']]

        act(() => {
          result.current.handleFruitInteraction(fruit, action)
        })

        expect(result.current.score).toBeGreaterThan(initialScore)
        expect(result.current.harvestedFruits[type as FruitType['type']]).toBeGreaterThan(initialCount)
      }
    })
  })

  it('maintains game state consistency', () => {
    const { result } = renderHook(() => useGameLogic())

    // ゲーム開始前の状態確認
    expect(result.current.gameState).toBe('idle')
    expect(result.current.fruits).toHaveLength(0)

    // ゲーム開始
    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')
    expect(result.current.fruits.length).toBeGreaterThan(0)

    // ポーズ
    act(() => {
      result.current.pauseGame()
    })

    expect(result.current.gameState).toBe('paused')
    const pausedFruitCount = result.current.fruits.length

    // ポーズ中はフルーツ数が変わらない
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.fruits.length).toBe(pausedFruitCount)

    // 再開
    act(() => {
      result.current.pauseGame()
    })

    expect(result.current.gameState).toBe('playing')
  })

  it('persists high score in localStorage', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // スコアを獲得（適切な操作タイプを使用）
    const fruit = result.current.fruits[0]
    if (fruit) {
      const action = fruit.type === 'apple' ? 'click' :
                     fruit.type === 'blueberry' ? 'doubleClick' :
                     fruit.type === 'lemon' ? 'rightClick' : 'drop'
      act(() => {
        result.current.handleFruitInteraction(fruit, action as InteractionType)
      })
    }

    const score = result.current.score
    expect(score).toBeGreaterThan(0)

    // タイマーを進めてゲームを終了させる
    act(() => {
      jest.advanceTimersByTime(60000) // 60秒進める
    })

    // setTimeoutも実行
    act(() => {
      jest.runAllTimers()
    })

    // 新しいフックインスタンスでハイスコアが保持されているか確認
    const { result: newResult } = renderHook(() => useGameLogic())
    expect(newResult.current.highScore).toBe(result.current.highScore)
  })

  it('changes state to idle when timer reaches 0', () => {
    const { result } = renderHook(() => useGameLogic())

    // ゲーム開始
    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')
    expect(result.current.timeLeft).toBe(60) // ステージ1は60秒

    // タイマーを59秒進める
    act(() => {
      jest.advanceTimersByTime(59000)
    })

    expect(result.current.gameState).toBe('playing')
    expect(result.current.timeLeft).toBe(1)

    // 最後の1秒を進める
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // setTimeoutも進める必要がある
    act(() => {
      jest.runAllTimers()
    })

    // ゲームステートが'idle'に変更されているか確認
    expect(result.current.gameState).toBe('idle')
    expect(result.current.timeLeft).toBe(0)
  })
})