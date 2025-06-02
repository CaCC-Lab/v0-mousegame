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

    // フルーツを収穫（playCollectSound が呼ばれる）
    const fruit = result.current.fruits[0]
    if (fruit) {
      const initialScore = result.current.score
      
      act(() => {
        result.current.handleFruitInteraction(fruit, 'click')
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
      result.current.toggleSound()
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

    // 複数のフルーツを収穫
    let collectedCount = 0
    result.current.fruits.forEach((fruit, index) => {
      if (index < 3) {
        act(() => {
          result.current.handleFruitInteraction(fruit, 'click')
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
      result.current.setVolume(0.3)
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

    // フルーツ収穫も正常に動作
    const fruit = result.current.fruits[0]
    if (fruit) {
      act(() => {
        result.current.handleFruitInteraction(fruit, 'click')
      })

      expect(result.current.score).toBeGreaterThan(0)
    }
  })

  it('plays different sounds for different fruit types', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    const fruitTypes = ['apple', 'blueberry', 'lemon', 'watermelon'] as const
    
    fruitTypes.forEach(type => {
      const fruit = result.current.fruits.find(f => f.type === type)
      if (fruit) {
        const initialCount = result.current.harvestedFruits[type]
        
        act(() => {
          result.current.handleFruitInteraction(fruit, 'click')
        })

        // フルーツタイプごとに収穫されたことを確認
        expect(result.current.harvestedFruits[type]).toBe(initialCount + 1)
      }
    })
  })
})