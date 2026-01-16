import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../components/FruitHarvestGame'

describe('Internationalization (i18n)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear()
    // Mock navigator.language
    Object.defineProperty(window.navigator, 'language', {
      value: 'ja-JP',
      configurable: true,
    })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  describe('Language Toggle', () => {
    test('should have language toggle in the UI', () => {
      render(<FruitHarvestGame />)
      
      const languageToggle = screen.getByRole('button', { name: /language|言語|en|ja/i })
      expect(languageToggle).toBeInTheDocument()
    })

    test('should display current language', () => {
      render(<FruitHarvestGame />)
      
      // Should show current language (default Japanese) - button shows JA
      const languageButton = screen.getByRole('button', { name: /language/i })
      expect(languageButton).toHaveTextContent(/JA/i)
    })

    test('should toggle between Japanese and English', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      const languageToggle = screen.getByRole('button', { name: /language|言語|en|ja/i })
      
      // Initially in Japanese
      expect(screen.getAllByText(/得点:/).length).toBeGreaterThan(0)
      expect(screen.getByText(/最高得点:/)).toBeInTheDocument()
      
      // Click to switch to English
      await user.click(languageToggle)
      
      await waitFor(() => {
        expect(screen.getAllByText(/Score:/).length).toBeGreaterThan(0)
        expect(screen.getByText(/High Score:/)).toBeInTheDocument()
      })
      
      // Click again to switch back to Japanese
      await user.click(languageToggle)
      
      await waitFor(() => {
        expect(screen.getAllByText(/得点:/).length).toBeGreaterThan(0)
        expect(screen.getByText(/最高得点:/)).toBeInTheDocument()
      })
    })
  })

  describe('Language Persistence', () => {
    test('should save language preference to localStorage', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      const languageToggle = screen.getByRole('button', { name: /language|言語|en|ja/i })
      
      // Switch to English
      await user.click(languageToggle)
      
      // Check localStorage (should be JSON stringified)
      expect(window.localStorage.getItem('fruitHarvestLanguage')).toBe('"en"')
      
      // Switch back to Japanese
      await user.click(languageToggle)
      
      // Check localStorage (should be JSON stringified)
      expect(window.localStorage.getItem('fruitHarvestLanguage')).toBe('"ja"')
    })

    test('should restore language preference from localStorage', () => {
      // Set English in localStorage (JSON stringified)
      window.localStorage.setItem('fruitHarvestLanguage', '"en"')
      
      render(<FruitHarvestGame />)
      
      // Should be in English
      expect(screen.getAllByText(/Score:/).length).toBeGreaterThan(0)
      expect(screen.getByText(/High Score:/)).toBeInTheDocument()
    })
  })

  describe('UI Text Translations', () => {
    test('should translate game controls in Japanese', () => {
      render(<FruitHarvestGame />)
      
      expect(screen.getByText('はじめる')).toBeInTheDocument()
      expect(screen.getByText('リセット')).toBeInTheDocument()
      expect(screen.getByText('むずかしいモード')).toBeInTheDocument()
      expect(screen.getByText('あそびかた')).toBeInTheDocument()
    })

    test('should translate game controls in English', async () => {
      const user = userEvent.setup()
      // Set to English (JSON stringified)
      window.localStorage.setItem('fruitHarvestLanguage', '"en"')
      
      render(<FruitHarvestGame />)
      
      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('Reset')).toBeInTheDocument()
      expect(screen.getByText('Hard Mode')).toBeInTheDocument()
      expect(screen.getByText('How to Play')).toBeInTheDocument()
    })

    test('should translate time format', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      // Japanese format (1分00秒)
      expect(screen.getByText(/\d+分\d+秒/)).toBeInTheDocument()
      
      // Switch to English
      const languageToggle = screen.getByRole('button', { name: /language|言語|en|ja/i })
      await user.click(languageToggle)
      
      // English format (1:00)
      await waitFor(() => {
        expect(screen.getByText(/\d+:\d{2}/)).toBeInTheDocument()
      })
    })

    test('should translate pause/resume text', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      // Start game
      const startButton = screen.getByText('はじめる')
      await user.click(startButton)
      
      // Should show pause text in Japanese
      expect(screen.getByText('ちゅうだん')).toBeInTheDocument()
      
      // Pause game
      const pauseButton = screen.getByText('ちゅうだん')
      await user.click(pauseButton)
      
      // Should show resume text in Japanese
      expect(screen.getByText('さいかい')).toBeInTheDocument()
    })
  })

  describe('Help Dialog Translations', () => {
    test('should translate help dialog content', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      
      // Open help dialog
      const helpButton = screen.getByText('あそびかた')
      await user.click(helpButton)
      
      // Check Japanese content
      await waitFor(() => {
        expect(screen.getByText('フルーツハーベストゲームのあそびかた')).toBeInTheDocument()
        expect(screen.getByText(/🍎 りんご: クリックして収穫/)).toBeInTheDocument()
        expect(screen.getByText(/制限時間は3分間です/)).toBeInTheDocument()
      })
    })

    test('should translate help dialog content in English', async () => {
      const user = userEvent.setup()

      // Set English system language before rendering
      Object.defineProperty(window.navigator, 'language', {
        value: 'en-US',
        configurable: true,
      })

      // Set to English in localStorage (JSON stringified)
      window.localStorage.setItem('fruitHarvestLanguage', '"en"')

      render(<FruitHarvestGame />)

      // Open help dialog - wait for English button
      await waitFor(() => {
        expect(screen.getByText('How to Play')).toBeInTheDocument()
      })

      const helpButton = screen.getByText('How to Play')
      await user.click(helpButton)

      // Check English content
      await waitFor(() => {
        expect(screen.getByText('How to Play Fruit Collecting Game')).toBeInTheDocument()
        expect(screen.getByText(/🍎 Apple: Click once to catch it!/)).toBeInTheDocument()
        expect(screen.getByText(/You have 3 minutes!/)).toBeInTheDocument()
      })
    })
  })

  describe('System Language Detection', () => {
    test('should detect system language on initial load', () => {
      // Mock English system language
      Object.defineProperty(window.navigator, 'language', {
        value: 'en-US',
        configurable: true,
      })
      
      render(<FruitHarvestGame />)
      
      // Should default to English
      expect(screen.getAllByText(/Score:/).length).toBeGreaterThan(0)
    })

    test('should fallback to Japanese for unsupported languages', () => {
      // Mock unsupported language
      Object.defineProperty(window.navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      })
      
      render(<FruitHarvestGame />)
      
      // Should fallback to Japanese
      expect(screen.getAllByText(/得点:/).length).toBeGreaterThan(0)
    })

    test('should override system language with saved preference', () => {
      // System is English
      Object.defineProperty(window.navigator, 'language', {
        value: 'en-US',
        configurable: true,
      })
      
      // But user preference is Japanese (JSON stringified)
      window.localStorage.setItem('fruitHarvestLanguage', '"ja"')
      
      render(<FruitHarvestGame />)
      
      // Should use Japanese
      expect(screen.getAllByText(/得点:/).length).toBeGreaterThan(0)
    })
  })
})