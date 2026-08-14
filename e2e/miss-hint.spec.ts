import { test, expect } from '@playwright/test'

/**
 * 誤操作したときに正解の操作が画面に出ることの検証。
 *
 * 初見プレイヤーのプレイテストで、ブルーベリーを右クリックして0点になり
 * 「正解が何か一切出ない」ことを理由に25秒で離脱した。
 * 「単語がひとつ出てたら続けた。沈黙が引き金」という証言に基づく受け入れ条件。
 */
test.describe('誤操作のヒント', () => {
  test('ブルーベリーを右クリックすると「ダブルクリック」と出る', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('mode-select-arcade').click()
    await page.getByTestId('mode-start').click()

    const gameArea = page.getByTestId('game-area')
    await expect(gameArea.locator('[data-fruit-id]').first()).toBeVisible()

    // ブルーベリーはダブルクリックが正解。右クリックは誤操作
    const blueberry = gameArea.locator('[data-fruit-id]').filter({ has: page.locator('img[src*="blueberry"]') }).first()
    await expect(blueberry).toBeVisible()
    // フルーツ同士が重なると Playwright のクリック判定に阻まれるため force を使う
    await blueberry.click({ button: 'right', force: true })

    const hint = page.getByTestId('miss-hint')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText('ダブルクリック')
  })

  test('正しく取るとヒントは消える', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('mode-select-arcade').click()
    await page.getByTestId('mode-start').click()

    const gameArea = page.getByTestId('game-area')
    await expect(gameArea.locator('[data-fruit-id]').first()).toBeVisible()

    // わざと間違える（りんごは左クリックが正解なので右クリックは誤り）
    const apple = gameArea.locator('[data-fruit-id]').filter({ has: page.locator('img[src*="apple"]') }).first()
    await apple.click({ button: 'right', force: true })
    await expect(page.getByTestId('miss-hint')).toBeVisible()

    // 正しく取り直す
    await gameArea.locator('[data-fruit-id]').filter({ has: page.locator('img[src*="apple"]') }).first().click({ force: true })
    await expect(page.getByTestId('miss-hint')).not.toBeVisible()
  })

  test('英語でも正解の操作名が出る', async ({ page, browser }) => {
    const context = await browser.newContext({ locale: 'en-US' })
    const enPage = await context.newPage()
    await enPage.goto('/')
    await expect(enPage.getByRole('heading', { name: /Fruit Harvest Game/ })).toBeVisible()
    await enPage.getByTestId('mode-select-arcade').click()
    await enPage.getByTestId('mode-start').click()

    const gameArea = enPage.getByTestId('game-area')
    await expect(gameArea.locator('[data-fruit-id]').first()).toBeVisible()

    const lemon = gameArea.locator('[data-fruit-id]').filter({ has: enPage.locator('img[src*="lemon"]') }).first()
    await lemon.click({ force: true })

    const hint = enPage.getByTestId('miss-hint')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText(/Right-click/i)
    await context.close()
  })
})
