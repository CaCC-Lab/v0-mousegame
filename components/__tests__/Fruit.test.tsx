import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { Fruit } from '../Fruit'
import { Fruit as FruitType } from '@/types/game'

/**
 * Fruitコンポーネントの実装テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('Fruit', () => {
  const mockFruit: FruitType = {
    id: 1,
    type: 'apple',
    size: 'medium',
    x: 50,
    y: 50,
    dx: 10,
    dy: 10,
  }

  const mockHandlers = {
    onClick: jest.fn(),
    onDoubleClick: jest.fn(),
    onMouseDown: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  /** スプライト画像を種類で取得する（altは装飾用に空なのでsrcで判定） */
  const spriteOf = (container: HTMLElement, type: string) =>
    container.querySelector(`img[src*="${type}"]`)

  it('renders fruit with correct sprite', () => {
    const { container } = render(<Fruit fruit={mockFruit} {...mockHandlers} />)

    expect(spriteOf(container, 'apple')).toBeInTheDocument()
  })

  it('applies correct size class', () => {
    const { container, rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('text-4xl') // medium size

    // IDを変更して再レンダリングを強制
    rerender(
      <Fruit fruit={{ ...mockFruit, id: 2, size: 'small' }} {...mockHandlers} />
    )
    const newElement = container.firstChild as HTMLElement
    expect(newElement.className).toContain('text-3xl') // small size

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 3, size: 'large' }} {...mockHandlers} />
    )
    const largeElement = container.firstChild as HTMLElement
    expect(largeElement.className).toContain('text-5xl') // large size
  })

  it('positions fruit correctly', () => {
    const { container } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const fruitElement = container.firstChild as HTMLElement
    expect(fruitElement.style.left).toBe('50%')
    expect(fruitElement.style.top).toBe('50%')
  })

  it('handles click event', () => {
    render(<Fruit fruit={mockFruit} {...mockHandlers} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockHandlers.onClick).toHaveBeenCalledTimes(1)
  })

  it('handles double click event', () => {
    render(<Fruit fruit={mockFruit} {...mockHandlers} />)
    
    fireEvent.doubleClick(screen.getByRole('button'))
    expect(mockHandlers.onDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('handles mouse down event', () => {
    render(<Fruit fruit={mockFruit} {...mockHandlers} />)
    
    fireEvent.mouseDown(screen.getByRole('button'))
    expect(mockHandlers.onMouseDown).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mousedown'
      })
    )
  })

  it('does not re-render when props do not change', () => {
    const { container, rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const firstRender = container.innerHTML
    
    rerender(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    expect(container.innerHTML).toBe(firstRender)
  })

  it('renders different sprites for different fruit types', () => {
    const { container, rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )

    expect(spriteOf(container, 'apple')).toBeInTheDocument()

    // IDを変更して再レンダリングを強制
    rerender(
      <Fruit fruit={{ ...mockFruit, id: 2, type: 'blueberry' }} {...mockHandlers} />
    )
    expect(spriteOf(container, 'blueberry')).toBeInTheDocument()

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 3, type: 'lemon' }} {...mockHandlers} />
    )
    expect(spriteOf(container, 'lemon')).toBeInTheDocument()

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 4, type: 'watermelon' }} {...mockHandlers} />
    )
    expect(spriteOf(container, 'watermelon')).toBeInTheDocument()
  })

  describe('フルーツ種類ごとの操作', () => {
    it('handles different fruit types with appropriate interactions', () => {
      const { rerender } = render(
        <Fruit fruit={mockFruit} {...mockHandlers} />
      )
      
      // りんご - 通常のクリック
      fireEvent.click(screen.getByRole('button'))
      expect(mockHandlers.onClick).toHaveBeenCalled()
      
      // ブルーベリー - ダブルクリック
      rerender(
        <Fruit fruit={{ ...mockFruit, id: 2, type: 'blueberry' }} {...mockHandlers} />
      )
      fireEvent.doubleClick(screen.getByRole('button'))
      expect(mockHandlers.onDoubleClick).toHaveBeenCalled()
      
      // レモン - マウスダウン（長押しシミュレート）
      rerender(
        <Fruit fruit={{ ...mockFruit, id: 3, type: 'lemon' }} {...mockHandlers} />
      )
      fireEvent.mouseDown(screen.getByRole('button'))
      expect(mockHandlers.onMouseDown).toHaveBeenCalled()
      
      // スイカ - マウスダウン（ドラッグ開始）
      rerender(
        <Fruit fruit={{ ...mockFruit, id: 4, type: 'watermelon' }} {...mockHandlers} />
      )
      fireEvent.mouseDown(screen.getByRole('button'))
      expect(mockHandlers.onMouseDown).toHaveBeenCalled()
    })
  })

  it('has correct accessibility attributes', () => {
    const { container } = render(<Fruit fruit={mockFruit} {...mockHandlers} />)

    // The root element (motion.div) should have absolute positioning
    const rootElement = container.firstChild as HTMLElement
    expect(rootElement.className).toContain('absolute')

    // キーボードとスクリーンリーダーから操作できること
    expect(rootElement).toHaveAttribute('role', 'button')
    expect(rootElement).toHaveAttribute('tabindex', '0')
    // 支援技術には日本語の名前が伝わること
    expect(rootElement.getAttribute('aria-label')).toContain('りんご')

    // スプライト画像は装飾扱い（ルートのaria-labelと二重に読ませない）
    const sprite = spriteOf(container, 'apple')
    expect(sprite).toHaveAttribute('alt', '')
  })

  it('updates position when fruit moves', () => {
    const { rerender, container } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const fruitElement = container.firstChild as HTMLElement
    expect(fruitElement.style.left).toBe('50%')
    expect(fruitElement.style.top).toBe('50%')
    
    // 位置を更新
    const movedFruit = { ...mockFruit, x: 75, y: 25 }
    rerender(<Fruit fruit={movedFruit} {...mockHandlers} />)
    
    expect(fruitElement.style.left).toBe('75%')
    expect(fruitElement.style.top).toBe('25%')
  })
})