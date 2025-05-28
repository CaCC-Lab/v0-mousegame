export type SoundType = 'collect' | 'gameStart' | 'gameOver' | 'highScore'

interface SoundConfig {
  src: string
  volume?: number
}

export class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map()
  private enabled: boolean = true
  private volume: number = 0.5
  private readonly STORAGE_KEYS = {
    enabled: 'soundEnabled',
    volume: 'soundVolume',
  }

  constructor() {
    this.loadSettings()
    this.preloadSounds()
  }

  private loadSettings(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedEnabled = localStorage.getItem(this.STORAGE_KEYS.enabled)
      const savedVolume = localStorage.getItem(this.STORAGE_KEYS.volume)

      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true'
      }

      if (savedVolume !== null) {
        const volume = parseFloat(savedVolume)
        if (!isNaN(volume)) {
          this.volume = Math.max(0, Math.min(1, volume))
        }
      }
    }
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEYS.enabled, String(this.enabled))
      localStorage.setItem(this.STORAGE_KEYS.volume, String(this.volume))
    }
  }

  private preloadSounds(): void {
    const soundConfigs: Record<SoundType, SoundConfig> = {
      collect: { src: '/sounds/collect.mp3' },
      gameStart: { src: '/sounds/game-start.mp3' },
      gameOver: { src: '/sounds/game-over.mp3' },
      highScore: { src: '/sounds/high-score.mp3' },
    }

    Object.entries(soundConfigs).forEach(([type, config]) => {
      try {
        const audio = new Audio(config.src)
        audio.volume = this.volume
        audio.preload = 'auto'
        this.sounds.set(type as SoundType, audio)
      } catch (error) {
        console.warn(`Failed to load sound: ${type}`, error)
      }
    })
  }

  async play(soundType: SoundType): Promise<void> {
    if (!this.enabled) return

    const sound = this.sounds.get(soundType)
    if (!sound) {
      console.warn(`Sound not found: ${soundType}`)
      return
    }

    try {
      // Reset the sound to the beginning
      sound.currentTime = 0
      sound.volume = this.volume
      await sound.play()
    } catch (error) {
      console.warn(`Failed to play sound: ${soundType}`, error)
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.saveSettings()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  toggle(): void {
    this.setEnabled(!this.enabled)
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    
    // Update volume for all preloaded sounds
    this.sounds.forEach(sound => {
      sound.volume = this.volume
    })

    this.saveSettings()
  }

  getVolume(): number {
    return this.volume
  }

  getAvailableSounds(): SoundType[] {
    return Array.from(this.sounds.keys())
  }

  stopAll(): void {
    this.sounds.forEach(sound => {
      sound.pause()
      sound.currentTime = 0
    })
  }

  destroy(): void {
    this.sounds.forEach(sound => {
      sound.pause()
      sound.removeEventListener('ended', () => {})
      sound.removeEventListener('error', () => {})
    })
    this.sounds.clear()
  }
}