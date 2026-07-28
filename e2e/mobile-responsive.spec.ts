import { test, expect, devices } from '@playwright/test'

// isMobile などの端末設定は describe 内では変更できないため、ファイルの先頭で適用する
// （describe 内に置くと「Make it top-level in the test file」で読み込みに失敗する）
test.use({ ...devices['iPhone 12'] })

test.describe('Mobile Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Reactのハイドレーションとゲームカードの登場アニメーションが終わるまで待つ。
    // 待たずに操作するとイベントハンドラが未登録で反応しない
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
  })

  test('should display properly on mobile devices', async ({ page }) => {
    // Check if game container is visible
    await expect(page.getByRole('application', { name: 'フルーツハーベストゲーム' })).toBeVisible()
    
    // Check if the layout is responsive
    const gameContainer = page.locator('.max-w-6xl').first()
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
    // 画面が狭いモバイルでは右端のドロップエリア（w-20）がフルーツに重なり
    // タップを横取りするため、重なっていないフルーツを選ぶ
    const gameArea = page.getByTestId('game-area')
    const dropArea = gameArea.locator('.drop-area')
    const dropAreaBox = await dropArea.boundingBox()
    const fruits = gameArea.getByRole('button')
    const fruitCount = await fruits.count()

    for (let i = 0; i < fruitCount; i++) {
      const fruit = fruits.nth(i)
      const box = await fruit.boundingBox()
      if (!box) continue
      const overlapsDropArea = dropAreaBox !== null && box.x + box.width > dropAreaBox.x
      if (!overlapsDropArea) {
        await fruit.tap()
        break
      }
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
    await expect(page.getByText(/フルーツあつめゲームのあそびかた|How to Play Fruit Collecting Game/)).toBeVisible()
    
    // Close dialog by tapping outside
    await page.locator('body').tap({ position: { x: 10, y: 10 } })
    await expect(dialog).not.toBeVisible()
  })

  test('should handle orientation changes', async ({ page, context }) => {
    // Test in portrait mode (default)
    await expect(page.getByRole('application')).toBeVisible()
    
    // Change to landscape
    await page.setViewportSize({ width: 812, height: 375 })
    
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
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    
    // Check if game displays properly
    await expect(page.getByRole('application', { name: 'フルーツハーベストゲーム' })).toBeVisible()
    
    // Check if layout utilizes tablet screen size
    const gameContainer = page.locator('.max-w-6xl').first()
    await expect(gameContainer).toBeVisible()
    
    // Check if controls are properly spaced
    const controlButtons = page.locator('button').filter({ hasText: /はじめる|Start|リセット|Reset/ })
    const count = await controlButtons.count()
    expect(count).toBeGreaterThan(0)
    
    // Start game
    await page.getByRole('button', { name: /はじめる|Start/ }).tap()
    
    // Check if game area is properly sized
    const gameArea = page.getByTestId('game-area')
    await expect(gameArea).toBeVisible()
    
    // Check if fruits are visible and tappable
    const fruits = gameArea.getByRole('button')
    const fruitCount = await fruits.count()
    expect(fruitCount).toBeGreaterThan(0)
  })
})