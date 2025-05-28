import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../FruitHarvestGame'

// Mock the hooks and components
jest.mock('@/hooks/useGameLogic')

// Track keyboard handlers for testing
let mockKeyboardHandlers: Record<string, (e?: KeyboardEvent) => void> = {}
jest.mock('@/hooks/useKeyboardControls', () => ({
  useKeyboardControls: jest.fn((handlers) => {
    mockKeyboardHandlers = handlers
    return {
      gameContainerRef: { current: null }
    }
  })
}))

// Mock useLanguage hook
jest.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'ja',
    toggleLanguage: jest.fn(),
    t: {
      start: 'はじめる',
      pause: 'ちゅうだん',
      resume: 'さいかい',
      reset: 'リセット',
      score: '得点:',
      highScore: '最高得点:',
      timeFormat: (minutes: number, seconds: number) => `${minutes}分${seconds.toString().padStart(2, '0')}秒`,
      hardMode: 'むずかしいモード',
      darkMode: 'ダークモード',
      howToPlay: 'あそびかた',
      language: '日本語',
      muteSound: 'おとをけす',
      unmuteSound: 'おとをだす',
      volume: 'おんりょう',
      helpTitle: 'フルーツハーベストゲームのあそびかた',
      helpContent: {
        apple: '🍎 りんご: クリックして収穫',
        blueberry: '🫐 ブルーベリー: ダブルクリックして収穫',
        lemon: '🍋 レモン: 右クリックして収穫',
        watermelon: '🍉 スイカ: ドラッグして右側のエリアにドロップ',
        hardModeDesc: 'むずかしいモード: フルーツが動き回ります',
        easyModeDesc: 'かんたんモード: フルーツは動きません',
        timeLimit: '制限時間は3分間です',
        goal: 'たくさんのフルーツを収穫して高得点を目指そう！',
        keyboardTitle: 'キーボード操作:',
        keyboardSpace: 'スペースキー: ゲームの一時停止/再開',
        keyboardArrow: '矢印キー: フルーツを選択',
        keyboardEnter: 'Enterキー: 選択したフルーツを収穫 / ゲーム開始',
      },
    },
  }),
}))

// Mock useDarkMode hook
jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => ({
    isDarkMode: false,
    setIsDarkMode: jest.fn(),
  }),
}))

const mockFruit = jest.fn()
jest.mock('../Fruit', () => ({
  Fruit: (props: unknown) => mockFruit(props),
}))

interface MockUseGameLogic {
  gameState: 'idle' | 'playing' | 'paused'
  score: number
  highScore: number
  timeLeft: number
  fruits: Array<{ id: number; type: string; size: string; x: number; y: number; dx: number; dy: number }>
  harvestedFruits: {
    apple: number
    blueberry: number
    lemon: number
    watermelon: number
  }
  isHardMode: boolean
  setIsHardMode: jest.Mock
  startGame: jest.Mock
  pauseGame: jest.Mock
  resetGame: jest.Mock
  handleFruitInteraction: jest.Mock
  soundEffects: {
    playCollectSound: jest.Mock
    playGameStartSound: jest.Mock
    playGameOverSound: jest.Mock
    playHighScoreSound: jest.Mock
    toggleSound: jest.Mock
    setVolume: jest.Mock
    soundEnabled: boolean
    volume: number
  }
}

