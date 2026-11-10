import { test, expect, type Page } from '@playwright/test'
import { startArcade } from './helpers/itch-release'

/**
 * モーダルを出しているあいだの Enter で、裏のゲームが始まらない（docs/game-spec.md §4.3）。
 * 実ブラウザで再現した不具合: 結果画面が Enter 1回で消え、ステージクリアを出したまま裏で同じステージが始まり、
 * 「あそびかた」の本文をクリックして Enter を押すとダイアログの裏でゲームが始まっていた。
 */

test.use({ viewport: { width: 1280, height: 800 } })

// Radix のダイアログは背後を aria-hidden にするので、getByRole では裏で始まったゲームを見落とす
const pauseButton = (page: Page) => page.locator('button', { hasText: /ちゅうだん|Pause/i })

test('あそびかたの本文をクリックして Enter を押しても、裏でゲームが始まらない', async ({ page }) => {
  // Given: 待機中に「あそびかた」を開き、本文（見出し）をクリックしてフォーカスをダイアログに置いた
  await page.goto('/')
  await page.getByTestId('mode-start').waitFor()
  await page.getByRole('button', { name: /あそびかた/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('h2').first().click()

  // When: Enter を押す
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)

  // Then: ダイアログは開いたまま、ゲームは始まっていない
  await expect(dialog).toBeVisible()
  await expect(pauseButton(page)).toHaveCount(0)
})

test('キーボードで取ってステージをクリアした直後の Enter で、裏で同じステージが始まらない', async ({ page }) => {
  // Given: れんしゅうを始め、矢印と Enter で取り続けてステージ1をクリアした
  await page.goto('/')
  await page.getByTestId('mode-select-practice').click()
  await page.getByTestId('mode-start').click()
  await expect(pauseButton(page)).toBeVisible()
  const stageClear = page.getByText(/ステージクリア/).first()
  for (let i = 0; i < 60 && !(await stageClear.isVisible()); i++) {
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(100)
  }
  await expect(stageClear).toBeVisible()

  // When: 同じ流れで Enter を押す
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1500)

  // Then: クリア表示は残り、ゲームは始まっていない
  await expect(stageClear).toBeVisible()
  await expect(pauseButton(page)).toHaveCount(0)
})

test('チャレンジの結果表示中に Enter を押しても、結果は消えない', async ({ page }) => {
  test.setTimeout(120_000)
  // Given: チャレンジを何もせず時間切れまで放置し、結果が出た
  await page.goto('/')
  await startArcade(page)
  await expect(page.getByTestId('arcade-end-reason')).toBeVisible({ timeout: 90_000 })

  // When: Enter を押す
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)

  // Then: 結果が残り、ゲームは始まっていない
  await expect(page.getByTestId('arcade-end-reason')).toBeVisible()
  await expect(pauseButton(page)).toHaveCount(0)
})
