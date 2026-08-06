import { renderHook, act } from '@testing-library/react'
import { useArcadeMode } from '@/hooks/useArcadeMode'
import { ARCADE_CONFIG } from '@/types/arcade'

describe('useArcadeMode', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function setup(isRunning = true) {
    return renderHook(({ running }) => useArcadeMode(running), {
      initialProps: { running: isRunning },
    })
  }

  describe('コンボ', () => {
    it('初期状態はコンボ0・等倍', () => {
      const { result } = setup()
      expect(result.current.combo).toBe(0)
      expect(result.current.comboMultiplier).toBe(1)
    })

    it('収穫のたびにコンボが増える', () => {
      const { result } = setup()
      act(() => { result.current.registerHarvest() })
      act(() => { result.current.registerHarvest() })
      expect(result.current.combo).toBe(2)
    })

    it('コンボが伸びると倍率が上がる', () => {
      const { result } = setup()
      for (let i = 0; i < 6; i++) {
        act(() => { result.current.registerHarvest() })
      }
      expect(result.current.comboMultiplier).toBe(3)
    })

    it('registerHarvest はその収穫に適用される倍率を返す', () => {
      const { result } = setup()
      let applied: { comboMultiplier: number; isFever: boolean } | undefined
      act(() => { applied = result.current.registerHarvest() })
      expect(applied).toEqual({ comboMultiplier: 1, isFever: false, combo: 1 })
    })

    it('操作ミスでコンボが切れる', () => {
      const { result } = setup()
      act(() => { result.current.registerHarvest() })
      act(() => { result.current.registerHarvest() })
      act(() => { result.current.registerMiss() })
      expect(result.current.combo).toBe(0)
      expect(result.current.comboMultiplier).toBe(1)
    })

    it('一定時間収穫がないとコンボが切れる', () => {
      const { result } = setup()
      act(() => { result.current.registerHarvest() })
      act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.comboTimeoutMs + 200) })
      expect(result.current.combo).toBe(0)
    })

    it('猶予内に収穫を続ければコンボは切れない', () => {
      const { result } = setup()
      act(() => { result.current.registerHarvest() })
      act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.comboTimeoutMs - 500) })
      act(() => { result.current.registerHarvest() })
      act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.comboTimeoutMs - 500) })
      expect(result.current.combo).toBe(2)
    })

    it('最大コンボを記録する', () => {
      const { result } = setup()
      for (let i = 0; i < 4; i++) {
        act(() => { result.current.registerHarvest() })
      }
      act(() => { result.current.registerMiss() })
      expect(result.current.combo).toBe(0)
      expect(result.current.maxCombo).toBe(4)
    })

    it('停止中はコンボのタイムアウトが進まない（ポーズ中に損をしない）', () => {
      const { result, rerender } = setup(true)
      act(() => { result.current.registerHarvest() })
      rerender({ running: false })
      act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.comboTimeoutMs * 3) })
      expect(result.current.combo).toBe(1)
    })
  })

  describe('フィーバー', () => {
    it('初期状態はフィーバーではない', () => {
      const { result } = setup()
      expect(result.current.isFever).toBe(false)
      expect(result.current.feverGauge).toBe(0)
    })

    it('収穫でゲージが溜まる', () => {
      const { result } = setup()
      act(() => { result.current.registerHarvest() })
      expect(result.current.feverGauge).toBeGreaterThan(0)
    })

    it('ゲージが満タンになるとフィーバーに入る', () => {
      const { result } = setup()
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      expect(result.current.isFever).toBe(true)
      expect(result.current.feverCount).toBe(1)
    })

    it('フィーバー中の収穫はフィーバー倍率つきで返る', () => {
      const { result } = setup()
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      let applied: { isFever: boolean } | undefined
      act(() => { applied = result.current.registerHarvest() })
      expect(applied?.isFever).toBe(true)
    })

    it('フィーバーは時間経過で終わる', () => {
      const { result } = setup()
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      expect(result.current.isFever).toBe(true)
      act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.feverDurationMs + 500) })
      expect(result.current.isFever).toBe(false)
      expect(result.current.feverGauge).toBe(0)
    })

    it('フィーバー中はミスしてもフィーバーは終わらない', () => {
      const { result } = setup()
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      act(() => { result.current.registerMiss() })
      expect(result.current.isFever).toBe(true)
    })

    it('フィーバーが終わった後もう一度溜めれば再突入できる', () => {
      const { result } = setup()
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      act(() => { jest.advanceTimersByTime(ARCADE_CONFIG.feverDurationMs + 500) })
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      expect(result.current.isFever).toBe(true)
      expect(result.current.feverCount).toBe(2)
    })
  })

  describe('自己ベストと段位', () => {
    it('初回は自己ベスト0', () => {
      const { result } = setup()
      expect(result.current.best).toBe(0)
    })

    it('スコアを確定するとベストが更新される', () => {
      const { result } = setup()
      let outcome: ReturnType<typeof result.current.commitResult> | undefined
      act(() => { outcome = result.current.commitResult(1200) })
      expect(outcome?.isNewBest).toBe(true)
      expect(outcome?.best).toBe(1200)
      expect(outcome?.rank).toBe('silver')
      expect(result.current.best).toBe(1200)
    })

    it('ベスト未満のスコアではベストが下がらない', () => {
      const { result } = setup()
      act(() => { result.current.commitResult(1200) })
      let outcome: ReturnType<typeof result.current.commitResult> | undefined
      act(() => { outcome = result.current.commitResult(300) })
      expect(outcome?.isNewBest).toBe(false)
      expect(outcome?.best).toBe(1200)
      expect(result.current.best).toBe(1200)
    })

    it('ベストは localStorage に保存される', () => {
      const { result } = setup()
      act(() => { result.current.commitResult(2600) })
      expect(JSON.parse(localStorage.getItem('fruitHarvestArcadeBest') ?? '0')).toBe(2600)
    })

    it('保存済みのベストを読み込む', () => {
      localStorage.setItem('fruitHarvestArcadeBest', '5000')
      const { result } = setup()
      expect(result.current.best).toBe(5000)
      expect(result.current.rank).toBe('platinum')
    })

    it('結果に最大コンボとフィーバー回数が含まれる', () => {
      const { result } = setup()
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      let outcome: ReturnType<typeof result.current.commitResult> | undefined
      act(() => { outcome = result.current.commitResult(900) })
      expect(outcome?.maxCombo).toBe(30)
      expect(outcome?.feverCount).toBe(1)
    })
  })

  describe('リセット', () => {
    it('コンボ・フィーバーを初期化する（ベストは消さない）', () => {
      const { result } = setup()
      act(() => {
        for (let i = 0; i < 30; i++) result.current.registerHarvest()
      })
      act(() => { result.current.commitResult(1500) })
      act(() => { result.current.reset() })

      expect(result.current.combo).toBe(0)
      expect(result.current.maxCombo).toBe(0)
      expect(result.current.feverGauge).toBe(0)
      expect(result.current.isFever).toBe(false)
      expect(result.current.feverCount).toBe(0)
      expect(result.current.best).toBe(1500)
    })
  })
})
