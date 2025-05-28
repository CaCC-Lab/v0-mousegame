import { SoundManager } from '../soundManager'

// Track all created audio instances
interface MockAudioInstance {
  src: string
  play: jest.Mock
  pause: jest.Mock
  addEventListener: jest.Mock
  removeEventListener: jest.Mock
  volume: number
  currentTime: number
  preload: string
}
const audioInstances: MockAudioInstance[] = []

// Mock Audio API
const mockPlay = jest.fn().mockResolvedValue(undefined)
const mockPause = jest.fn()
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

global.Audio = jest.fn().mockImplementation((src: string) => {
  const instance = {
    src,
    play: mockPlay,
    pause: mockPause,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    volume: 1,
    currentTime: 0,
    preload: 'auto',
  }
  audioInstances.push(instance)
  return instance
}) as unknown as typeof Audio

describe('SoundManager', () => {
  let soundManager: SoundManager

  beforeEach(() => {
    jest.clearAllMocks()
    audioInstances.length = 0
    // Clear localStorage to ensure clean state
    localStorage.clear()
    soundManager = new SoundManager()
  })

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(soundManager.isEnabled()).toBe(true)
      expect(soundManager.getVolume()).toBe(0.5)
    })

    it('should preload all sound effects', () => {
      const sounds = soundManager.getAvailableSounds()
      expect(sounds).toContain('collect')
      expect(sounds).toContain('gameStart')
      expect(sounds).toContain('gameOver')
      expect(sounds).toContain('highScore')
    })
  })

  describe('Sound Playback', () => {
    it('should play collect sound when enabled', async () => {
      await soundManager.play('collect')
      expect(mockPlay).toHaveBeenCalled()
    })

    it('should not play sound when disabled', async () => {
      soundManager.setEnabled(false)
      await soundManager.play('collect')
      expect(mockPlay).not.toHaveBeenCalled()
    })

    it('should play different sounds', async () => {
      await soundManager.play('gameStart')
      await soundManager.play('gameOver')
      await soundManager.play('highScore')
      expect(mockPlay).toHaveBeenCalledTimes(3)
    })

    it('should handle invalid sound names gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      await expect(soundManager.play('invalid' as unknown as import('../soundManager').SoundType)).resolves.not.toThrow()
      expect(consoleWarnSpy).toHaveBeenCalledWith('Sound not found: invalid')
      consoleWarnSpy.mockRestore()
    })
  })

  describe('Volume Control', () => {
    it('should set volume', () => {
      soundManager.setVolume(0.8)
      expect(soundManager.getVolume()).toBe(0.8)
    })

    it('should clamp volume between 0 and 1', () => {
      soundManager.setVolume(-0.5)
      expect(soundManager.getVolume()).toBe(0)

      soundManager.setVolume(1.5)
      expect(soundManager.getVolume()).toBe(1)
    })

    it('should apply volume to played sounds', async () => {
      soundManager.setVolume(0.3)
      await soundManager.play('collect')
      
      // Check that volume was set on all audio instances
      audioInstances.forEach(instance => {
        expect(instance.volume).toBe(0.3)
      })
    })
  })

  describe('Enable/Disable', () => {
    it('should toggle sound', () => {
      expect(soundManager.isEnabled()).toBe(true)
      
      soundManager.setEnabled(false)
      expect(soundManager.isEnabled()).toBe(false)
      
      soundManager.toggle()
      expect(soundManager.isEnabled()).toBe(true)
    })
  })

  describe('Persistence', () => {
    it('should save settings to localStorage', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      
      soundManager.setEnabled(false)
      soundManager.setVolume(0.7)
      
      expect(setItemSpy).toHaveBeenCalledWith('soundEnabled', 'false')
      expect(setItemSpy).toHaveBeenCalledWith('soundVolume', '0.7')
    })

    it('should load settings from localStorage', () => {
      localStorage.setItem('soundEnabled', 'false')
      localStorage.setItem('soundVolume', '0.3')
      
      const newSoundManager = new SoundManager()
      expect(newSoundManager.isEnabled()).toBe(false)
      expect(newSoundManager.getVolume()).toBe(0.3)
    })
  })

  describe('Cleanup', () => {
    it('should stop all sounds', () => {
      soundManager.stopAll()
      expect(mockPause).toHaveBeenCalled()
    })

    it('should cleanup resources on destroy', () => {
      soundManager.destroy()
      expect(mockRemoveEventListener).toHaveBeenCalled()
    })
  })
})