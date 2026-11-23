import { test, expect, type Page } from '@playwright/test'
import { startArcade } from './helpers/itch-release'

/**
 * 「ダブルクリックの はやさ」を実ブラウザで確かめる（docs/game-spec.md §2）。
 * OS の間隔より遅い2回目は dblclick にならないので、ブラウザでしか確かめられない。
 */
test.use({ viewport: { width: 1280, height: 800 } })

async function clickBlueberryTwice(page: Page, gapMs: number) {
  const berry = page.locator('[data-testid="game-area"] [role="button"]:has(img[src*="blueberry"])').first()
  const box = (await berry.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.click(x, y)
  await page.waitForTimeout(gapMs)
  await page.mouse.click(x, y)
}

test('ゆっくりでは、0.7秒あいた2回のクリックでブルーベリーが取れる', async ({ page }) => {
  // Given: 「ゆっくり」を保存してチャレンジを始める
  await page.addInitScript(() => localStorage.setItem('fruitHarvestDoubleClickSpeed', JSON.stringify('slow')))
  await page.goto('/')
  await startArcade(page)

  // When: ブルーベリーを 0.7 秒あけて2回クリックする
  await clickBlueberryTwice(page, 700)

  // Then: ミスのヒントは出ず、ブルーベリーの 20 点が入る
  await page.waitForTimeout(1200)
  await expect(page.getByText(/ブルーベリーはダブルクリックだよ/)).toHaveCount(0)
  await expect(page.getByTestId('score-value')).toHaveText('20')
})

test('ふつうでは、0.7秒あいた2回のクリックはミスになる', async ({ page }) => {
  // Given: 保存なし（ふつう）でチャレンジを始める
  await page.goto('/')
  await startArcade(page)

  // When: ブルーベリーを 0.7 秒あけて2回クリックする
  await clickBlueberryTwice(page, 700)

  // Then: ミスのヒントが出る
  await expect(page.getByText(/ブルーベリーはダブルクリックだよ/)).toBeVisible()
})
