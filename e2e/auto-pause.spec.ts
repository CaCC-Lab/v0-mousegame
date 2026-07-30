import { test, expect } from '@playwright/test'

/**
 * Game Studio の playtest-checklist にある
 * 「pause behavior when focus changes」の検証。
 *
 * 子どもが席を離れている間もタイマーが減り続けると、
 * 戻ったときには時間切れでスコアが不当に下がってしまう。
 */
test.describe('フォーカスが外れたときの挙動', () => {
  test('タブが隠れるとゲームが自動で一時停止する', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()

    const readTimer = () =>
      page.evaluate(() => document.body.innerText.match(/(\d+)分(\d+)秒|(\d+):(\d{2})/)?.[0] ?? '')

    // タブが隠れた状態を再現
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      Object.defineProperty(document, 'hidden', { value: true, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // 「さいかい」が出ていれば一時停止できている
    await expect(page.getByRole('button', { name: /さいかい|Resume/ })).toBeVisible()

    const paused = await readTimer()
    await page.waitForTimeout(2500)
    expect(await readTimer()).toBe(paused)
  })

  test('タブに戻っても自動では再開せず、プレイヤーの操作を待つ', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(page.getByRole('button', { name: /さいかい|Resume/ })).toBeVisible()

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // 戻った瞬間に不意にゲームが動き出さないこと
    await expect(page.getByRole('button', { name: /さいかい|Resume/ })).toBeVisible()
  })
})
