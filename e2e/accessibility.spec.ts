import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
  })

  test('should have no accessibility violations on initial load', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    })
  })

  test('should have proper ARIA labels', async ({ page }) => {
    // Check main game container
    const gameContainer = page.getByRole('application', { name: 'フルーツハーベストゲーム' })
    await expect(gameContainer).toHaveAttribute('aria-label', 'フルーツハーベストゲーム')
    
    // Check buttons have accessible names
    await expect(page.getByRole('button', { name: /はじめる|Start/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /リセット|Reset/ })).toBeVisible()
    
    // Check switches have labels
    const hardModeSwitch = page.getByRole('checkbox', { name: /うごくモード|Moving Mode/ })
    await expect(hardModeSwitch).toBeVisible()
  })

  test('should be keyboard navigable', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /はじめる|Start/ })

    // Tabを押していけば「はじめる」に到達できること。
    // 何回目で到達するかはDOM順に依存するため、回数は固定しない
    let reached = false
    for (let i = 0; i < 15 && !reached; i++) {
      await page.keyboard.press('Tab')
      reached = await startButton.evaluate((el) => el === document.activeElement)
    }
    expect(reached).toBe(true)
    
    // Check if switches can be toggled with keyboard
    const hardModeSwitch = page.getByRole('checkbox', { name: /うごくモード|Moving Mode/ })
    await hardModeSwitch.focus()
    await page.keyboard.press('Space')
    await expect(hardModeSwitch).toBeChecked()
  })

  test('should have proper heading structure', async ({ page }) => {
    // Open help dialog to check headings
    await page.getByRole('button', { name: /あそびかた|How to Play/ }).click()
    
    // Check dialog has proper heading
    const dialogHeading = page.getByRole('heading', { name: /フルーツあつめゲームのあそびかた|How to Play Fruit Collecting Game/ })
    await expect(dialogHeading).toBeVisible()
    
    // Close dialog
    await page.keyboard.press('Escape')
  })

  test('should have sufficient color contrast', async ({ page }) => {
    // This test would normally use axe-core contrast checks
    // For now, we'll check that text is visible
    
    // Check light mode
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // Run accessibility check
    await checkA11y(page, null, {
      detailedReport: true
    })
  })

  test('should announce game state changes to screen readers', async ({ page }) => {
    // Start the game
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    
    // Check if pause button is announced
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
    
    // Pause the game
    await page.getByRole('button', { name: /ちゅうだん|Pause/ }).click()
    
    // Check if resume button is announced
    await expect(page.getByRole('button', { name: /さいかい|Resume/ })).toBeVisible()
  })

  test('should have accessible form controls', async ({ page }) => {
    // Check that all form controls have labels
    // チェックボックスは label 要素（htmlFor）で名前を与えているため、
    // aria-label ではなくアクセシブルネームで確認する
    const checkboxes = page.getByRole('checkbox')
    const checkboxCount = await checkboxes.count()

    for (let i = 0; i < checkboxCount; i++) {
      const name = await checkboxes.nth(i).evaluate((el) => {
        const id = el.getAttribute('id')
        const label = id ? document.querySelector(`label[for="${id}"]`) : null
        return el.getAttribute('aria-label') || label?.textContent?.trim() || ''
      })
      expect(name).toBeTruthy()
    }
    
    // Check buttons have accessible names
    const buttons = page.getByRole('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const name = await button.getAttribute('aria-label') || await button.textContent()
      expect(name).toBeTruthy()
    }
  })

  test('should support high contrast mode', async ({ page }) => {
    // Enable Windows high contrast mode simulation
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' })
    
    // Check if UI is still visible
    await expect(page.getByRole('application')).toBeVisible()
    await expect(page.getByRole('button', { name: /はじめる|Start/ })).toBeVisible()
    
    // Check if game area is distinguishable
    await expect(page.getByTestId('game-area')).toBeVisible()
  })
})