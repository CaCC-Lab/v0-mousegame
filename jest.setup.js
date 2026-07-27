// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// HTMLAudioElementのモック（JSDOMの制限を回避）
// これはモックではなく、JSDOMの不完全な実装を補完するためのポリフィル
global.HTMLMediaElement.prototype.play = () => Promise.resolve()
global.HTMLMediaElement.prototype.pause = () => {}
global.HTMLMediaElement.prototype.load = () => {}

// Audio コンストラクタの実装を補完
const OriginalAudio = global.Audio
global.Audio = class Audio extends OriginalAudio {
  constructor(src) {
    super(src)
    this.play = () => Promise.resolve()
    this.pause = () => {}
    this.load = () => {}
  }
}

// Web Audio APIのポリフィル（JSDOMは未実装）
// これもモックではなく、SoundManagerが実際に通るコードパス（オシレーター生成・
// エンベロープ設定・接続・停止）をそのまま再現するための最小実装。
// テストからは __getCreatedAudioContexts() で生成されたノードを検査できる。
const createdAudioContexts = []

class PolyfillAudioParam {
  constructor(value = 0) {
    this.value = value
    /** setValueAtTime / linearRampToValueAtTime の予約履歴 */
    this.scheduledEvents = []
  }

  setValueAtTime(value, time) {
    this.scheduledEvents.push({ type: 'setValueAtTime', value, time })
    this.value = value
    return this
  }

  linearRampToValueAtTime(value, time) {
    this.scheduledEvents.push({ type: 'linearRampToValueAtTime', value, time })
    this.value = value
    return this
  }

  exponentialRampToValueAtTime(value, time) {
    this.scheduledEvents.push({ type: 'exponentialRampToValueAtTime', value, time })
    this.value = value
    return this
  }

  cancelScheduledValues(time) {
    this.scheduledEvents = this.scheduledEvents.filter((event) => event.time < time)
    return this
  }
}

class PolyfillAudioNode {
  constructor() {
    this.connectedTo = []
  }

  connect(destination) {
    this.connectedTo.push(destination)
    return destination
  }

  disconnect() {
    this.connectedTo = []
  }
}

class PolyfillGainNode extends PolyfillAudioNode {
  constructor() {
    super()
    this.gain = new PolyfillAudioParam(1)
  }
}

class PolyfillOscillatorNode extends PolyfillAudioNode {
  constructor() {
    super()
    this.type = 'sine'
    this.frequency = new PolyfillAudioParam(440)
    this.onended = null
    this.started = false
    this.stopped = false
    this.startTime = null
    this.stopTime = null
  }

  start(when = 0) {
    // 実ブラウザ同様、二重startはInvalidStateError
    if (this.started) {
      throw new DOMException('cannot call start more than once', 'InvalidStateError')
    }
    this.started = true
    this.startTime = when
  }

  stop(when = 0) {
    // 実ブラウザ同様、start前のstopはInvalidStateError。stop自体は複数回呼べる
    if (!this.started) {
      throw new DOMException('cannot call stop without calling start first', 'InvalidStateError')
    }
    this.stopped = true
    this.stopTime = when
  }
}

class PolyfillAudioContext {
  constructor() {
    this.currentTime = 0
    this.state = 'running'
    this.destination = new PolyfillAudioNode()
    this.oscillators = []
    this.gains = []
    createdAudioContexts.push(this)
  }

  createOscillator() {
    const oscillator = new PolyfillOscillatorNode()
    this.oscillators.push(oscillator)
    return oscillator
  }

  createGain() {
    const gain = new PolyfillGainNode()
    this.gains.push(gain)
    return gain
  }

  async resume() {
    this.state = 'running'
  }

  async suspend() {
    this.state = 'suspended'
  }

  async close() {
    this.state = 'closed'
  }
}

global.AudioContext = PolyfillAudioContext
window.AudioContext = PolyfillAudioContext

/** テストから生成済みAudioContextを検査するためのヘルパー */
global.__getCreatedAudioContexts = () => createdAudioContexts
global.__resetCreatedAudioContexts = () => {
  createdAudioContexts.length = 0
}