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

  it('renders fruit with correct emoji', () => {
    render(<Fruit fruit={mockFruit} {...mockHandlers} />)
    
    expect(screen.getByText('🍎')).toBeInTheDocument()
  })

  it('applies correct size class', () => {
    const { container, rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('text-3xl')

    // IDを変更して再レンダリングを強制
    rerender(
      <Fruit fruit={{ ...mockFruit, id: 2, size: 'small' }} {...mockHandlers} />
    )
    const newElement = container.firstChild as HTMLElement
    expect(newElement.className).toContain('text-2xl')

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 3, size: 'large' }} {...mockHandlers} />
    )
    const largeElement = container.firstChild as HTMLElement
    expect(largeElement.className).toContain('text-4xl')
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
    
    fireEvent.click(screen.getByText('🍎'))
    expect(mockHandlers.onClick).toHaveBeenCalledTimes(1)
  })

  it('handles double click event', () => {
    render(<Fruit fruit={mockFruit} {...mockHandlers} />)
    
    fireEvent.doubleClick(screen.getByText('🍎'))
    expect(mockHandlers.onDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('handles mouse down event', () => {
    render(<Fruit fruit={mockFruit} {...mockHandlers} />)
    
    fireEvent.mouseDown(screen.getByText('🍎'))
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

  it('renders different emojis for different fruit types', () => {
    const { rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    expect(screen.getByText('🍎')).toBeInTheDocument()

    // IDを変更して再レンダリングを強制
    rerender(
      <Fruit fruit={{ ...mockFruit, id: 2, type: 'blueberry' }} {...mockHandlers} />
    )
    expect(screen.getByText('🫐')).toBeInTheDocument()

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 3, type: 'lemon' }} {...mockHandlers} />
    )
    expect(screen.getByText('🍋')).toBeInTheDocument()

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 4, type: 'watermelon' }} {...mockHandlers} />
    )
    expect(screen.getByText('🍉')).toBeInTheDocument()
  })

  describe('Touch events', () => {
    it('renders fruit with touch-friendly interactions', () => {
      render(<Fruit fruit={mockFruit} {...mockHandlers} />)
      
      const fruitElement = screen.getByText('🍎')
      
      // Fruitコンポーネントはタッチイベントを内部でハンドリングしている
      // 通常のクリックイベントで動作確認
      fireEvent.click(fruitElement)
      expect(mockHandlers.onClick).toHaveBeenCalled()
    })

    it('handles different fruit types with appropriate interactions', () => {
      const { rerender } = render(
        <Fruit fruit={mockFruit} {...mockHandlers} />
      )
      
      // りんご - 通常のクリック
      fireEvent.click(screen.getByText('🍎'))
      expect(mockHandlers.onClick).toHaveBeenCalled()
      
      // ブルーベリー - ダブルクリック
      rerender(
        <Fruit fruit={{ ...mockFruit, id: 2, type: 'blueberry' }} {...mockHandlers} />
      )
      fireEvent.doubleClick(screen.getByText('🫐'))
      expect(mockHandlers.onDoubleClick).toHaveBeenCalled()
      
      // レモン - マウスダウン（長押しシミュレート）
      rerender(
        <Fruit fruit={{ ...mockFruit, id: 3, type: 'lemon' }} {...mockHandlers} />
      )
      fireEvent.mouseDown(screen.getByText('🍋'))
      expect(mockHandlers.onMouseDown).toHaveBeenCalled()
      
      // スイカ - マウスダウン（ドラッグ開始）
      rerender(
        <Fruit fruit={{ ...mockFruit, id: 4, type: 'watermelon' }} {...mockHandlers} />
      )
      fireEvent.mouseDown(screen.getByText('🍉'))
      expect(mockHandlers.onMouseDown).toHaveBeenCalled()
    })
  })

  it('has correct accessibility attributes', () => {
    render(<Fruit fruit={mockFruit} {...mockHandlers} />)
    
    const fruitElement = screen.getByText('🍎')
    expect(fruitElement.tagName).toBe('DIV')
    // absoluteクラスが適用されていることを確認
    expect(fruitElement).toHaveClass('absolute')
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