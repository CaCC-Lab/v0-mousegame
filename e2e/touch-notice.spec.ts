import { test, expect, devices } from '@playwright/test'

/**
 * タッチのみの端末で出す操作ヒントの検証。
 *
 * Issue #42 でタッチでも4操作が成立するようになったため、
 * この案内は「マウスのあるパソコンで開いてね」という排除の案内ではなく、
 * 「長押しが右クリックの代わり」を伝えるヒントとして出す
 * （マウスのある端末には出さない検証は TouchDeviceNotice のユニットテストが担う）。
 */
test.use({ ...devices['iPhone 12'] })

test.describe('タッチ端末への操作ヒント', () => {
  test('タッチのみの端末では操作ヒントを表示する', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const note = page.getByRole('note')
    await expect(note).toBeVisible()
    await expect(note).toContainText(/ながおし|long-press/i)
  })

  test('ヒントは閉じられ、そのままタッチで遊べる', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    await page.getByRole('note').getByRole('button').tap()
    await expect(page.getByRole('note')).not.toBeVisible()

    await page.getByTestId('mode-select-arcade').tap()
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
  })
})
