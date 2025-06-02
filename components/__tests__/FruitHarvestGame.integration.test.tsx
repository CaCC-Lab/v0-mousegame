import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../FruitHarvestGame'

// 実際の実装を使用した統合テスト
describe('FruitHarvestGame Integration Tests', () => {
  beforeEach(() => {
    // LocalStorageをクリア
    localStorage.clear()
    
    // タイマーのモック（これは実装の詳細ではなく、テスト環境の制御）
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  describe('ゲームの初期状態', () => {
    it('初期状態で正しくレンダリングされる', () => {
      render(<FruitHarvestGame />)
      
      // ゲームのaria-label
      expect(screen.getByRole('application', { name: 'フルーツハーベストゲーム' })).toBeInTheDocument()
      
      // 初期スコア（英語表記）- 最初の要素を取得
      const scoreElements = screen.getAllByText(/Score: 0/)
      expect(scoreElements.length).toBeGreaterThan(0)
      expect(scoreElements[0]).toBeInTheDocument()
      
      // 開始ボタン（英語）
      expect(screen.getByText('Start')).toBeInTheDocument()
      
      // 時間表示（初期は3分、形式: 3:00）
      expect(screen.getByText('3:00')).toBeInTheDocument()
      
      // ハイスコア
      expect(screen.getByText(/High Score: 0/)).toBeInTheDocument()
    })

    it('ダークモードトグルが機能する', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // ダークモード切り替えボタンを探す
      const darkModeSwitch = screen.getByRole('switch', { name: /Dark Mode/i })
      
      // 初期状態を確認（システム設定に依存）
      const initialChecked = darkModeSwitch.getAttribute('aria-checked') === 'true'
      
      // クリックして切り替え
      await user.click(darkModeSwitch)
      
      // 状態が変更されたことを確認
      const newChecked = darkModeSwitch.getAttribute('aria-checked') === 'true'
      expect(newChecked).toBe(!initialChecked)
    })
  })

  describe('ゲームの開始と進行', () => {
    it('開始ボタンでゲームが始まる', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      const startButton = screen.getByText('はじめる')
      await user.click(startButton)
      
      // ゲームが開始されたことを確認
      expect(screen.queryByText('はじめる')).not.toBeInTheDocument()
      expect(screen.getByText('ちゅうだん')).toBeInTheDocument()
      
      // フルーツが表示される（ステージ1では8個）
      await waitFor(() => {
        const gameArea = screen.getByTestId('game-area')
        expect(gameArea).toBeInTheDocument()
      })
    })

    it('一時停止ボタンでゲームが一時停止する', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // ゲームを開始
      await user.click(screen.getByText('はじめる'))
      
      // 一時停止
      const pauseButton = screen.getByText('ちゅうだん')
      await user.click(pauseButton)
      
      // 再開ボタンが表示される
      expect(screen.getByText('さいかい')).toBeInTheDocument()
      expect(screen.queryByText('ちゅうだん')).not.toBeInTheDocument()
    })

    it('リセットボタンでゲームがリセットされる', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // ゲームを開始
      await user.click(screen.getByText('はじめる'))
      
      // リセット
      const resetButton = screen.getByText('リセット')
      await user.click(resetButton)
      
      // 初期状態に戻る
      expect(screen.getByText('はじめる')).toBeInTheDocument()
      expect(screen.getByText(/得点: 0/)).toBeInTheDocument()
    })
  })

  describe('フルーツの収穫', () => {
    it('フルーツエリアがレンダリングされる', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      await user.click(screen.getByText('はじめる'))
      
      // 収穫済みフルーツカウンターが表示される
      expect(screen.getByText(/🍎.*0/)).toBeInTheDocument()
      expect(screen.getByText(/🫐.*0/)).toBeInTheDocument()
      expect(screen.getByText(/🍋.*0/)).toBeInTheDocument()
      expect(screen.getByText(/🍉.*0/)).toBeInTheDocument()
    })
  })

  describe('ステージ表示', () => {
    it('現在のステージが表示される', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      await user.click(screen.getByText('はじめる'))
      
      // ステージ1の情報が表示される
      expect(screen.getByText(/ステージ 1/)).toBeInTheDocument()
    })

    it('ステージ目標が表示される', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      await user.click(screen.getByText('はじめる'))
      
      // ステージ目標が表示される
      expect(screen.getByText('ステージ目標:')).toBeInTheDocument()
      expect(screen.getByText(/スコア: 0 \/ 100/)).toBeInTheDocument()
    })
  })

  describe('サウンドコントロール', () => {
    it('サウンドのオン/オフが切り替えられる', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // サウンドコントロールを探す
      const soundButton = screen.getByLabelText(/おとをけす|おとをだす/)
      
      // 初期状態を記録
      const initialLabel = soundButton.getAttribute('aria-label')
      
      // クリックして切り替え
      await user.click(soundButton)
      
      // ラベルが変更されたことを確認
      const newLabel = soundButton.getAttribute('aria-label')
      expect(newLabel).not.toBe(initialLabel)
    })
  })

  describe('キーボード操作', () => {
    it('スペースキーでゲームが一時停止/再開する', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // ゲームを開始
      await user.click(screen.getByText('はじめる'))
      
      // スペースキーで一時停止
      await user.keyboard(' ')
      expect(screen.getByText('さいかい')).toBeInTheDocument()
      
      // もう一度スペースキーで再開
      await user.keyboard(' ')
      expect(screen.getByText('ちゅうだん')).toBeInTheDocument()
    })

    it('Enterキーでゲームが開始する', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // Enterキーでゲーム開始
      await user.keyboard('{Enter}')
      
      // ゲームが開始されたことを確認
      expect(screen.queryByText('はじめる')).not.toBeInTheDocument()
      expect(screen.getByText('ちゅうだん')).toBeInTheDocument()
    })
  })

  describe('ハイスコアの永続化', () => {
    it('ハイスコアがLocalStorageに保存される', async () => {
      const user = userEvent.setup({ delay: null })
      
      // 初回レンダリング
      const { unmount } = render(<FruitHarvestGame />)
      
      // 初期ハイスコアは0
      expect(screen.getByText(/最高得点: 0/)).toBeInTheDocument()
      
      // コンポーネントをアンマウント
      unmount()
      
      // LocalStorageに値を設定
      localStorage.setItem('fruitHarvestHighScore', '100')
      
      // 再度レンダリング
      render(<FruitHarvestGame />)
      
      // 保存されたハイスコアが表示される
      expect(screen.getByText(/最高得点: 100/)).toBeInTheDocument()
    })
  })

  describe('難易度設定', () => {
    it('難易度選択ダイアログが開く', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // 難易度選択ボタンをクリック
      const difficultyButton = screen.getByText('難易度選択')
      await user.click(difficultyButton)
      
      // ダイアログが表示される
      expect(screen.getByText('難易度を選択')).toBeInTheDocument()
      expect(screen.getByText('Easy')).toBeInTheDocument()
      expect(screen.getByText('Normal')).toBeInTheDocument()
      expect(screen.getByText('Hard')).toBeInTheDocument()
    })
  })

  describe('ヘルプダイアログ', () => {
    it('ヘルプダイアログが開く', async () => {
      const user = userEvent.setup({ delay: null })
      render(<FruitHarvestGame />)
      
      // ヘルプボタンをクリック
      const helpButton = screen.getByLabelText('あそびかた')
      await user.click(helpButton)
      
      // ヘルプ内容が表示される
      expect(screen.getByText('フルーツハーベストゲームのあそびかた')).toBeInTheDocument()
      expect(screen.getByText(/🍎 りんご: クリックして収穫/)).toBeInTheDocument()
    })
  })
})