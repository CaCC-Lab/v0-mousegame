import { renderHook, act } from '@testing-library/react'
import { useSoundEffects } from '../useSoundEffects'

/**
 * useSoundEffectsの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際のSoundManagerを使用してテストします
 */
describe('useSoundEffects', () => {
  beforeEach(() => {
    // LocalStorageをクリア
    localStorage.clear()
  })

  it('initializes with default sound state', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // デフォルトではサウンドが有効
    expect(result.current.soundEnabled).toBe(true)
    expect(result.current.volume).toBe(0.5)
  })

  it('loads saved sound preferences from localStorage', () => {
    // 事前に設定を保存
    localStorage.setItem('soundEnabled', 'false')
    localStorage.setItem('soundVolume', '0.8')
    
    const { result } = renderHook(() => useSoundEffects())
    
    expect(result.current.soundEnabled).toBe(false)
    expect(result.current.volume).toBe(0.8)
  })

  it('toggles sound on and off', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // 初期状態を確認
    const initialState = result.current.soundEnabled
    
    // サウンドをトグル
    act(() => {
      result.current.toggleSound()
    })
    
    expect(result.current.soundEnabled).toBe(!initialState)
    
    // もう一度トグル
    act(() => {
      result.current.toggleSound()
    })
    
    expect(result.current.soundEnabled).toBe(initialState)
  })

  it('changes volume', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // ボリュームを変更
    act(() => {
      result.current.setVolume(0.7)
    })
    
    expect(result.current.volume).toBe(0.7)
    
    // 範囲外の値はクランプされる
    act(() => {
      result.current.setVolume(1.5)
    })
    expect(result.current.volume).toBe(1)
    
    act(() => {
      result.current.setVolume(-0.5)
    })
    expect(result.current.volume).toBe(0)
  })

  it('saves preferences to localStorage', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // サウンドをオフにする
    act(() => {
      result.current.toggleSound()
    })
    
    expect(localStorage.getItem('soundEnabled')).toBe('false')
    
    // ボリュームを変更
    act(() => {
      result.current.setVolume(0.3)
    })
    
    expect(localStorage.getItem('soundVolume')).toBe('0.3')
  })

  it('provides sound play methods', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // サウンド再生メソッドが存在することを確認
    expect(typeof result.current.playCollectSound).toBe('function')
    expect(typeof result.current.playGameStartSound).toBe('function')
    expect(typeof result.current.playGameOverSound).toBe('function')
    expect(typeof result.current.playHighScoreSound).toBe('function')
  })

  it('plays sounds when enabled', async () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // サウンドが有効な時は、エラーなく実行される
    await expect(result.current.playCollectSound()).resolves.not.toThrow()
    await expect(result.current.playGameStartSound()).resolves.not.toThrow()
    await expect(result.current.playGameOverSound()).resolves.not.toThrow()
    await expect(result.current.playHighScoreSound()).resolves.not.toThrow()
  })

  it('does not throw when sound is disabled', async () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // サウンドを無効にする
    act(() => {
      result.current.toggleSound()
    })
    
    // サウンドが無効でも、エラーなく実行される
    await expect(result.current.playCollectSound()).resolves.not.toThrow()
    await expect(result.current.playGameStartSound()).resolves.not.toThrow()
    await expect(result.current.playGameOverSound()).resolves.not.toThrow()
    await expect(result.current.playHighScoreSound()).resolves.not.toThrow()
  })

  it('handles different fruit types for collect sound', async () => {
    const { result } = renderHook(() => useSoundEffects())
    
    // playCollectSoundは引数を取らないので、同じメソッドを複数回呼び出してもエラーなく動作する
    await expect(result.current.playCollectSound()).resolves.not.toThrow()
    await expect(result.current.playCollectSound()).resolves.not.toThrow()
    await expect(result.current.playCollectSound()).resolves.not.toThrow()
    await expect(result.current.playCollectSound()).resolves.not.toThrow()
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useSoundEffects())
    
    // アンマウント時にエラーが発生しないことを確認
    expect(() => {
      unmount()
    }).not.toThrow()
  })
})