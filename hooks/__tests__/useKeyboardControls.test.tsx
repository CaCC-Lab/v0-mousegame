import { renderHook, act } from '@testing-library/react'
import { useKeyboardControls } from '../useKeyboardControls'

describe('useKeyboardControls', () => {
  const mockHandlers = {
    onSpacePress: jest.fn(),
    onEnterPress: jest.fn(),
    onEscapePress: jest.fn(),
    onArrowKeys: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle space key press', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).toHaveBeenCalledTimes(1)
  })

  it('should handle enter key press', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onEnterPress).toHaveBeenCalledTimes(1)
  })

  it('should handle escape key press', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onEscapePress).toHaveBeenCalledTimes(1)
  })

  it('should handle arrow key presses', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    const directions = [
      { key: 'ArrowUp', direction: 'up' },
      { key: 'ArrowDown', direction: 'down' },
      { key: 'ArrowLeft', direction: 'left' },
      { key: 'ArrowRight', direction: 'right' },
    ]

    directions.forEach(({ key, direction }) => {
      act(() => {
        const event = new KeyboardEvent('keydown', { key, code: key })
        window.dispatchEvent(event)
      })

      expect(mockHandlers.onArrowKeys).toHaveBeenCalledWith(direction)
    })

    expect(mockHandlers.onArrowKeys).toHaveBeenCalledTimes(4)
  })

  it('should prevent default for arrow keys to avoid scrolling', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown' })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    
    act(() => {
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useKeyboardControls(mockHandlers))
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should not call handlers for other keys', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).not.toHaveBeenCalled()
    expect(mockHandlers.onEnterPress).not.toHaveBeenCalled()
    expect(mockHandlers.onEscapePress).not.toHaveBeenCalled()
    expect(mockHandlers.onArrowKeys).not.toHaveBeenCalled()
  })

  it('should respect enabled state', () => {
    const { result, rerender } = renderHook(
      ({ handlers, enabled }) => useKeyboardControls(handlers, enabled),
      {
        initialProps: { handlers: mockHandlers, enabled: false },
      }
    )
    
    // When disabled, should not respond to keys
    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).not.toHaveBeenCalled()

    // Enable and test again
    rerender({ handlers: mockHandlers, enabled: true })

    act(() => {
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space' })
      window.dispatchEvent(event)
    })

    expect(mockHandlers.onSpacePress).toHaveBeenCalledTimes(1)
  })

  it('should provide focus management functions', () => {
    const { result } = renderHook(() => useKeyboardControls(mockHandlers))
    
    expect(result.current.focusGame).toBeDefined()
    expect(result.current.blurGame).toBeDefined()
    expect(typeof result.current.focusGame).toBe('function')
    expect(typeof result.current.blurGame).toBe('function')
  })

  describe('フォーム要素にフォーカスがあるとき', () => {
    /** 指定タグの要素を実際にDOMへ追加してフォーカスする */
    const focusElement = (tagName: string, type?: string) => {
      const el = document.createElement(tagName) as HTMLInputElement
      if (type) el.type = type
      document.body.appendChild(el)
      el.focus()
      return el
    }

    afterEach(() => {
      document.body.innerHTML = ''
    })

    it.each([
      ['input', 'checkbox'],
      ['input', 'text'],
      ['select', undefined],
      ['textarea', undefined],
      ['button', undefined],
    ])('%s(%s) にフォーカスがあるとスペースキーを横取りしない', (tagName, type) => {
      // ゲームのショートカットが優先されると、チェックボックスの切り替えなど
      // 要素本来のキー操作ができなくなる
      renderHook(() => useKeyboardControls(mockHandlers))
      const el = focusElement(tagName, type as string | undefined)

      act(() => {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }))
      })

      expect(mockHandlers.onSpacePress).not.toHaveBeenCalled()
    })

    it('フォーム要素以外にフォーカスがあるときは従来どおり動作する', () => {
      renderHook(() => useKeyboardControls(mockHandlers))
      const div = document.createElement('div')
      div.tabIndex = 0
      document.body.appendChild(div)
      div.focus()

      act(() => {
        div.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }))
      })

      expect(mockHandlers.onSpacePress).toHaveBeenCalledTimes(1)
    })

    it('矢印キーもフォーム要素にフォーカスがあるときは横取りしない', () => {
      renderHook(() => useKeyboardControls(mockHandlers))
      const select = focusElement('select')

      act(() => {
        select.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      })

      expect(mockHandlers.onArrowKeys).not.toHaveBeenCalled()
    })
  })

  /**
   * ダイアログの中で押したキーをゲームの操作として扱わない（docs/game-spec.md §4.3）。
   * 「あそびかた」を開いて本文をクリックし Enter を押すと、ダイアログの裏でゲームが始まっていた。
   *
   * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
   * |---|---|---|---|---|
   * | KB-A-01 | role="dialog" の要素自体で Enter | Equivalence – abnormal | onEnterPress を呼ばない | Radix の DialogContent はここにフォーカスを持つ |
   * | KB-A-02 | role="dialog" の子孫で Space | Equivalence – abnormal | onSpacePress を呼ばず、preventDefault もしない | ダイアログ内のスクロールを妨げない |
   * | KB-A-03 | role="alertdialog" の子孫で ArrowDown | Equivalence – abnormal | onArrowKeys を呼ばない | - |
   * | KB-B-01 | role="dialog" から3階層下の要素で Enter | Boundary – 深い入れ子 | onEnterPress を呼ばない | 直近の祖先だけを見ない |
   * | KB-N-01 | role="dialog" 以外の role（region）の中で Enter | Equivalence – normal | onEnterPress を呼ぶ | ダイアログ以外は従来どおり |
   * | KB-B-02 | document（tagName も closest も無い）で Enter | Boundary – NULL 相当の target | onEnterPress を呼び、例外を出さない | window への直接 dispatch は既存テストで確認済み |
   */
  describe('ダイアログの中で押したとき', () => {
    afterEach(() => {
      document.body.innerHTML = ''
    })

    const mount = (html: string) => {
      document.body.innerHTML = html
    }
    const keydownOn = (target: EventTarget, key: string) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      act(() => {
        target.dispatchEvent(event)
      })
      return event
    }

    it('KB-A-01: role="dialog" の要素自体で Enter を押しても、ゲームの Enter にしない', () => {
      // Given: フォーカスを持つダイアログ本体
      renderHook(() => useKeyboardControls(mockHandlers))
      mount('<div role="dialog" tabindex="-1" id="d"></div>')

      // When: ダイアログ本体で Enter
      keydownOn(document.getElementById('d')!, 'Enter')

      // Then: ゲームの Enter は呼ばれない
      expect(mockHandlers.onEnterPress).not.toHaveBeenCalled()
    })

    it('KB-A-02: ダイアログの子孫で Space を押しても横取りせず、既定の動作も止めない', () => {
      // Given: ダイアログの中の見出し
      renderHook(() => useKeyboardControls(mockHandlers))
      mount('<div role="dialog"><h2 id="t">あそびかた</h2></div>')

      // When: 見出しで Space
      const event = keydownOn(document.getElementById('t')!, ' ')

      // Then: ポーズ操作は呼ばれず、スクロールなどの既定動作も残る
      expect(mockHandlers.onSpacePress).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })

    it('KB-A-03: role="alertdialog" の子孫で矢印を押しても、果物を選ばない', () => {
      // Given: alertdialog の中の段落
      renderHook(() => useKeyboardControls(mockHandlers))
      mount('<div role="alertdialog"><p id="p">本当に？</p></div>')

      // When: 段落で ArrowDown
      keydownOn(document.getElementById('p')!, 'ArrowDown')

      // Then: 矢印の操作は呼ばれない
      expect(mockHandlers.onArrowKeys).not.toHaveBeenCalled()
    })

    it('KB-B-01: ダイアログから深く入れ子になった要素でも、ゲームの Enter にしない', () => {
      // Given: ダイアログから3階層下の要素
      renderHook(() => useKeyboardControls(mockHandlers))
      mount('<div role="dialog"><section><div><span id="deep">ず</span></div></section></div>')

      // When: いちばん内側で Enter
      keydownOn(document.getElementById('deep')!, 'Enter')

      // Then: ゲームの Enter は呼ばれない
      expect(mockHandlers.onEnterPress).not.toHaveBeenCalled()
    })

    it('KB-N-01: ダイアログ以外の role の中で Enter を押したときは、従来どおりゲームの Enter にする', () => {
      // Given: role="region" の中の要素
      renderHook(() => useKeyboardControls(mockHandlers))
      mount('<div role="region"><span id="r">はたけ</span></div>')

      // When: その要素で Enter
      keydownOn(document.getElementById('r')!, 'Enter')

      // Then: ゲームの Enter が1回呼ばれる
      expect(mockHandlers.onEnterPress).toHaveBeenCalledTimes(1)
    })

    it('KB-B-02: document で発生したキー（要素ではない target）でも例外を出さずに扱う', () => {
      // Given: tagName も closest も持たない target
      renderHook(() => useKeyboardControls(mockHandlers))

      // When: document で Enter
      expect(() => keydownOn(document, 'Enter')).not.toThrow()

      // Then: ゲームの Enter が1回呼ばれる
      expect(mockHandlers.onEnterPress).toHaveBeenCalledTimes(1)
    })
  })
})