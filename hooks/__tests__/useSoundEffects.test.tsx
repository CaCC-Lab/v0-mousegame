import { renderHook, act } from '@testing-library/react'
import { useSoundEffects } from '../useSoundEffects'
import { SoundManager } from '../../lib/soundManager'

jest.mock('../../lib/soundManager')

describe('useSoundEffects', () => {
  let mockSoundManager: jest.Mocked<SoundManager>

  beforeEach(() => {
    mockSoundManager = {
      play: jest.fn().mockResolvedValue(undefined),
      setEnabled: jest.fn(),
      setVolume: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true),
      getVolume: jest.fn().mockReturnValue(0.5),
      toggle: jest.fn(),
      stopAll: jest.fn(),
      destroy: jest.fn(),
      getAvailableSounds: jest.fn().mockReturnValue(['collect', 'gameStart', 'gameOver', 'highScore']),
    } as any

    ;(SoundManager as jest.MockedClass<typeof SoundManager>).mockImplementation(() => mockSoundManager)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should create sound manager instance', () => {
      renderHook(() => useSoundEffects())
      expect(SoundManager).toHaveBeenCalledTimes(1)
    })

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useSoundEffects())
      unmount()
      expect(mockSoundManager.destroy).toHaveBeenCalled()
    })
  })

  describe('Game Events', () => {
    it('should play collect sound when fruit is collected', async () => {
      const { result } = renderHook(() => useSoundEffects())
      
      await act(async () => {
        await result.current.playCollectSound()
      })
      
      expect(mockSoundManager.play).toHaveBeenCalledWith('collect')
    })

    it('should play game start sound', async () => {
      const { result } = renderHook(() => useSoundEffects())
      
      await act(async () => {
        await result.current.playGameStartSound()
      })
      
      expect(mockSoundManager.play).toHaveBeenCalledWith('gameStart')
    })

    it('should play game over sound', async () => {
      const { result } = renderHook(() => useSoundEffects())
      
      await act(async () => {
        await result.current.playGameOverSound()
      })
      
      expect(mockSoundManager.play).toHaveBeenCalledWith('gameOver')
    })

    it('should play high score sound', async () => {
      const { result } = renderHook(() => useSoundEffects())
      
      await act(async () => {
        await result.current.playHighScoreSound()
      })
      
      expect(mockSoundManager.play).toHaveBeenCalledWith('highScore')
    })
  })

  describe('Sound Settings', () => {
    it('should toggle sound', () => {
      const { result } = renderHook(() => useSoundEffects())
      
      act(() => {
        result.current.toggleSound()
      })
      
      expect(mockSoundManager.toggle).toHaveBeenCalled()
    })

    it('should set volume', () => {
      const { result } = renderHook(() => useSoundEffects())
      
      act(() => {
        result.current.setVolume(0.8)
      })
      
      expect(mockSoundManager.setVolume).toHaveBeenCalledWith(0.8)
    })

    it('should get current settings', () => {
      const { result } = renderHook(() => useSoundEffects())
      
      expect(result.current.soundEnabled).toBe(true)
      expect(result.current.volume).toBe(0.5)
    })
  })

  describe('Integration with Game State', () => {
    it('should provide sound effect functions for game integration', () => {
      const { result } = renderHook(() => useSoundEffects())
      
      expect(result.current).toHaveProperty('playCollectSound')
      expect(result.current).toHaveProperty('playGameStartSound')
      expect(result.current).toHaveProperty('playGameOverSound')
      expect(result.current).toHaveProperty('playHighScoreSound')
      expect(result.current).toHaveProperty('toggleSound')
      expect(result.current).toHaveProperty('setVolume')
      expect(result.current).toHaveProperty('soundEnabled')
      expect(result.current).toHaveProperty('volume')
    })
  })
})