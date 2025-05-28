import { test, expect } from '@playwright/test'
import { startGame, clickFruit } from './helpers/test-utils'

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the page quickly', async ({ page }) => {
    // Measure page load performance
    const performanceTiming = await page.evaluate(() => {
      const timing = window.performance.timing
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        load: timing.loadEventEnd - timing.navigationStart
      }
    })
    
    // Page should load within reasonable time
    expect(performanceTiming.domContentLoaded).toBeLessThan(3000)
    expect(performanceTiming.load).toBeLessThan(5000)
  })

  test('should have good runtime performance during gameplay', async ({ page }) => {
    // Start performance measurement
    await page.evaluate(() => window.performance.mark('game-start'))
    
    // Start the game
    await startGame(page)
    
    // Play for a few seconds
    for (let i = 0; i < 10; i++) {
      await clickFruit(page, i % 5)
      await page.waitForTimeout(100)
    }
    
    // Measure FPS and performance
    const metrics = await page.evaluate(() => {
      window.performance.mark('game-end')
      window.performance.measure('game-duration', 'game-start', 'game-end')
      
      const measure = window.performance.getEntriesByName('game-duration')[0]
      const paintEntries = window.performance.getEntriesByType('paint')
      
      return {
        gameDuration: measure.duration,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime
      }
    })
    
    // Check performance metrics
    expect(metrics.firstPaint).toBeLessThan(1000)
    expect(metrics.firstContentfulPaint).toBeLessThan(1500)
  })

  test('should handle multiple fruits without lag', async ({ page }) => {
    // Enable hard mode for moving fruits
    const hardModeSwitch = page.getByRole('switch', { name: /むずかしいモード|Hard Mode/ })
    await hardModeSwitch.click()
    
    // Start the game
    await startGame(page)
    
    // Check if fruits are rendering smoothly
    const gameArea = page.locator('.bg-green-300, .dark\\:bg-green-800')
    const initialFruitCount = await gameArea.locator('button').count()
    
    // Wait and check fruit count remains stable
    await page.waitForTimeout(2000)
    const afterFruitCount = await gameArea.locator('button').count()
    
    expect(afterFruitCount).toBeGreaterThan(0)
    expect(Math.abs(afterFruitCount - initialFruitCount)).toBeLessThan(3)
  })

  test('should not have memory leaks during extended play', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Play multiple rounds
    for (let round = 0; round < 3; round++) {
      await startGame(page)
      
      // Play for a bit
      for (let i = 0; i < 5; i++) {
        await clickFruit(page, i % 3)
        await page.waitForTimeout(200)
      }
      
      await page.getByRole('button', { name: /リセット|Reset/ }).click()
    }
    
    // Check memory usage after playing
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })
    
    // Memory increase should be reasonable (less than 50MB)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024
      expect(memoryIncrease).toBeLessThan(50)
    }
  })

  test('should handle rapid user interactions', async ({ page }) => {
    await startGame(page)
    
    // Rapidly click multiple buttons
    const buttons = [
      page.getByRole('button', { name: /ちゅうだん|Pause/ }),
      page.getByRole('button', { name: /リセット|Reset/ })
    ]
    
    // Click buttons rapidly
    for (let i = 0; i < 10; i++) {
      await buttons[i % 2].click({ force: true })
      await page.waitForTimeout(50)
    }
    
    // App should still be responsive
    await expect(page.getByRole('application')).toBeVisible()
    await expect(page.getByRole('button', { name: /はじめる|Start/ })).toBeVisible()
  })

  test('should load assets efficiently', async ({ page }) => {
    // Intercept network requests
    const resourceTimings: { [key: string]: number } = {}
    
    page.on('response', response => {
      const url = response.url()
      const timing = response.timing()
      if (timing) {
        resourceTimings[url] = timing.responseEnd - timing.requestStart
      }
    })
    
    // Reload page to capture all requests
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Check that no single resource takes too long
    Object.entries(resourceTimings).forEach(([url, time]) => {
      expect(time).toBeLessThan(3000) // 3 seconds max per resource
    })
  })
})