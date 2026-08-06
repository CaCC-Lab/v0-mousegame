import { test, expect, devices } from '@playwright/test'

/**
 * マウスのない端末への案内バナーの検証。
 *
 * このゲームはマウス操作の練習ツールなので、タッチのみの端末
 * （hover:none かつ pointer:coarse）では大半の操作が成立しない。
 * 専用レイアウトを持つ代わりに、案内バナーで誘導する方針
 * （マウスのある端末には表示しない検証は TouchDeviceNotice のユニットテストが担う）。
 */
test.use({ ...devices['iPhone 12'] })

test.describe('タッチ専用端末への案内', () => {
  test('マウスがない端末では案内バナーを表示する', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const note = page.getByRole('note')
    await expect(note).toBeVisible()
    await expect(note).toContainText(/マウス|mouse/i)
  })

  test('バナーは閉じられ、ゲーム自体は操作できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(800)

    await page.getByRole('note').getByRole('button').tap()
    await expect(page.getByRole('note')).not.toBeVisible()

    // ブロックはしない方針: ゲームは開始できる
    await page.getByRole('button', { name: /はじめる|Start/ }).tap()
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
  })
})
