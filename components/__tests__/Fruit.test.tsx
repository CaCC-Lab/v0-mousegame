import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Fruit } from '../Fruit'
import { Fruit as FruitType } from '@/types/game'

// Track the handlers passed to useTouchEvents
let capturedHandlers: Parameters<typeof import('@/hooks/useTouchEvents').useTouchEvents>[1] | null = null

// Mock the useTouchEvents hook
jest.mock('@/hooks/useTouchEvents', () => ({
  useTouchEvents: jest.fn((element, handlers) => {
    // Capture handlers regardless of whether element is null
    capturedHandlers = handlers
  })
}))

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
    capturedHandlers = null
  })

  it('should render fruit with correct emoji', () => {
    const { getByText } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    expect(getByText('🍎')).toBeInTheDocument()
  })

  it('should apply correct size class', () => {
    const { container, rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('text-3xl')

    rerender(
      <Fruit fruit={{ ...mockFruit, size: 'small' }} {...mockHandlers} />
    )
    expect(element.className).toContain('text-3xl') // Still medium because React.memo prevents re-render

    // Force a re-render by changing the id
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

  it('should position fruit correctly', () => {
    const { container } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const fruitElement = container.firstChild as HTMLElement
    expect(fruitElement.style.left).toBe('50%')
    expect(fruitElement.style.top).toBe('50%')
  })

  it('should handle click event', () => {
    const { getByText } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    fireEvent.click(getByText('🍎'))
    expect(mockHandlers.onClick).toHaveBeenCalledTimes(1)
  })

  it('should handle double click event', () => {
    const { getByText } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    fireEvent.doubleClick(getByText('🍎'))
    expect(mockHandlers.onDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('should handle mouse down event', () => {
    const { getByText } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    fireEvent.mouseDown(getByText('🍎'))
    expect(mockHandlers.onMouseDown).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mousedown'
      })
    )
  })

  it('should not re-render when props do not change', () => {
    const { container, rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    const firstRender = container.innerHTML
    
    rerender(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    expect(container.innerHTML).toBe(firstRender)
  })

  it('should render different emojis for different fruit types', () => {
    const { getByText, rerender } = render(
      <Fruit fruit={mockFruit} {...mockHandlers} />
    )
    
    expect(getByText('🍎')).toBeInTheDocument()

    // Force re-render by changing id along with type
    rerender(
      <Fruit fruit={{ ...mockFruit, id: 2, type: 'blueberry' }} {...mockHandlers} />
    )
    expect(getByText('🫐')).toBeInTheDocument()

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 3, type: 'lemon' }} {...mockHandlers} />
    )
    expect(getByText('🍋')).toBeInTheDocument()

    rerender(
      <Fruit fruit={{ ...mockFruit, id: 4, type: 'watermelon' }} {...mockHandlers} />
    )
    expect(getByText('🍉')).toBeInTheDocument()
  })

  describe('Touch events', () => {
    it('should set up touch handlers for apple (tap)', () => {
      render(
        <Fruit fruit={mockFruit} {...mockHandlers} />
      )
      
      expect(capturedHandlers).toBeDefined()
      expect(capturedHandlers.onTap).toBeDefined()
      
      // Simulate tap
      capturedHandlers.onTap({ x: 100, y: 100 })
      expect(mockHandlers.onClick).toHaveBeenCalled()
    })

    it('should set up touch handlers for blueberry (double tap)', () => {
      render(
        <Fruit fruit={{ ...mockFruit, type: 'blueberry' }} {...mockHandlers} />
      )
      
      expect(capturedHandlers.onDoubleTap).toBeDefined()
      
      // Simulate double tap
      capturedHandlers.onDoubleTap({ x: 100, y: 100 })
      expect(mockHandlers.onDoubleClick).toHaveBeenCalled()
    })

    it('should set up touch handlers for lemon (long press)', () => {
      render(
        <Fruit fruit={{ ...mockFruit, type: 'lemon' }} {...mockHandlers} />
      )
      
      expect(capturedHandlers.onLongPress).toBeDefined()
      
      // Simulate long press (right click equivalent)
      capturedHandlers.onLongPress({ x: 100, y: 100 })
      
      // We expect onMouseDown to be called with button: 2 (right click)
      expect(mockHandlers.onMouseDown).toHaveBeenCalledWith(
        expect.objectContaining({
          button: 2,
          preventDefault: expect.any(Function)
        })
      )
    })

    it('should set up touch handlers for watermelon (drag)', () => {
      render(
        <Fruit fruit={{ ...mockFruit, type: 'watermelon' }} {...mockHandlers} />
      )
      
      expect(capturedHandlers.onDragStart).toBeDefined()
      
      // Simulate drag start
      capturedHandlers.onDragStart({ x: 100, y: 100 })
      
      // We expect onMouseDown to be called for drag initiation
      expect(mockHandlers.onMouseDown).toHaveBeenCalledWith(
        expect.objectContaining({
          button: 0,
          clientX: 100,
          clientY: 100
        })
      )
    })
  })
})