import { SOUND_TYPES, getToneSpecs, type SoundType, type ToneSpec } from './soundSynth'

export type { SoundType }

/**
 * 効果音の再生を担当する。
 *
 * 音源ファイルは持たず、soundSynthのレシピをWeb Audio APIで合成して鳴らす。
 * AudioContextはブラウザの自動再生制限があるため、最初のplay()まで生成しない。
 */
export class SoundManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private activeOscillators: Set<OscillatorNode> = new Set()
  private audioUnavailable: boolean = false
  private enabled: boolean = true
  private volume: number = 0.5
  private readonly STORAGE_KEYS = {
    enabled: 'soundEnabled',
    volume: 'soundVolume',
  }

  constructor() {
    this.loadSettings()
  }

  private loadSettings(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedEnabled = localStorage.getItem(this.STORAGE_KEYS.enabled)
        const savedVolume = localStorage.getItem(this.STORAGE_KEYS.volume)

        if (savedEnabled !== null) {
          this.enabled = savedEnabled === 'true'
        }

        if (savedVolume !== null) {
          const volume = parseFloat(savedVolume)
          if (!isNaN(volume)) {
            this.volume = Math.max(0, Math.min(1, volume))
          } else {
            console.warn('無効な音量設定が保存されていました。デフォルト値を使用します。')
          }
        }
      } catch (error) {
        console.warn('設定の読み込みに失敗しました。デフォルト値を使用します。', error)
      }
    }
  }

  private saveSettings(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEYS.enabled, String(this.enabled))
        localStorage.setItem(this.STORAGE_KEYS.volume, String(this.volume))
      } catch (error) {
        console.warn('設定の保存に失敗しました。', error)
      }
    }
  }

  /**
   * AudioContextを遅延生成する。
   * ブラウザはユーザー操作前のAudioContext生成を制限するため、最初の再生時まで作らない。
   * Web Audio APIが使えない環境（SSR・一部テスト環境）ではnullを返し、無音で動作を続ける。
   */
  private ensureAudioContext(): AudioContext | null {
    if (this.audioContext) return this.audioContext
    if (this.audioUnavailable) return null

    if (typeof window === 'undefined') return null

    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) {
      this.audioUnavailable = true
      console.warn(
        'Web Audio APIが利用できないため、効果音は再生されません。ゲームプレイには影響しません。'
      )
      return null
    }

    try {
      const context = new AudioContextClass()
      const masterGain = context.createGain()
      masterGain.gain.value = this.volume
      masterGain.connect(context.destination)

      this.audioContext = context
      this.masterGain = masterGain
      return context
    } catch (error) {
      this.audioUnavailable = true
      console.warn('AudioContextの初期化に失敗しました。効果音なしで続行します。', error)
      return null
    }
  }

  /** 単音をスケジュールする。急な音量変化によるプチノイズを避けるためエンベロープをかける */
  private scheduleTone(context: AudioContext, masterGain: GainNode, spec: ToneSpec, startAt: number): void {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()

    const startTime = startAt + spec.offset
    const endTime = startTime + spec.duration
    // 立ち上がり・減衰は短い音でも必ず収まるよう、長さの1/4を上限にする
    const attack = Math.min(0.01, spec.duration / 4)
    const release = Math.min(0.04, spec.duration / 4)

    oscillator.type = spec.waveform
    oscillator.frequency.setValueAtTime(spec.frequency, startTime)
    if (spec.endFrequency !== undefined) {
      oscillator.frequency.linearRampToValueAtTime(spec.endFrequency, endTime)
    }

    envelope.gain.setValueAtTime(0, startTime)
    envelope.gain.linearRampToValueAtTime(spec.gain, startTime + attack)
    envelope.gain.setValueAtTime(spec.gain, endTime - release)
    envelope.gain.linearRampToValueAtTime(0, endTime)

    oscillator.connect(envelope)
    envelope.connect(masterGain)

    oscillator.onended = () => {
      this.activeOscillators.delete(oscillator)
      try {
        oscillator.disconnect()
        envelope.disconnect()
      } catch {
        // 既に切断済みの場合は何もしない
      }
    }

    oscillator.start(startTime)
    oscillator.stop(endTime)
    this.activeOscillators.add(oscillator)
  }

  async play(soundType: SoundType): Promise<void> {
    if (!this.enabled) return

    const specs = getToneSpecs(soundType)
    if (specs.length === 0) {
      console.warn(`Sound not found: ${soundType}`)
      return
    }

    const context = this.ensureAudioContext()
    if (!context || !this.masterGain) return

    try {
      // タブ復帰時やユーザー操作前に生成された場合はsuspendedになっている
      if (context.state === 'suspended') {
        await context.resume()
      }

      const startAt = context.currentTime
      specs.forEach((spec) => this.scheduleTone(context, this.masterGain!, spec, startAt))
    } catch (error) {
      console.warn(`Failed to play sound: ${soundType}`, error)
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopAll()
    }
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

    if (this.masterGain) {
      this.masterGain.gain.value = this.volume
    }

    this.saveSettings()
  }

  getVolume(): number {
    return this.volume
  }

  getAvailableSounds(): SoundType[] {
    return [...SOUND_TYPES]
  }

  stopAll(): void {
    this.activeOscillators.forEach((oscillator) => {
      try {
        oscillator.stop()
      } catch {
        // 既に停止済みの場合は何もしない
      }
    })
    this.activeOscillators.clear()
  }

  destroy(): void {
    this.stopAll()

    if (this.audioContext) {
      const context = this.audioContext
      this.audioContext = null
      this.masterGain = null

      try {
        void context.close()
      } catch (error) {
        console.warn('AudioContextの終了に失敗しました。', error)
      }
    }
  }
}
