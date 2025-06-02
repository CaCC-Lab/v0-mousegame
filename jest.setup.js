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