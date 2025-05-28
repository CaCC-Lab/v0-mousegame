import { test, expect } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'

test.describe('Electron App E2E Tests', () => {
  let electronApp: any
  let window: any

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '..', 'electron', 'main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    })
    
    // Wait for the first window
    window = await electronApp.firstWindow()
    
    // Wait for the app to load
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    // Close the app
    await electronApp.close()
  })

  test('should launch the Electron app', async () => {
    // Check if window is visible
    const isVisible = await window.isVisible()
    expect(isVisible).toBe(true)
    
    // Check window title
    const title = await window.title()
    expect(title).toContain('フルーツハーベストゲーム')
  })

  test('should have correct window dimensions', async () => {
    // Get window bounds
    const bounds = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0]
      return mainWindow.getBounds()
    })
    
    // Check dimensions
    expect(bounds.width).toBe(1200)
    expect(bounds.height).toBe(800)
  })

  test('should have application menu', async () => {
    // Get menu
    const menu = await electronApp.evaluate(async ({ Menu }) => {
      const appMenu = Menu.getApplicationMenu()
      return appMenu ? appMenu.items.map((item: any) => item.label) : []
    })
    
    // Check menu items
    expect(menu).toContain('ファイル')
    expect(menu).toContain('編集')
    expect(menu).toContain('表示')
    expect(menu).toContain('ヘルプ')
  })

  test('should handle new game menu action', async () => {
    // Trigger new game from menu
    await electronApp.evaluate(async ({ Menu }) => {
      const appMenu = Menu.getApplicationMenu()
      const fileMenu = appMenu?.items.find((item: any) => item.label === 'ファイル')
      const newGameItem = fileMenu?.submenu?.items.find((item: any) => item.label === '新しいゲーム')
      newGameItem?.click()
    })
    
    // Wait for the action to process
    await window.waitForTimeout(500)
    
    // Check if game is reset (score should be 0)
    const scoreText = await window.locator('text=/得点:|Score:/').textContent()
    expect(scoreText).toContain('0')
  })

  test('should toggle fullscreen', async () => {
    // Get initial fullscreen state
    const initialFullscreen = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0]
      return mainWindow.isFullScreen()
    })
    
    expect(initialFullscreen).toBe(false)
    
    // Toggle fullscreen via menu
    await electronApp.evaluate(async ({ Menu }) => {
      const appMenu = Menu.getApplicationMenu()
      const viewMenu = appMenu?.items.find((item: any) => item.label === '表示')
      const fullscreenItem = viewMenu?.submenu?.items.find((item: any) => item.label === 'フルスクリーン')
      fullscreenItem?.click()
    })
    
    // Check if fullscreen is enabled
    const isFullscreen = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0]
      return mainWindow.isFullScreen()
    })
    
    expect(isFullscreen).toBe(true)
    
    // Toggle back
    await electronApp.evaluate(async ({ Menu }) => {
      const appMenu = Menu.getApplicationMenu()
      const viewMenu = appMenu?.items.find((item: any) => item.label === '表示')
      const fullscreenItem = viewMenu?.submenu?.items.find((item: any) => item.label === 'フルスクリーン')
      fullscreenItem?.click()
    })
  })

  test('should handle window close properly', async () => {
    // Create a new window
    const newWindow = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })
      return win.id
    })
    
    // Close the window
    await electronApp.evaluate(async ({ BrowserWindow }, windowId) => {
      const win = BrowserWindow.fromId(windowId)
      win?.close()
    }, newWindow)
    
    // Check if window is closed
    const windows = await electronApp.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows().length
    })
    
    expect(windows).toBe(1) // Only main window should remain
  })
})