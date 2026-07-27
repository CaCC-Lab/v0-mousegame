import { SoundManager } from '../soundManager'
import { getToneSpecs } from '../soundSynth'

/** jest.setup.jsのWeb Audioポリフィルが記録したAudioContextを取得する */
interface PolyfillAudioContext {
  state: string
  oscillators: Array<{
    type: string
    frequency: { value: number }
    started: boolean
    stopped: boolean
    startTime: number | null
    stopTime: number | null
  }>
  gains: Array<{ gain: { value: number } }>
}

const getCreatedAudioContexts = (): PolyfillAudioContext[] =>
  (global as unknown as { __getCreatedAudioContexts: () => PolyfillAudioContext[] }).__getCreatedAudioContexts()

const resetCreatedAudioContexts = (): void =>
  (global as unknown as { __resetCreatedAudioContexts: () => void }).__resetCreatedAudioContexts()

/**
 * SoundManagerの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 * Audio APIはJSDOMの制限があるため、jest.setup.jsでポリフィルを使用
 */
describe('SoundManager', () => {
  let soundManager: SoundManager

  beforeEach(() => {
    localStorage.clear()
    resetCreatedAudioContexts()
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

  describe('合成音の再生（Web Audio API）', () => {
    it('最初のplay()までAudioContextを生成しない（自動再生制限への対応）', () => {
      // コンストラクタ時点ではまだ音を鳴らす準備をしない
      expect(getCreatedAudioContexts()).toHaveLength(0)
    })

    it('collectのレシピどおりのオシレーターを生成して鳴らす', async () => {
      const specs = getToneSpecs('collect')

      await soundManager.play('collect')

      const contexts = getCreatedAudioContexts()
      expect(contexts).toHaveLength(1)

      const oscillators = contexts[0].oscillators
      expect(oscillators).toHaveLength(specs.length)

      oscillators.forEach((oscillator, index) => {
        expect(oscillator.type).toBe(specs[index].waveform)
        expect(oscillator.frequency.value).toBe(specs[index].frequency)
        expect(oscillator.started).toBe(true)
      })
    })

    it('鳴らす音ごとに開始時刻と終了時刻を予約する', async () => {
      const specs = getToneSpecs('gameStart')

      await soundManager.play('gameStart')

      const oscillators = getCreatedAudioContexts()[0].oscillators
      oscillators.forEach((oscillator, index) => {
        expect(oscillator.startTime).toBeCloseTo(specs[index].offset, 5)
        expect(oscillator.stopTime).toBeCloseTo(
          specs[index].offset + specs[index].duration,
          5
        )
      })
    })

    it('AudioContextを1つだけ生成し、複数回の再生で使い回す', async () => {
      await soundManager.play('collect')
      await soundManager.play('collect')
      await soundManager.play('gameOver')

      expect(getCreatedAudioContexts()).toHaveLength(1)
    })

    it('サウンドが無効な間はAudioContextを生成しない', async () => {
      soundManager.setEnabled(false)

      await soundManager.play('collect')

      expect(getCreatedAudioContexts()).toHaveLength(0)
    })

    it('suspended状態のAudioContextを再開してから鳴らす', async () => {
      await soundManager.play('collect')

      const context = getCreatedAudioContexts()[0]
      context.state = 'suspended'

      await soundManager.play('collect')
      expect(context.state).toBe('running')
    })

    it('音量変更がマスターゲインに反映される', async () => {
      await soundManager.play('collect')
      soundManager.setVolume(0.25)

      // 最初に生成されるゲインノードがマスターゲイン
      const masterGain = getCreatedAudioContexts()[0].gains[0]
      expect(masterGain.gain.value).toBe(0.25)
    })

    it('再生前に設定した音量がマスターゲインの初期値になる', async () => {
      soundManager.setVolume(0.8)
      await soundManager.play('collect')

      const masterGain = getCreatedAudioContexts()[0].gains[0]
      expect(masterGain.gain.value).toBe(0.8)
    })

    it('stopAllで再生中のオシレーターを停止する', async () => {
      await soundManager.play('highScore')

      soundManager.stopAll()

      getCreatedAudioContexts()[0].oscillators.forEach((oscillator) => {
        expect(oscillator.stopped).toBe(true)
      })
    })

    it('サウンドを無効化すると再生中の音を止める', async () => {
      await soundManager.play('highScore')

      soundManager.setEnabled(false)

      getCreatedAudioContexts()[0].oscillators.forEach((oscillator) => {
        expect(oscillator.stopped).toBe(true)
      })
    })

    it('destroyでAudioContextを閉じる', async () => {
      await soundManager.play('collect')

      soundManager.destroy()

      expect(getCreatedAudioContexts()[0].state).toBe('closed')
    })

    it('destroy後に再生するとAudioContextを作り直す', async () => {
      await soundManager.play('collect')
      soundManager.destroy()

      await soundManager.play('collect')

      expect(getCreatedAudioContexts()).toHaveLength(2)
      expect(getCreatedAudioContexts()[1].state).toBe('running')
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