import { renderHook, act } from '@testing-library/react'
import { useDifficulty } from '../useDifficulty'
import { DifficultyManager } from '../../lib/difficultyManager'

jest.mock('../../lib/difficultyManager')

describe('useDifficulty', () => {
  let mockDifficultyManager: jest.Mocked<DifficultyManager>

  beforeEach(() => {
    mockDifficultyManager = {
      getCurrentDifficulty: jest.fn().mockReturnValue('normal'),
      setDifficulty: jest.fn(),
      getCurrentConfig: jest.fn().mockReturnValue({
        fruitCount: 10,
        gameSpeed: 1.0,
        timeLimitMultiplier: 1.0,
        fruitSpeedMultiplier: 1.0,
        scoreMultiplier: 1.0,
        description: 'バランスの取れた標準的な難易度です',
      }),
      getAdjustedGameTime: jest.fn().mockReturnValue(180),
      getAdjustedScore: jest.fn().mockReturnValue(100),
      getAvailableDifficulties: jest.fn().mockReturnValue(['easy', 'normal', 'hard']),
      getDifficultyDescriptions: jest.fn().mockReturnValue({
        easy: 'フルーツが少なく、時間に余裕があります',
        normal: 'バランスの取れた標準的な難易度です',
        hard: 'フルーツが多く、時間制限が厳しくなります',
      }),
    } as any

    ;(DifficultyManager as jest.MockedClass<typeof DifficultyManager>).mockImplementation(() => mockDifficultyManager)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should create difficulty manager instance', () => {
      renderHook(() => useDifficulty())
      expect(DifficultyManager).toHaveBeenCalledTimes(1)
    })

    it('should return current difficulty', () => {
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.currentDifficulty).toBe('normal')
    })

    it('should return current config', () => {
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.currentConfig).toEqual({
        fruitCount: 10,
        gameSpeed: 1.0,
        timeLimitMultiplier: 1.0,
        fruitSpeedMultiplier: 1.0,
        scoreMultiplier: 1.0,
        description: 'バランスの取れた標準的な難易度です',
      })
    })
  })

  describe('Difficulty Management', () => {
    it('should change difficulty', () => {
      const { result } = renderHook(() => useDifficulty())
      
      act(() => {
        result.current.setDifficulty('hard')
      })
      
      expect(mockDifficultyManager.setDifficulty).toHaveBeenCalledWith('hard')
    })

    it('should get available difficulties', () => {
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.availableDifficulties).toEqual(['easy', 'normal', 'hard'])
    })

    it('should get difficulty descriptions', () => {
      const { result } = renderHook(() => useDifficulty())
      expect(result.current.difficultyDescriptions).toEqual({
        easy: 'フルーツが少なく、時間に余裕があります',
        normal: 'バランスの取れた標準的な難易度です',
        hard: 'フルーツが多く、時間制限が厳しくなります',
      })
    })
  })

  describe('Adjusted Values', () => {
    it('should get adjusted game time', () => {
      const { result } = renderHook(() => useDifficulty())
      
      const adjustedTime = result.current.getAdjustedGameTime(180)
      expect(adjustedTime).toBe(180)
      expect(mockDifficultyManager.getAdjustedGameTime).toHaveBeenCalledWith(180)
    })

    it('should get adjusted score', () => {
      const { result } = renderHook(() => useDifficulty())
      
      const adjustedScore = result.current.getAdjustedScore(100)
      expect(adjustedScore).toBe(100)
      expect(mockDifficultyManager.getAdjustedScore).toHaveBeenCalledWith(100)
    })
  })

  describe('State Updates', () => {
    it('should update state when difficulty changes', () => {
      mockDifficultyManager.getCurrentDifficulty.mockReturnValue('hard')
      mockDifficultyManager.getCurrentConfig.mockReturnValue({
        fruitCount: 12,
        gameSpeed: 1.3,
        timeLimitMultiplier: 0.8,
        fruitSpeedMultiplier: 1.5,
        scoreMultiplier: 1.2,
        description: 'フルーツが多く、時間制限が厳しくなります',
      })

      const { result } = renderHook(() => useDifficulty())
      
      act(() => {
        result.current.setDifficulty('hard')
      })

      expect(result.current.currentDifficulty).toBe('hard')
      expect(result.current.currentConfig.fruitCount).toBe(12)
    })
  })
})