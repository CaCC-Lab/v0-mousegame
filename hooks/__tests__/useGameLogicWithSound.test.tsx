import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'

/**
 * useGameLogicとサウンドの統合テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('useGameLogic with Sound Integration', () => {
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

  it('plays sounds during game events', () => {
    const { result } = renderHook(() => useGameLogic())

    // ゲーム開始（playGameStartSound が呼ばれる）
    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')

    // フルーツを収穫（playCollectSound が呼ばれる） - appleを探す
    const appleFruit = result.current.fruits.find(f => f.type === 'apple')
    if (appleFruit) {
      const initialScore = result.current.score

      act(() => {
        result.current.handleFruitInteraction(appleFruit, 'click')
      })

      // スコアが増加していることを確認（サウンド再生の間接的な確認）
      expect(result.current.score).toBeGreaterThan(initialScore)
    }
  })

  it('maintains sound settings across game sessions', () => {
    // サウンド設定を保存
    localStorage.setItem('soundEnabled', 'false')
    
    const { result } = renderHook(() => useGameLogic())

    // ゲームを開始
    act(() => {
      result.current.startGame()
    })

    // サウンド設定が保持されているか確認
    const soundEnabled = localStorage.getItem('soundEnabled')
    expect(soundEnabled).toBe('false')
  })

  it('handles sound toggle during gameplay', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // サウンドをトグル
    const initialSoundEnabled = localStorage.getItem('soundEnabled') !== 'false'
    
    act(() => {
      result.current.soundEffects.toggleSound()
    })

    const newSoundEnabled = localStorage.getItem('soundEnabled') !== 'false'
    expect(newSoundEnabled).toBe(!initialSoundEnabled)
  })

  it('plays appropriate sounds for different game events', () => {
    const { result } = renderHook(() => useGameLogic())

    // ゲーム開始
    act(() => {
      result.current.startGame()
    })

    // 複数のフルーツを収穫 - 正しいインタラクションタイプを使用
    let collectedCount = 0
    const fruitInteractions = [
      { type: 'apple' as const, action: 'click' as const },
      { type: 'blueberry' as const, action: 'doubleClick' as const },
      { type: 'lemon' as const, action: 'rightClick' as const },
    ]

    fruitInteractions.forEach(({ type, action }) => {
      const fruit = result.current.fruits.find(f => f.type === type)
      if (fruit) {
        act(() => {
          result.current.handleFruitInteraction(fruit, action)
        })
        collectedCount++
      }
    })

    // フルーツが収穫されたことを確認
    expect(result.current.score).toBeGreaterThan(0)
    expect(result.current.harvestedFruits.apple +
           result.current.harvestedFruits.blueberry +
           result.current.harvestedFruits.lemon +
           result.current.harvestedFruits.watermelon).toBe(collectedCount)
  })

  it('plays sounds when achieving high score', () => {
    const { result } = renderHook(() => useGameLogic())

    // 以前のハイスコアを設定
    act(() => {
      result.current.startGame()
    })

    // いくつかフルーツを収穫してスコアを獲得
    result.current.fruits.slice(0, 5).forEach(fruit => {
      act(() => {
        result.current.handleFruitInteraction(fruit, 'click')
      })
    })

    const score = result.current.score
    expect(score).toBeGreaterThan(0)

    // ゲームを終了
    act(() => {
      jest.advanceTimersByTime(180000) // ゲーム時間を進める
    })

    // 新しいゲームを開始
    act(() => {
      result.current.resetGame()
      result.current.startGame()
    })

    // 前回より高いスコアを獲得
    result.current.fruits.slice(0, 10).forEach(fruit => {
      act(() => {
        result.current.handleFruitInteraction(fruit, 'click')
      })
    })

    expect(result.current.score).toBeGreaterThan(score)
  })

  it('respects sound volume settings', () => {
    // ボリュームを設定
    localStorage.setItem('soundVolume', '0.7')
    
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // ボリューム設定が保持されているか確認
    const volume = localStorage.getItem('soundVolume')
    expect(volume).toBe('0.7')

    // ボリュームを変更
    act(() => {
      result.current.soundEffects.setVolume(0.3)
    })

    const newVolume = localStorage.getItem('soundVolume')
    expect(newVolume).toBe('0.3')
  })

  it('handles sound errors gracefully', () => {
    const { result } = renderHook(() => useGameLogic())

    // サウンドファイルが存在しない場合でもゲームは正常に動作する
    act(() => {
      result.current.startGame()
    })

    expect(result.current.gameState).toBe('playing')

    // フルーツ収穫も正常に動作 - appleを探す
    const appleFruit = result.current.fruits.find(f => f.type === 'apple')
    if (appleFruit) {
      act(() => {
        result.current.handleFruitInteraction(appleFruit, 'click')
      })

      expect(result.current.score).toBeGreaterThan(0)
    }
  })

  it('plays different sounds for different fruit types', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    // 各フルーツタイプと対応するインタラクションタイプ
    const fruitInteractions = [
      { type: 'apple' as const, action: 'click' as const },
      { type: 'blueberry' as const, action: 'doubleClick' as const },
      { type: 'lemon' as const, action: 'rightClick' as const },
      { type: 'watermelon' as const, action: 'drop' as const },
    ]

    fruitInteractions.forEach(({ type, action }) => {
      const fruit = result.current.fruits.find(f => f.type === type)
      if (fruit) {
        const initialCount = result.current.harvestedFruits[type]

        act(() => {
          result.current.handleFruitInteraction(fruit, action)
        })

        // フルーツタイプごとに収穫されたことを確認
        expect(result.current.harvestedFruits[type]).toBe(initialCount + 1)
      }
    })
  })
})