import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsive Design', () => {
  test.use({ ...devices['iPhone 12'] })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display properly on mobile devices', async ({ page }) => {
    // Check if game container is visible
    await expect(page.getByRole('application', { name: 'フルーツハーベストゲーム' })).toBeVisible()
    
    // Check if the layout is responsive
    const gameContainer = page.locator('.max-w-4xl')
    await expect(gameContainer).toBeVisible()
    
    // Check if buttons are accessible
    await expect(page.getByRole('button', { name: /はじめる|Start/ })).toBeVisible()
    
    // Check if controls are stacked properly on mobile
    const controlArea = page.locator('.bg-gray-200').first()
    await expect(controlArea).toBeVisible()
  })

  test('should handle touch interactions', async ({ page }) => {
    // Start the game
    await page.getByRole('button', { name: /はじめる|Start/ }).tap()
    
    // Check if game started
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
    
    // Try to tap a fruit
    const gameArea = page.locator('.bg-green-300, .dark\\:bg-green-800')
    const firstFruit = gameArea.locator('button').first()
    
    if (await firstFruit.isVisible()) {
      await firstFruit.tap()
    }
    
    // Pause game with tap
    await page.getByRole('button', { name: /ちゅうだん|Pause/ }).tap()
    await expect(page.getByRole('button', { name: /さいかい|Resume/ })).toBeVisible()
  })

  test('should show mobile-friendly help dialog', async ({ page }) => {
    // Open help dialog
    await page.getByRole('button', { name: /あそびかた|How to Play/ }).tap()
    
    // Check if dialog is visible and fits screen
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    
    // Check if content is readable
    await expect(page.getByText(/フルーツハーベストゲームのあそびかた|How to Play Fruit Harvest Game/)).toBeVisible()
    
    // Close dialog by tapping outside
    await page.locator('body').tap({ position: { x: 10, y: 10 } })
    await expect(dialog).not.toBeVisible()
  })

  test('should handle orientation changes', async ({ page, context }) => {
    // Test in portrait mode (default)
    await expect(page.getByRole('application')).toBeVisible()
    
    // Change to landscape
    await context.setViewportSize({ width: 812, height: 375 })
    
    // Check if game is still playable
    await expect(page.getByRole('application')).toBeVisible()
    await expect(page.getByRole('button', { name: /はじめる|Start/ })).toBeVisible()
    
    // Start game in landscape
    await page.getByRole('button', { name: /はじめる|Start/ }).tap()
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
  })
})

test.describe('Tablet Responsive Design', () => {
  test.use({ ...devices['iPad'] })

  test('should display properly on tablets', async ({ page }) => {
    await page.goto('/')
    
    // Check if game displays properly
    await expect(page.getByRole('application', { name: 'フルーツハーベストゲーム' })).toBeVisible()
    
    // Check if layout utilizes tablet screen size
    const gameContainer = page.locator('.max-w-4xl')
    await expect(gameContainer).toBeVisible()
    
    // Check if controls are properly spaced
    const controlButtons = page.locator('button').filter({ hasText: /はじめる|Start|リセット|Reset/ })
    const count = await controlButtons.count()
    expect(count).toBeGreaterThan(0)
    
    // Start game
    await page.getByRole('button', { name: /はじめる|Start/ }).tap()
    
    // Check if game area is properly sized
    const gameArea = page.locator('.bg-green-300, .dark\\:bg-green-800')
    await expect(gameArea).toBeVisible()
    
    // Check if fruits are visible and tappable
    const fruits = gameArea.locator('button')
    const fruitCount = await fruits.count()
    expect(fruitCount).toBeGreaterThan(0)
  })
})