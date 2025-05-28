import { test, expect } from '@playwright/test'

test.describe('Dark Mode and Internationalization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should toggle dark mode', async ({ page }) => {
    // Check initial light mode
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)
    
    // Find and click dark mode toggle
    const darkModeSwitch = page.getByRole('switch', { name: /ダークモード|Dark Mode/ })
    await darkModeSwitch.click()
    
    // Check if dark mode is applied
    await expect(html).toHaveClass(/dark/)
    
    // Check if UI elements have dark styles
    await expect(page.locator('.bg-gray-100')).toHaveClass(/dark:bg-gray-900/)
    
    // Toggle back to light mode
    await darkModeSwitch.click()
    await expect(html).not.toHaveClass(/dark/)
  })

  test('should persist dark mode preference', async ({ page, context }) => {
    // Enable dark mode
    const darkModeSwitch = page.getByRole('switch', { name: /ダークモード|Dark Mode/ })
    await darkModeSwitch.click()
    
    // Check if dark mode is enabled
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Reload page
    await page.reload()
    
    // Check if dark mode persists
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(darkModeSwitch).toBeChecked()
    
    // Open new page in same context
    const newPage = await context.newPage()
    await newPage.goto('/')
    
    // Check if dark mode is applied in new page
    await expect(newPage.locator('html')).toHaveClass(/dark/)
  })

  test('should toggle language between Japanese and English', async ({ page }) => {
    // Check initial Japanese text
    await expect(page.getByText('得点:')).toBeVisible()
    await expect(page.getByText('はじめる')).toBeVisible()
    
    // Find and click language toggle
    const languageButton = page.getByRole('button', { name: /JA|EN/ })
    await languageButton.click()
    
    // Check if language changed to English
    await expect(page.getByText('Score:')).toBeVisible()
    await expect(page.getByText('Start')).toBeVisible()
    
    // Toggle back to Japanese
    await languageButton.click()
    
    // Check if language changed back to Japanese
    await expect(page.getByText('得点:')).toBeVisible()
    await expect(page.getByText('はじめる')).toBeVisible()
  })

  test('should persist language preference', async ({ page, context }) => {
    // Change to English
    const languageButton = page.getByRole('button', { name: /JA|EN/ })
    await languageButton.click()
    
    // Check English text
    await expect(page.getByText('Score:')).toBeVisible()
    
    // Reload page
    await page.reload()
    
    // Check if English persists
    await expect(page.getByText('Score:')).toBeVisible()
    await expect(languageButton).toContainText('EN')
    
    // Open new page
    const newPage = await context.newPage()
    await newPage.goto('/')
    
    // Check if English is applied in new page
    await expect(newPage.getByText('Score:')).toBeVisible()
  })

  test('should translate help dialog content', async ({ page }) => {
    // Open help in Japanese
    await page.getByRole('button', { name: 'あそびかた' }).click()
    await expect(page.getByText('フルーツハーベストゲームのあそびかた')).toBeVisible()
    await expect(page.getByText(/りんご: クリックして収穫/)).toBeVisible()
    
    // Close dialog
    await page.keyboard.press('Escape')
    
    // Switch to English
    const languageButton = page.getByRole('button', { name: /JA|EN/ })
    await languageButton.click()
    
    // Open help in English
    await page.getByRole('button', { name: 'How to Play' }).click()
    await expect(page.getByText('How to Play Fruit Harvest Game')).toBeVisible()
    await expect(page.getByText(/Apple: Click to harvest/)).toBeVisible()
  })

  test('should work with dark mode and language change together', async ({ page }) => {
    // Enable dark mode
    const darkModeSwitch = page.getByRole('switch', { name: /ダークモード|Dark Mode/ })
    await darkModeSwitch.click()
    
    // Change to English
    const languageButton = page.getByRole('button', { name: /JA|EN/ })
    await languageButton.click()
    
    // Check both are applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByText('Score:')).toBeVisible()
    await expect(page.getByText('Dark Mode')).toBeVisible()
    
    // Start game and check it works
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  })
})