import { test, expect } from '@playwright/test'

/**
 * れんしゅうは操作を1つずつ覚える順（docs/game-spec.md §4.1）。
 * 1面はりんごだけが出て、凡例もりんごだけになる。
 */
test.use({ viewport: { width: 1280, height: 800 } })

test('れんしゅう1面は、畑も凡例もりんごだけ', async ({ page }) => {
  // Given: 日本語で、れんしゅうを選んで始める
  await page.goto('/?lang=ja')
  await page.getByTestId('mode-select-practice').click()
  await page.getByTestId('mode-start').click()
  await expect(page.getByRole('button', { name: /ちゅうだん/ })).toBeVisible()

  // When: 畑の果物と凡例を見る
  const fruits = page.locator('[data-testid="game-area"] [role="button"] img')
  await expect(fruits.first()).toBeVisible()
  const srcs = await fruits.evaluateAll(imgs => imgs.map(img => img.getAttribute('src') ?? ''))

  // Then: りんごだけ。凡例にほかの果物は出ない
  expect(srcs.length).toBeGreaterThan(0)
  expect(srcs.every(src => src.includes('apple'))).toBe(true)
  await expect(page.getByTestId('legend-apple')).toBeVisible()
  for (const fruit of ['blueberry', 'lemon', 'watermelon']) {
    await expect(page.getByTestId(`legend-${fruit}`)).toHaveCount(0)
  }
  await expect(page.getByText('リンゴ園')).toBeVisible()
})
