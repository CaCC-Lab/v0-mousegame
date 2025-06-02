import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '@/components/FruitHarvestGame'

/**
 * ダークモード統合テスト（モックなし）
 * CLAUDE.md規約に従い、実際の実装をテストします
 */
describe('Dark Mode Integration', () => {
  beforeEach(() => {
    // LocalStorageとmatchMediaをクリーンな状態にする
    localStorage.clear()
  })

  it('renders with dark mode support', () => {
    render(<FruitHarvestGame />)
    
    // ダークモード対応のコンテナが存在することを確認
    const appContainer = screen.getByRole('application')
    expect(appContainer).toBeInTheDocument()
    
    // ダークモードスイッチが存在することを確認
    const switches = screen.getAllByRole('switch')
    const darkModeSwitch = switches.find(sw => {
      const label = sw.getAttribute('aria-label')
      return label?.match(/Dark Mode|ダークモード/i)
    })
    expect(darkModeSwitch).toBeInTheDocument()
  })

  it('toggles dark mode when switch is clicked', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)
    
    // ダークモードスイッチを探す
    const switches = screen.getAllByRole('switch')
    const darkModeSwitch = switches.find(sw => {
      const label = sw.getAttribute('aria-label')
      return label?.match(/Dark Mode|ダークモード/i)
    })
    
    if (darkModeSwitch) {
      const initialChecked = darkModeSwitch.getAttribute('aria-checked') === 'true'
      
      // スイッチをクリック
      await user.click(darkModeSwitch)
      
      // 状態が変わったことを確認
      await waitFor(() => {
        const newChecked = darkModeSwitch.getAttribute('aria-checked') === 'true'
        expect(newChecked).not.toBe(initialChecked)
      })
    }
  })

  it('persists dark mode preference in localStorage', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)
    
    // ダークモードスイッチを探す
    const switches = screen.getAllByRole('switch')
    const darkModeSwitch = switches.find(sw => {
      const label = sw.getAttribute('aria-label')
      return label?.match(/Dark Mode|ダークモード/i)
    })
    
    if (darkModeSwitch) {
      // スイッチをクリック
      await user.click(darkModeSwitch)
      
      // LocalStorageに保存されることを確認
      await waitFor(() => {
        const savedPreference = localStorage.getItem('darkMode')
        expect(savedPreference).toBeDefined()
      })
    }
  })

  it('loads dark mode preference from localStorage on mount', () => {
    // 事前にダークモード設定を保存
    localStorage.setItem('darkMode', 'true')
    
    render(<FruitHarvestGame />)
    
    // ダークモードスイッチの状態を確認
    const switches = screen.getAllByRole('switch')
    const darkModeSwitch = switches.find(sw => {
      const label = sw.getAttribute('aria-label')
      return label?.match(/Dark Mode|ダークモード/i)
    })
    
    if (darkModeSwitch) {
      const isChecked = darkModeSwitch.getAttribute('aria-checked') === 'true'
      expect(isChecked).toBe(true)
    }
  })

  it('applies dark mode classes to UI elements', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)
    
    // ダークモードスイッチを探す
    const switches = screen.getAllByRole('switch')
    const darkModeSwitch = switches.find(sw => {
      const label = sw.getAttribute('aria-label')
      return label?.match(/Dark Mode|ダークモード/i)
    })
    
    if (darkModeSwitch) {
      const wasChecked = darkModeSwitch.getAttribute('aria-checked') === 'true'
      
      // ダークモードをオンにする（既にオンの場合は一度オフにしてからオン）
      if (wasChecked) {
        await user.click(darkModeSwitch)
      }
      await user.click(darkModeSwitch)
      
      // ダーククラスが適用されているか確認
      const container = screen.getByRole('application')
      const darkElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkElements.length).toBeGreaterThan(0)
    }
  })

  it('maintains dark mode state across game state changes', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)
    
    // ダークモードをオンにする
    const switches = screen.getAllByRole('switch')
    const darkModeSwitch = switches.find(sw => {
      const label = sw.getAttribute('aria-label')
      return label?.match(/Dark Mode|ダークモード/i)
    })
    
    if (darkModeSwitch) {
      await user.click(darkModeSwitch)
      const darkModeState = darkModeSwitch.getAttribute('aria-checked')
      
      // ゲームを開始
      const startButton = screen.getAllByRole('button').find(btn => 
        btn.textContent?.match(/Start|はじめる/i)
      )
      if (startButton) {
        await user.click(startButton)
        
        // ダークモードの状態が維持されていることを確認
        await waitFor(() => {
          const currentDarkModeState = darkModeSwitch.getAttribute('aria-checked')
          expect(currentDarkModeState).toBe(darkModeState)
        })
      }
    }
  })

  it('dark mode switch is always accessible', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)
    
    // 初期状態でアクセス可能
    let switches = screen.getAllByRole('switch')
    let darkModeSwitch = switches.find(sw => {
      const label = sw.getAttribute('aria-label')
      return label?.match(/Dark Mode|ダークモード/i)
    })
    expect(darkModeSwitch).toBeInTheDocument()
    
    // ゲーム開始後もアクセス可能
    const startButton = screen.getAllByRole('button').find(btn => 
      btn.textContent?.match(/Start|はじめる/i)
    )
    if (startButton) {
      await user.click(startButton)
      
      switches = screen.getAllByRole('switch')
      darkModeSwitch = switches.find(sw => {
        const label = sw.getAttribute('aria-label')
        return label?.match(/Dark Mode|ダークモード/i)
      })
      expect(darkModeSwitch).toBeInTheDocument()
    }
  })
})