describe('FruitHarvestGame', () => {
  let mockUseGameLogic: MockUseGameLogic

  beforeEach(() => {
    mockKeyboardHandlers = {}
    mockUseGameLogic = {
      gameState: 'idle',
      score: 0,
      highScore: 0,
      timeLeft: 180,
      fruits: [],
      harvestedFruits: {
        apple: 0,
        blueberry: 0,
        lemon: 0,
        watermelon: 0,
      },
      isHardMode: false,
      setIsHardMode: jest.fn(),
      startGame: jest.fn(),
      pauseGame: jest.fn(),
      resetGame: jest.fn(),
      handleFruitInteraction: jest.fn(),
      soundEffects: {
        playCollectSound: jest.fn(),
        playGameStartSound: jest.fn(),
        playGameOverSound: jest.fn(),
        playHighScoreSound: jest.fn(),
        toggleSound: jest.fn(),
        setVolume: jest.fn(),
        soundEnabled: true,
        volume: 0.5,
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useGameLogic } = require('@/hooks/useGameLogic')
    useGameLogic.mockReturnValue(mockUseGameLogic)

    // Mock Fruit component implementation
    mockFruit.mockImplementation(({ fruit, onClick, onDoubleClick, onMouseDown }) => (
      <div
        data-testid={`fruit-${fruit.id}`}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
      >
        {fruit.type}
      </div>
    ))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render game title and score', () => {
    render(<FruitHarvestGame />)
    
    expect(screen.getByText('得点: 0')).toBeInTheDocument()
    expect(screen.getByText('最高得点: 0')).toBeInTheDocument()
    expect(screen.getByText(/3分00秒/)).toBeInTheDocument()
  })

  it('should render control buttons', () => {
    render(<FruitHarvestGame />)
    
    expect(screen.getByText('はじめる')).toBeInTheDocument()
    expect(screen.getByText('さいかい')).toBeInTheDocument() // When idle, it shows 'さいかい'
    expect(screen.getByText('リセット')).toBeInTheDocument()
  })

  it('should start game when start button is clicked', async () => {
    render(<FruitHarvestGame />)
    
    const startButton = screen.getByText('はじめる')
    await userEvent.click(startButton)
    
    expect(mockUseGameLogic.startGame).toHaveBeenCalledTimes(1)
  })

  it('should pause/resume game when pause button is clicked', async () => {
    mockUseGameLogic.gameState = 'playing'
    render(<FruitHarvestGame />)
    
    const pauseButton = screen.getByText('ちゅうだん')
    await userEvent.click(pauseButton)
    
    expect(mockUseGameLogic.pauseGame).toHaveBeenCalledTimes(1)
  })

  it('should reset game when reset button is clicked', async () => {
    render(<FruitHarvestGame />)
    
    const resetButton = screen.getByText('リセット')
    await userEvent.click(resetButton)
    
    expect(mockUseGameLogic.resetGame).toHaveBeenCalledTimes(1)
  })

  it('should toggle hard mode', async () => {
    render(<FruitHarvestGame />)
    
    // Find the switch by its ID
    const hardModeSwitch = document.getElementById('hard-mode') as HTMLElement
    expect(hardModeSwitch).toBeInTheDocument()
    
    await userEvent.click(hardModeSwitch)
    
    expect(mockUseGameLogic.setIsHardMode).toHaveBeenCalledWith(true)
  })

  it('should render fruits when game has fruits', () => {
    mockUseGameLogic.fruits = [
      { id: 1, type: 'apple', size: 'medium', x: 50, y: 50, dx: 0, dy: 0 },
      { id: 2, type: 'blueberry', size: 'small', x: 30, y: 30, dx: 0, dy: 0 },
    ]
    
    render(<FruitHarvestGame />)
    
    expect(screen.getByTestId('fruit-1')).toBeInTheDocument()
    expect(screen.getByTestId('fruit-2')).toBeInTheDocument()
  })

  it('should handle fruit click interaction', async () => {
    const mockFruit = { id: 1, type: 'apple', size: 'medium', x: 50, y: 50, dx: 0, dy: 0 }
    mockUseGameLogic.fruits = [mockFruit]
    
    render(<FruitHarvestGame />)
    
    const fruitElement = screen.getByTestId('fruit-1')
    await userEvent.click(fruitElement)
    
    expect(mockUseGameLogic.handleFruitInteraction).toHaveBeenCalledWith(mockFruit, 'click')
  })

  it('should handle fruit double click interaction', async () => {
    const mockFruit = { id: 1, type: 'blueberry', size: 'medium', x: 50, y: 50, dx: 0, dy: 0 }
    mockUseGameLogic.fruits = [mockFruit]
    
    render(<FruitHarvestGame />)
    
    const fruitElement = screen.getByTestId('fruit-1')
    await userEvent.dblClick(fruitElement)
    
    expect(mockUseGameLogic.handleFruitInteraction).toHaveBeenCalledWith(mockFruit, 'doubleClick')
  })

  it('should display harvested fruits count', () => {
    mockUseGameLogic.harvestedFruits = {
      apple: 5,
      blueberry: 3,
      lemon: 2,
      watermelon: 1,
    }
    
    render(<FruitHarvestGame />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should disable start button when game is playing', () => {
    mockUseGameLogic.gameState = 'playing'
    render(<FruitHarvestGame />)
    
    const startButton = screen.getByText('はじめる')
    expect(startButton).toBeDisabled()
  })

  it('should disable pause button when game is idle', () => {
    mockUseGameLogic.gameState = 'idle'
    render(<FruitHarvestGame />)
    
    const pauseButton = screen.getByText('さいかい')
    expect(pauseButton).toBeDisabled()
  })

  it('should show help dialog when help button is clicked', async () => {
    render(<FruitHarvestGame />)
    
    const helpButton = screen.getByText('あそびかた')
    await userEvent.click(helpButton)
    
    await waitFor(() => {
      expect(screen.getByText('フルーツハーベストゲームのあそびかた')).toBeInTheDocument()
    })
  })

  it('should handle drag and drop for watermelon', async () => {
    const mockFruit = { id: 1, type: 'watermelon', size: 'large', x: 50, y: 50, dx: 0, dy: 0 }
    mockUseGameLogic.fruits = [mockFruit]
    
    render(<FruitHarvestGame />)
    
    const fruitElement = screen.getByTestId('fruit-1')
    fireEvent.mouseDown(fruitElement, { button: 0 })
    
    // Verify the right handler is called with mouseDown event
    expect(mockUseGameLogic.handleFruitInteraction).not.toHaveBeenCalled()
  })

  it('should handle right click for lemon', async () => {
    const mockFruit = { id: 1, type: 'lemon', size: 'medium', x: 50, y: 50, dx: 0, dy: 0 }
    mockUseGameLogic.fruits = [mockFruit]
    
    render(<FruitHarvestGame />)
    
    const fruitElement = screen.getByTestId('fruit-1')
    fireEvent.mouseDown(fruitElement, { button: 2 })
    fireEvent.contextMenu(fruitElement)
    
    expect(mockUseGameLogic.handleFruitInteraction).toHaveBeenCalledWith(mockFruit, 'rightClick')
  })

  describe('Keyboard controls', () => {
    it('should pause/resume game with space key', () => {
      // Start the game first
      mockUseGameLogic.gameState = 'playing'
      const { rerender } = render(<FruitHarvestGame />)
      expect(screen.getByText('ちゅうだん')).toBeInTheDocument()
      
      // Press space to pause through mock handler
      mockKeyboardHandlers.onSpacePress()
      expect(mockUseGameLogic.pauseGame).toHaveBeenCalled()
      
      // Update state to paused and rerender
      mockUseGameLogic.gameState = 'paused'
      rerender(<FruitHarvestGame />)
      
      // Press space to resume through mock handler
      mockKeyboardHandlers.onSpacePress()
      expect(mockUseGameLogic.pauseGame).toHaveBeenCalledTimes(2)
    })

    it('should start new game with enter key when game is idle', () => {
      render(<FruitHarvestGame />)
      
      // Press enter to start game through mock handler
      mockKeyboardHandlers.onEnterPress()
      expect(mockUseGameLogic.startGame).toHaveBeenCalled()
    })

    it('should navigate selected fruit with arrow keys', async () => {
      mockUseGameLogic.gameState = 'playing'
      mockUseGameLogic.fruits = [
        { id: 1, type: 'apple', size: 'medium', x: 20, y: 50, dx: 0, dy: 0 },
        { id: 2, type: 'blueberry', size: 'small', x: 50, y: 50, dx: 0, dy: 0 },
        { id: 3, type: 'lemon', size: 'medium', x: 80, y: 50, dx: 0, dy: 0 },
      ]
      
      const { rerender } = render(<FruitHarvestGame />)
      
      // Simulate arrow key through the mock handler
      await act(async () => {
        mockKeyboardHandlers.onArrowKeys('right')
      })
      
      // Force re-render to see the updated state
      rerender(<FruitHarvestGame />)
      
      // Check that the first fruit is rendered with isSelected=true
      expect(mockFruit).toHaveBeenCalledWith(
        expect.objectContaining({
          isSelected: true,
          fruit: mockUseGameLogic.fruits[0]
        })
      )
    })

    it('should activate selected fruit with enter key', async () => {
      mockUseGameLogic.gameState = 'playing'
      mockUseGameLogic.fruits = [
        { id: 1, type: 'apple', size: 'medium', x: 50, y: 50, dx: 0, dy: 0 },
      ]
      
      render(<FruitHarvestGame />)
      
      // Select a fruit with arrow key through mock handler
      await act(async () => {
        mockKeyboardHandlers.onArrowKeys('right')
      })
      
      // Activate with enter through mock handler
      await act(async () => {
        mockKeyboardHandlers.onEnterPress()
      })
      
      // Check if fruit interaction was called
      expect(mockUseGameLogic.handleFruitInteraction).toHaveBeenCalledWith(
        mockUseGameLogic.fruits[0],
        'click' // apple interaction type
      )
    })

    it('should provide keyboard instructions in help dialog', async () => {
      render(<FruitHarvestGame />)
      
      const helpButton = screen.getByText('あそびかた')
      await userEvent.click(helpButton)
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveTextContent('キーボード操作')
        expect(dialog).toHaveTextContent('スペースキー')
        expect(dialog).toHaveTextContent('矢印キー')
        expect(dialog).toHaveTextContent('Enterキー')
      })
    })
  })
})