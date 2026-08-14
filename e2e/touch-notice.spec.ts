import { test, expect, devices } from '@playwright/test'

/**
 * タッチのみの端末への操作ヒントの検証。
 *
 * 4つの操作はタッチでも成立するが、「長押しが右クリックの代わり」は
 * 触ってみないと分からないため、最初に一度だけ案内する
 * （ポインタのある端末には表示しない検証は TouchDeviceNotice のユニットテストが担う）。
 */
test.use({ ...devices['iPhone 12'] })

test.describe('タッチ専用端末への案内', () => {
  test('タッチのみの端末では操作ヒントのバナーを表示する', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const note = page.getByRole('note')
    await expect(note).toBeVisible()
    await expect(note).toContainText(/ながおし|long-press/i)
  })

  test('バナーは閉じられ、ゲーム自体は操作できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    await page.getByRole('note').getByRole('button').tap()
    await expect(page.getByRole('note')).not.toBeVisible()

    // ブロックはしない方針: モードを選んで遊び始められる
    // （待機中はプレイエリア上のモード選択が入口になる）
    await page.getByTestId('mode-select-arcade').tap()
    await page.getByTestId('mode-start').tap()
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
  })
})
