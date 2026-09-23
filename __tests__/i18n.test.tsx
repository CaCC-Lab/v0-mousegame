import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../components/FruitHarvestGame'

/**
 * 待機中は言語の切り替えが「せってい」の中にある（v1.1 計画 D6）。
 * 得点・時間などのヘッダは遊んでいる間だけ出る。
 * ブラウザの言語が日本語以外なら英語で始める（v1.1 計画 D8）。
 */
type User = ReturnType<typeof userEvent.setup>

const openSettings = async (user: User) => {
  await user.click(screen.getByRole('button', { name: /せってい|Settings/ }))
}

const languageButton = () => screen.getByRole('button', { name: /language/i })

const title = () => screen.getByRole('heading', { level: 1 })

describe('Internationalization (i18n)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window.navigator, 'language', {
      value: 'ja-JP',
      configurable: true,
    })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  describe('Language Toggle', () => {
    test('should have language toggle in the settings', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      await openSettings(user)

      expect(languageButton()).toBeInTheDocument()
    })

    test('should display current language', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      await openSettings(user)

      expect(languageButton()).toHaveTextContent('日本語')
    })

    test('should toggle between Japanese and English', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      await openSettings(user)

      expect(title()).toHaveTextContent('フルーツハーベストゲーム')

      await user.click(languageButton())
      await waitFor(() => expect(title()).toHaveTextContent('Fruit Harvest Game'))

      await user.click(languageButton())
      await waitFor(() => expect(title()).toHaveTextContent('フルーツハーベストゲーム'))
    })
  })

  describe('Language Persistence', () => {
    test('should save language preference to localStorage', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      await openSettings(user)

      await user.click(languageButton())
      expect(window.localStorage.getItem('fruitHarvestLanguage')).toBe('"en"')

      await user.click(languageButton())
      expect(window.localStorage.getItem('fruitHarvestLanguage')).toBe('"ja"')
    })

    test('should restore language preference from localStorage', () => {
      window.localStorage.setItem('fruitHarvestLanguage', '"en"')

      render(<FruitHarvestGame />)

      expect(title()).toHaveTextContent('Fruit Harvest Game')
    })
  })

  describe('UI Text Translations', () => {
    test('should translate game controls in Japanese', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)

      expect(screen.getByText('はじめる')).toBeInTheDocument()
      expect(screen.getByText('あそびかた')).toBeInTheDocument()
      await openSettings(user)
      expect(screen.getByText('うごくモード')).toBeInTheDocument()
    })

    test('should translate game controls in English', async () => {
      const user = userEvent.setup()
      window.localStorage.setItem('fruitHarvestLanguage', '"en"')

      render(<FruitHarvestGame />)

      expect(screen.getByText('Start')).toBeInTheDocument()
      expect(screen.getByText('How to Play')).toBeInTheDocument()
      await openSettings(user)
      expect(screen.getByText('Moving Mode')).toBeInTheDocument()
    })

    test('should translate time format', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)
      await user.click(screen.getByTestId('mode-start'))

      // Japanese format (1分00秒)
      expect(screen.getByText(/\d+分\d+秒/)).toBeInTheDocument()

      // 遊んでいる間は言語の切り替えが操作列にある
      await user.click(languageButton())

      await waitFor(() => {
        expect(screen.getByText(/\d+:\d{2}/)).toBeInTheDocument()
      })
    })

    test('should translate pause/resume text', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)

      await user.click(screen.getByText('はじめる'))
      expect(screen.getByText('ちゅうだん')).toBeInTheDocument()

      await user.click(screen.getByText('ちゅうだん'))
      expect(screen.getByText('さいかい')).toBeInTheDocument()
    })
  })

  describe('Help Dialog Translations', () => {
    test('should translate help dialog content', async () => {
      const user = userEvent.setup()
      render(<FruitHarvestGame />)

      await user.click(screen.getByText('あそびかた'))

      // 絵文字とフルーツ名はカード上部に別要素で表示されるため、
      // 説明文は「🍎 りんご: 」の接頭辞を除いた本文で照合する（HelpDialog参照）
      await waitFor(() => {
        expect(screen.getByText('フルーツあつめゲームのあそびかた')).toBeInTheDocument()
        expect(screen.getByText('🍓 フルーツのとりかた 🍓')).toBeInTheDocument()
        expect(screen.getByText(/マウスでカチッとクリックしてつかまえよう/)).toBeInTheDocument()
        expect(screen.getByText(/すばやく２かいクリック/)).toBeInTheDocument()
      })
    })

    test('should translate help dialog content in English', async () => {
      const user = userEvent.setup()
      Object.defineProperty(window.navigator, 'language', {
        value: 'en-US',
        configurable: true,
      })
      window.localStorage.setItem('fruitHarvestLanguage', '"en"')

      render(<FruitHarvestGame />)

      await waitFor(() => {
        expect(screen.getByText('How to Play')).toBeInTheDocument()
      })
      await user.click(screen.getByText('How to Play'))

      await waitFor(() => {
        expect(screen.getByText('How to Play Fruit Collecting Game')).toBeInTheDocument()
        expect(screen.getByText('🍓 How to Catch Fruits 🍓')).toBeInTheDocument()
        expect(screen.getByText(/Click once to catch it!/)).toBeInTheDocument()
        expect(screen.getByText(/Click twice quickly/)).toBeInTheDocument()
      })
    })
  })

  describe('System Language Detection', () => {
    test('should detect system language on initial load', () => {
      Object.defineProperty(window.navigator, 'language', {
        value: 'en-US',
        configurable: true,
      })

      render(<FruitHarvestGame />)

      expect(title()).toHaveTextContent('Fruit Harvest Game')
    })

    test('should fall back to English for languages other than Japanese (D8)', () => {
      Object.defineProperty(window.navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      })

      render(<FruitHarvestGame />)

      expect(title()).toHaveTextContent('Fruit Harvest Game')
    })

    test('should override system language with saved preference', () => {
      Object.defineProperty(window.navigator, 'language', {
        value: 'en-US',
        configurable: true,
      })
      window.localStorage.setItem('fruitHarvestLanguage', '"ja"')

      render(<FruitHarvestGame />)

      expect(title()).toHaveTextContent('フルーツハーベストゲーム')
    })
  })

  describe('URL language parameter (?lang=)', () => {
    const setSearch = (search: string) => {
      const url = new URL(window.location.href)
      url.search = search
      window.history.replaceState({}, '', url.toString())
    }

    afterEach(() => {
      setSearch('')
    })

    test('?lang=en forces English even on a Japanese browser', async () => {
      setSearch('?lang=en')
      render(<FruitHarvestGame />)
      await waitFor(() => expect(title()).toHaveTextContent('Fruit Harvest Game'))
    })

    test('?lang=en overrides a saved Japanese preference and persists it', async () => {
      window.localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
      setSearch('?lang=en')
      render(<FruitHarvestGame />)
      await waitFor(() =>
        expect(JSON.parse(window.localStorage.getItem('fruitHarvestLanguage') || '""')).toBe('en')
      )
    })

    test('invalid ?lang value is ignored', async () => {
      setSearch('?lang=fr')
      render(<FruitHarvestGame />)
      await waitFor(() => expect(title()).toHaveTextContent('フルーツハーベストゲーム'))
    })
  })
})
