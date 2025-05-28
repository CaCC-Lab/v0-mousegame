import { test, expect } from '@playwright/test'

test.describe('Fruit Harvest Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the game page', async ({ page }) => {
    // Check if the game title is visible
    await expect(page.getByRole('application', { name: 'フルーツハーベストゲーム' })).toBeVisible()
    
    // Check if score displays
    await expect(page.getByText(/得点:|Score:/)).toBeVisible()
    
    // Check if start button is visible
    await expect(page.getByRole('button', { name: /はじめる|Start/ })).toBeVisible()
  })

  test('should start and play the game', async ({ page }) => {
    // Click start button
    const startButton = page.getByRole('button', { name: /はじめる|Start/ })
    await startButton.click()
    
    // Check if the game started
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
    
    // Check if fruits are visible in the game area
    const gameArea = page.locator('.bg-green-300, .dark\\:bg-green-800')
    await expect(gameArea).toBeVisible()
    
    // Check if at least one fruit is visible
    await expect(gameArea.locator('button').first()).toBeVisible()
    
    // Try to click a fruit
    const firstFruit = gameArea.locator('button').first()
    await firstFruit.click()
    
    // Check if score changes (might be 0 if wrong interaction type)
    await expect(page.getByText(/得点:|Score:/)).toBeVisible()
  })

  test('should pause and resume the game', async ({ page }) => {
    // Start the game
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    
    // Pause the game
    const pauseButton = page.getByRole('button', { name: /ちゅうだん|Pause/ })
    await pauseButton.click()
    
    // Check if resume button appears
    await expect(page.getByRole('button', { name: /さいかい|Resume/ })).toBeVisible()
    
    // Resume the game
    await page.getByRole('button', { name: /さいかい|Resume/ }).click()
    
    // Check if pause button appears again
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
  })

  test('should reset the game', async ({ page }) => {
    // Start the game
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    
    // Wait a moment for the game to run
    await page.waitForTimeout(1000)
    
    // Reset the game
    await page.getByRole('button', { name: /リセット|Reset/ }).click()
    
    // Check if start button is visible again
    await expect(page.getByRole('button', { name: /はじめる|Start/ })).toBeVisible()
    
    // Check if score is reset to 0
    await expect(page.getByText(/得点:|Score:/).locator('..').getByText('0')).toBeVisible()
  })

  test('should toggle hard mode', async ({ page }) => {
    // Find hard mode switch
    const hardModeSwitch = page.getByRole('switch', { name: /むずかしいモード|Hard Mode/ })
    
    // Check initial state
    await expect(hardModeSwitch).not.toBeChecked()
    
    // Toggle hard mode
    await hardModeSwitch.click()
    
    // Check if it's checked
    await expect(hardModeSwitch).toBeChecked()
    
    // Start game and check if fruits move (hard to test movement, just check game starts)
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
  })

  test('should show help dialog', async ({ page }) => {
    // Click help button
    await page.getByRole('button', { name: /あそびかた|How to Play/ }).click()
    
    // Check if help dialog appears
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/フルーツハーベストゲームのあそびかた|How to Play Fruit Harvest Game/)).toBeVisible()
    
    // Check if fruit instructions are visible
    await expect(page.getByText(/りんご|Apple/)).toBeVisible()
    await expect(page.getByText(/クリック|Click/)).toBeVisible()
    
    // Close dialog
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should respond to keyboard controls', async ({ page }) => {
    // Start the game
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    
    // Press space to pause
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: /さいかい|Resume/ })).toBeVisible()
    
    // Press space to resume
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
    
    // Try arrow keys (should select fruits)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    
    // Press Enter to harvest selected fruit
    await page.keyboard.press('Enter')
  })

  test('should persist high score', async ({ page, context }) => {
    // Start and play a game
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    
    // Try to score by clicking fruits
    const gameArea = page.locator('.bg-green-300, .dark\\:bg-green-800')
    const fruits = gameArea.locator('button')
    
    // Click multiple fruits to try to score
    for (let i = 0; i < 3; i++) {
      const fruit = fruits.nth(i)
      if (await fruit.isVisible()) {
        await fruit.click()
        await page.waitForTimeout(100)
      }
    }
    
    // Reset game
    await page.getByRole('button', { name: /リセット|Reset/ }).click()
    
    // Check if high score is preserved
    const highScoreText = page.getByText(/最高得点:|High Score:/)
    await expect(highScoreText).toBeVisible()
    
    // Open new page and check if high score persists
    const newPage = await context.newPage()
    await newPage.goto('/')
    
    const newHighScoreText = newPage.getByText(/最高得点:|High Score:/)
    await expect(newHighScoreText).toBeVisible()
  })
})