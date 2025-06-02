import { SoundManager } from '../soundManager'

/**
 * SoundManagerの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 * Audio APIはJSDOMの制限があるため、jest.setup.jsでポリフィルを使用
 */
describe('SoundManager', () => {
  let soundManager: SoundManager

  beforeEach(() => {
    localStorage.clear()
    soundManager = new SoundManager()
  })

  afterEach(() => {
    soundManager.destroy()
  })

  describe('initialization', () => {
    it('initializes with default settings', () => {
      expect(soundManager.isEnabled()).toBe(true)
      expect(soundManager.getVolume()).toBe(0.5)
    })

    it('loads settings from localStorage', () => {
      localStorage.setItem('soundEnabled', 'false')
      localStorage.setItem('soundVolume', '0.8')
      
      const newManager = new SoundManager()
      expect(newManager.isEnabled()).toBe(false)
      expect(newManager.getVolume()).toBe(0.8)
      
      newManager.destroy()
    })
  })

  describe('sound control', () => {
    it('enables and disables sound', () => {
      soundManager.setEnabled(false)
      expect(soundManager.isEnabled()).toBe(false)
      expect(localStorage.getItem('soundEnabled')).toBe('false')
      
      soundManager.setEnabled(true)
      expect(soundManager.isEnabled()).toBe(true)
      expect(localStorage.getItem('soundEnabled')).toBe('true')
    })

    it('sets volume', () => {
      soundManager.setVolume(0.7)
      expect(soundManager.getVolume()).toBe(0.7)
      expect(localStorage.getItem('soundVolume')).toBe('0.7')
    })

    it('clamps volume to valid range', () => {
      soundManager.setVolume(-0.5)
      expect(soundManager.getVolume()).toBe(0)
      
      soundManager.setVolume(1.5)
      expect(soundManager.getVolume()).toBe(1)
    })
  })

  describe('sound playback', () => {
    it('plays sounds without errors when enabled', async () => {
      soundManager.setEnabled(true)
      
      // 実際のplay(soundType)メソッドを使用
      await expect(soundManager.play('collect')).resolves.not.toThrow()
      await expect(soundManager.play('gameStart')).resolves.not.toThrow()
      await expect(soundManager.play('gameOver')).resolves.not.toThrow()
      await expect(soundManager.play('highScore')).resolves.not.toThrow()
    })

    it('does not throw errors when disabled', async () => {
      soundManager.setEnabled(false)
      
      // サウンドが無効でもエラーを投げない
      await expect(soundManager.play('collect')).resolves.not.toThrow()
      await expect(soundManager.play('gameStart')).resolves.not.toThrow()
      await expect(soundManager.play('gameOver')).resolves.not.toThrow()
      await expect(soundManager.play('highScore')).resolves.not.toThrow()
    })

    it('returns available sound types', () => {
      const availableSounds = soundManager.getAvailableSounds()
      expect(availableSounds).toContain('collect')
      expect(availableSounds).toContain('gameStart')
      expect(availableSounds).toContain('gameOver')
      expect(availableSounds).toContain('highScore')
    })
  })

  describe('toggle functionality', () => {
    it('toggles sound state', () => {
      const initialState = soundManager.isEnabled()
      
      soundManager.toggle()
      expect(soundManager.isEnabled()).toBe(!initialState)
      
      soundManager.toggle()
      expect(soundManager.isEnabled()).toBe(initialState)
    })
  })

  describe('stopAll functionality', () => {
    it('stops all sounds without errors', () => {
      expect(() => {
        soundManager.stopAll()
      }).not.toThrow()
    })
  })

  describe('cleanup', () => {
    it('destroys without errors', () => {
      expect(() => {
        soundManager.destroy()
      }).not.toThrow()
    })

    it('can be destroyed multiple times safely', () => {
      expect(() => {
        soundManager.destroy()
        soundManager.destroy()
      }).not.toThrow()
    })
  })

  describe('localStorage integration', () => {
    it('persists enabled state', () => {
      soundManager.setEnabled(false)
      
      const newManager = new SoundManager()
      expect(newManager.isEnabled()).toBe(false)
      
      newManager.destroy()
    })

    it('persists volume state', () => {
      soundManager.setVolume(0.3)
      
      const newManager = new SoundManager()
      expect(newManager.getVolume()).toBe(0.3)
      
      newManager.destroy()
    })

    it('handles invalid localStorage values', () => {
      localStorage.setItem('soundEnabled', 'invalid')
      localStorage.setItem('soundVolume', 'not-a-number')
      
      const newManager = new SoundManager()
      expect(newManager.isEnabled()).toBe(false) // 'invalid' !== 'true' なのでfalse
      expect(newManager.getVolume()).toBe(0.5) // デフォルト値
      
      newManager.destroy()
    })
  })
})