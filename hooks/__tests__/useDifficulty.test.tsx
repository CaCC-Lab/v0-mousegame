import { renderHook, act } from '@testing-library/react'
import { useDifficulty } from '../useDifficulty'

/**
 * useDifficultyの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('useDifficulty', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Initialization', () => {
    it('returns default difficulty on first load', () => {
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.currentDifficulty).toBe('normal')
    })

    it('returns current config for default difficulty', () => {
      const { result } = renderHook(() => useDifficulty())
      const config = result.current.currentConfig
      
      expect(config).toHaveProperty('fruitCount')
      expect(config).toHaveProperty('gameSpeed')
      expect(config).toHaveProperty('timeLimitMultiplier')
      expect(config).toHaveProperty('fruitSpeedMultiplier')
      expect(config).toHaveProperty('scoreMultiplier')
      expect(config).toHaveProperty('description')
      
      // Normal difficulty defaults
      expect(config.fruitCount).toBe(10)
      expect(config.gameSpeed).toBe(1.0)
      expect(config.timeLimitMultiplier).toBe(1.0)
    })

    it('loads saved difficulty from localStorage', () => {
      // 事前に難易度を保存
      localStorage.setItem('fruitHarvestDifficulty', 'hard')
      
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.currentDifficulty).toBe('hard')
    })
  })

  describe('Difficulty Management', () => {
    it('changes difficulty', () => {
      const { result } = renderHook(() => useDifficulty())
      
      act(() => {
        result.current.setDifficulty('hard')
      })
      
      expect(result.current.currentDifficulty).toBe('hard')
      expect(localStorage.getItem('fruitHarvestDifficulty')).toBe('hard')
    })

    it('returns available difficulties', () => {
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.availableDifficulties).toEqual(['easy', 'normal', 'hard'])
    })

    it('returns difficulty descriptions', () => {
      const { result } = renderHook(() => useDifficulty())
      const descriptions = result.current.difficultyDescriptions
      
      expect(descriptions).toHaveProperty('easy')
      expect(descriptions).toHaveProperty('normal')
      expect(descriptions).toHaveProperty('hard')
      
      expect(descriptions.easy).toContain('フルーツが少なく')
      expect(descriptions.normal).toContain('バランス')
      expect(descriptions.hard).toContain('フルーツが多く')
    })
  })

  describe('Adjusted Values', () => {
    it('calculates adjusted game time based on difficulty', () => {
      const { result } = renderHook(() => useDifficulty())
      
      // Normal difficulty (multiplier = 1.0)
      expect(result.current.getAdjustedGameTime(180)).toBe(180)
      
      // Easy difficulty (multiplier = 1.5)
      act(() => {
        result.current.setDifficulty('easy')
      })
      expect(result.current.getAdjustedGameTime(180)).toBe(270)
      
      // Hard difficulty (multiplier = 0.8)
      act(() => {
        result.current.setDifficulty('hard')
      })
      expect(result.current.getAdjustedGameTime(180)).toBe(144)
    })

    it('calculates adjusted score based on difficulty', () => {
      const { result } = renderHook(() => useDifficulty())
      
      // Normal difficulty (multiplier = 1.0)
      expect(result.current.getAdjustedScore(100)).toBe(100)
      
      // Easy difficulty (multiplier = 0.8)
      act(() => {
        result.current.setDifficulty('easy')
      })
      expect(result.current.getAdjustedScore(100)).toBe(80)
      
      // Hard difficulty (multiplier = 1.2)
      act(() => {
        result.current.setDifficulty('hard')
      })
      expect(result.current.getAdjustedScore(100)).toBe(120)
    })
  })

  describe('State Updates', () => {
    it('updates config when difficulty changes', () => {
      const { result } = renderHook(() => useDifficulty())
      
      const normalConfig = result.current.currentConfig
      expect(normalConfig.fruitCount).toBe(10)
      
      act(() => {
        result.current.setDifficulty('easy')
      })
      
      const easyConfig = result.current.currentConfig
      expect(easyConfig.fruitCount).toBe(8)
      expect(easyConfig.gameSpeed).toBe(0.8)
      
      act(() => {
        result.current.setDifficulty('hard')
      })
      
      const hardConfig = result.current.currentConfig
      expect(hardConfig.fruitCount).toBe(12)
      expect(hardConfig.gameSpeed).toBe(1.3)
    })

    it('persists difficulty changes across hook instances', () => {
      const { result: result1 } = renderHook(() => useDifficulty())
      
      act(() => {
        result1.current.setDifficulty('hard')
      })
      
      // 新しいフックインスタンスを作成
      const { result: result2 } = renderHook(() => useDifficulty())
      expect(result2.current.currentDifficulty).toBe('hard')
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid difficulty gracefully', () => {
      localStorage.setItem('fruitHarvestDifficulty', 'invalid')
      
      const { result } = renderHook(() => useDifficulty())
      // デフォルトのnormalに戻る
      expect(result.current.currentDifficulty).toBe('normal')
    })

    it('handles empty localStorage gracefully', () => {
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.currentDifficulty).toBe('normal')
    })
  })
})