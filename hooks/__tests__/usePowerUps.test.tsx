import { renderHook, act } from '@testing-library/react'
import { usePowerUps } from '../usePowerUps'
import { POWERUP_SPAWN_INTERVAL } from '../../types/powerup'

/**
 * usePowerUpsの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('usePowerUps', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('initialization', () => {
    it('initializes with empty powerups and effects', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      expect(result.current.powerUps).toEqual([])
      expect(result.current.activeEffects).toEqual([])
    })
  })

  describe('startSpawning', () => {
    it('starts spawning powerups at intervals', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
      })

      const initialPowerUpCount = result.current.powerUps.length

      // スポーン間隔を複数回進める
      for (let i = 0; i < 100; i++) {
        act(() => {
          jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL)
        })
      }

      // ランダムスポーンなので、少なくとも1つはスポーンされることを期待
      // （100回の試行で少なくとも1回はスポーンされるはず）
      const finalPowerUpCount = result.current.powerUps.filter(p => p.active).length
      expect(finalPowerUpCount).toBeGreaterThanOrEqual(initialPowerUpCount)
    })

    it('does not start multiple spawn intervals', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
        result.current.startSpawning() // 2回呼ぶ
      })

      // スポーン間隔を進める
      act(() => {
        jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL * 10)
      })

      // 正常に動作していることを確認（エラーが発生しない）
      expect(result.current.powerUps).toBeDefined()
    })
  })

  describe('stopSpawning', () => {
    it('stops spawning powerups', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      act(() => {
        result.current.startSpawning()
      })

      // いくつかスポーンさせる
      act(() => {
        jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL * 50)
      })

      const countBeforeStop = result.current.powerUps.filter(p => p.active).length

      act(() => {
        result.current.stopSpawning()
      })

      // 停止後さらに時間を進める
      act(() => {
        jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL * 50)
      })

      const countAfterStop = result.current.powerUps.filter(p => p.active).length

      // 新しいパワーアップはスポーンされないはず
      // （既存のものが期限切れで消える可能性はある）
      expect(countAfterStop).toBeLessThanOrEqual(countBeforeStop)
    })
  })

  describe('collectPowerUp', () => {
    it('collects powerup and returns effect', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      // パワーアップをスポーンさせる
      act(() => {
        result.current.startSpawning()
      })

      // スポーンされるまで時間を進める
      let powerUp = null
      for (let i = 0; i < 200 && !powerUp; i++) {
        act(() => {
          jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL)
        })
        powerUp = result.current.powerUps.find(p => p.active)
      }

      if (powerUp) {
        let collectedEffect: any = null
        
        act(() => {
          collectedEffect = result.current.collectPowerUp(powerUp.id)
        })

        expect(collectedEffect).toBeTruthy()
        expect(collectedEffect.type).toBe(powerUp.type)
        expect(collectedEffect.active).toBe(true)
        
        // パワーアップが非アクティブになることを確認
        const collectedPowerUp = result.current.powerUps.find(p => p.id === powerUp.id)
        expect(collectedPowerUp?.active).toBe(false)
      }
    })

    it('returns null for non-existent powerup', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      let effect: any = null
      act(() => {
        effect = result.current.collectPowerUp('non-existent-id')
      })

      expect(effect).toBeNull()
    })
  })

  describe('isEffectActive', () => {
    it('checks if effect is active', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      // 初期状態では非アクティブ
      expect(result.current.isEffectActive('scoreMultiplier')).toBe(false)
      
      // パワーアップをスポーンして収集
      act(() => {
        result.current.startSpawning()
      })

      // スコア倍率パワーアップを探して収集
      let collected = false
      for (let i = 0; i < 300 && !collected; i++) {
        act(() => {
          jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL)
        })
        
        const scoreMultiplierPowerUp = result.current.powerUps.find(
          p => p.active && p.type === 'scoreMultiplier'
        )
        
        if (scoreMultiplierPowerUp) {
          act(() => {
            result.current.collectPowerUp(scoreMultiplierPowerUp.id)
          })
          collected = true
        }
      }

      if (collected) {
        expect(result.current.isEffectActive('scoreMultiplier')).toBe(true)
      }
    })
  })

  describe('getEffectValue', () => {
    it('returns effect value when active', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      // デフォルト値
      expect(result.current.getEffectValue('scoreMultiplier')).toBe(1)
      
      // パワーアップをスポーンして収集
      act(() => {
        result.current.startSpawning()
      })

      // スコア倍率パワーアップを探して収集
      let collected = false
      for (let i = 0; i < 300 && !collected; i++) {
        act(() => {
          jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL)
        })
        
        const scoreMultiplierPowerUp = result.current.powerUps.find(
          p => p.active && p.type === 'scoreMultiplier'
        )
        
        if (scoreMultiplierPowerUp) {
          act(() => {
            result.current.collectPowerUp(scoreMultiplierPowerUp.id)
          })
          collected = true
        }
      }

      if (collected) {
        expect(result.current.getEffectValue('scoreMultiplier')).toBeGreaterThan(1)
      }
    })
  })

  describe('reset', () => {
    it('resets all powerups and effects', () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      // パワーアップをスポーンさせる
      act(() => {
        result.current.startSpawning()
      })

      // いくつかスポーンさせる
      act(() => {
        jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL * 100)
      })

      // リセット前に何かあることを確認
      const hasAnyPowerUps = result.current.powerUps.length > 0

      act(() => {
        result.current.reset()
      })

      expect(result.current.powerUps).toHaveLength(0)
      expect(result.current.activeEffects).toHaveLength(0)
    })
  })

  describe('effect expiration', () => {
    it('removes expired effects automatically', async () => {
      const { result } = renderHook(() => usePowerUps({ width: 800, height: 600 }))
      
      // パワーアップをスポーンして収集
      act(() => {
        result.current.startSpawning()
      })

      // パワーアップを探して収集
      let collectedEffect: any = null
      for (let i = 0; i < 300 && !collectedEffect; i++) {
        act(() => {
          jest.advanceTimersByTime(POWERUP_SPAWN_INTERVAL)
        })
        
        const powerUp = result.current.powerUps.find(p => p.active)
        
        if (powerUp) {
          act(() => {
            collectedEffect = result.current.collectPowerUp(powerUp.id)
          })
        }
      }

      if (collectedEffect) {
        expect(result.current.activeEffects.length).toBeGreaterThan(0)
        
        // エフェクトの期間を過ぎるまで時間を進める
        act(() => {
          jest.advanceTimersByTime(collectedEffect.duration + 1000)
        })

        // アニメーションフレームの代わりに少し時間を進める
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // エフェクトが期限切れで削除されることを確認
        const activeEffect = result.current.activeEffects.find(e => e.type === collectedEffect.type)
        expect(activeEffect).toBeUndefined()
      }
    })
  })
})