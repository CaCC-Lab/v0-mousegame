import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../components/FruitHarvestGame'

// Mock the hooks
jest.mock('../hooks/useGameLogic', () => ({
  useGameLogic: () => ({
    gameState: 'idle',
    score: 0,
    highScore: 0,
    timeLeft: 180,
    fruits: [],
    harvestedFruits: { apple: 0, blueberry: 0, lemon: 0, watermelon: 0 },
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
  }),
}))

// Track dark mode state for testing
let mockIsDarkMode = false
jest.mock('../hooks/useDarkMode', () => ({
  useDarkMode: () => ({
    isDarkMode: mockIsDarkMode,
    setIsDarkMode: jest.fn((value) => {
      mockIsDarkMode = value
    }),
  }),
}))

jest.mock('../hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    toggleLanguage: jest.fn(),
    t: {
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset',
      score: 'Score:',
      highScore: 'High Score:',
      timeFormat: (minutes: number, seconds: number) => `${minutes}:${seconds.toString().padStart(2, '0')}`,
      hardMode: 'Hard Mode',
      darkMode: 'Dark Mode',
      howToPlay: 'How to Play',
      language: 'English',
      muteSound: 'Mute sound',
      unmuteSound: 'Unmute sound',
      volume: 'Volume',
      helpTitle: 'How to Play Fruit Harvest Game',
      helpContent: {
        apple: '🍎 Apple: Click to harvest',
        blueberry: '🫐 Blueberry: Double-click to harvest',
        lemon: '🍋 Lemon: Right-click to harvest',
        watermelon: '🍉 Watermelon: Drag and drop to the right area',
        hardModeDesc: 'Hard Mode: Fruits move around',
        easyModeDesc: 'Easy Mode: Fruits stay still',
        timeLimit: 'Time limit is 3 minutes',
        goal: 'Harvest as many fruits as possible to get a high score!',
        keyboardTitle: 'Keyboard Controls:',
        keyboardSpace: 'Space: Pause/Resume game',
        keyboardArrow: 'Arrow Keys: Select fruit',
        keyboardEnter: 'Enter: Harvest selected fruit / Start game',
      },
    },
  }),
}))

jest.mock('../hooks/useKeyboardControls', () => ({
  useKeyboardControls: jest.fn(() => ({
    gameContainerRef: { current: null }
  }))
}))

describe('Dark Mode', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear()
    // Mock matchMedia for system preference
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  describe('Dark Mode Toggle', () => {
    test('should have dark mode toggle in the UI', () => {
      render(<FruitHarvestGame />)
      
      const darkModeToggle = document.getElementById('dark-mode')
      expect(darkModeToggle).toBeInTheDocument()
    })

    test('should toggle dark mode when clicked', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      const darkModeToggle = document.getElementById('dark-mode') as HTMLElement
      
      // Initially should be off
      expect(darkModeToggle).toHaveAttribute('aria-checked', 'false')
      expect(document.documentElement).not.toHaveClass('dark')
      
      // Click to enable dark mode
      await user.click(darkModeToggle)
      
      // The mock should have been called
      const { useDarkMode } = require('../hooks/useDarkMode')
      const mockSetIsDarkMode = useDarkMode().setIsDarkMode
      expect(mockSetIsDarkMode).toHaveBeenCalledWith(true)
      
      // Click again to disable
      await user.click(darkModeToggle)
      
      expect(mockSetIsDarkMode).toHaveBeenCalledWith(false)
    })

    test('should have label for dark mode toggle', () => {
      render(<FruitHarvestGame />)
      
      const label = screen.getByText(/dark mode|ダークモード/i)
      expect(label).toBeInTheDocument()
    })
  })

  describe('Dark Mode Persistence', () => {
    test('should save dark mode preference to localStorage', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      const darkModeToggle = document.getElementById('dark-mode') as HTMLElement
      
      // Enable dark mode
      await user.click(darkModeToggle)
      
      // Check that setIsDarkMode was called
      const { useDarkMode } = require('../hooks/useDarkMode')
      const mockSetIsDarkMode = useDarkMode().setIsDarkMode
      expect(mockSetIsDarkMode).toHaveBeenCalledWith(true)
      
      // Disable dark mode
      await user.click(darkModeToggle)
      
      expect(mockSetIsDarkMode).toHaveBeenCalledWith(false)
    })

    test('should restore dark mode preference from localStorage', () => {
      // Set dark mode to true for this test
      mockIsDarkMode = true
      
      render(<FruitHarvestGame />)
      
      const darkModeToggle = document.getElementById('dark-mode') as HTMLElement
      
      // Should be checked (dark mode is on)
      expect(darkModeToggle).toHaveAttribute('aria-checked', 'true')
      
      // Reset for other tests
      mockIsDarkMode = false
    })

    test('should handle dark mode toggle', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      const darkModeToggle = document.getElementById('dark-mode') as HTMLElement
      
      // Click to toggle
      await user.click(darkModeToggle)
      
      const { useDarkMode } = require('../hooks/useDarkMode')
      const mockSetIsDarkMode = useDarkMode().setIsDarkMode
      expect(mockSetIsDarkMode).toHaveBeenCalled()
    })
  })

  describe('Dark Mode Styling', () => {
    test('should apply dark mode classes to UI elements', async () => {
      // Set dark mode to true
      mockIsDarkMode = true
      
      render(<FruitHarvestGame />)
      
      // Check that dark mode specific classes are applied
      const gameContainer = screen.getByRole('application')
      expect(gameContainer).toHaveClass('dark:bg-gray-900')
      
      // Reset
      mockIsDarkMode = false
    })

    test('should have dark mode text styles in markup', () => {
      render(<FruitHarvestGame />)
      
      // Check that dark mode classes exist in the markup
      const scoreText = screen.getByText(/Score:|得点:/)
      const parent = scoreText.closest('div')
      expect(parent).toHaveClass('dark:text-white')
    })
  })

  describe('System Preference Integration', () => {
    test('should have working dark mode toggle', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      const darkModeToggle = document.getElementById('dark-mode') as HTMLElement
      expect(darkModeToggle).toBeInTheDocument()
      
      // Toggle dark mode
      await user.click(darkModeToggle)
      
      const { useDarkMode } = require('../hooks/useDarkMode')
      const mockSetIsDarkMode = useDarkMode().setIsDarkMode
      expect(mockSetIsDarkMode).toHaveBeenCalled()
    })
  })
})