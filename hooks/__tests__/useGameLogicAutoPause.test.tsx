import { renderHook, act } from '@testing-library/react'
import { useGameLogic } from '../useGameLogic'

/**
 * タブが隠れたときの自動一時停止（モックなし）
 *
 * 子どもが席を離れたり別のタブを見ている間もタイマーが減り続けると、
 * 戻ったときには時間切れでスコアが不当に下がってしまう。
 * 学習ツールとして「離れている間は止まる」のが正しい。
 */
describe('useGameLogic auto pause', () => {
  /** documentの表示状態を切り替えてイベントを発火する */
  const setVisibility = (state: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
    Object.defineProperty(document, 'hidden', { value: state === 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  }

  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
    setVisibility('visible')
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
    setVisibility('visible')
  })

  it('プレイ中にタブが隠れると一時停止する', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })
    expect(result.current.gameState).toBe('playing')

    act(() => {
      setVisibility('hidden')
    })

    expect(result.current.gameState).toBe('paused')
  })

  it('自動停止中はタイマーが減らない', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })

    act(() => {
      setVisibility('hidden')
    })
    const timeAtPause = result.current.timeLeft

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(result.current.timeLeft).toBe(timeAtPause)
  })

  it('タブに戻っても自動では再開しない（プレイヤーが自分で再開する）', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })
    act(() => {
      setVisibility('hidden')
    })
    act(() => {
      setVisibility('visible')
    })

    // 戻った瞬間に不意にゲームが動き出さないこと
    expect(result.current.gameState).toBe('paused')
  })

  it('待機中にタブが隠れても状態は変わらない', () => {
    const { result } = renderHook(() => useGameLogic())

    expect(result.current.gameState).toBe('idle')

    act(() => {
      setVisibility('hidden')
    })

    expect(result.current.gameState).toBe('idle')
  })

  it('自分で一時停止した状態はタブ操作で変化しない', () => {
    const { result } = renderHook(() => useGameLogic())

    act(() => {
      result.current.startGame()
    })
    act(() => {
      result.current.pauseGame()
    })
    expect(result.current.gameState).toBe('paused')

    act(() => {
      setVisibility('hidden')
    })

    expect(result.current.gameState).toBe('paused')
  })
})
