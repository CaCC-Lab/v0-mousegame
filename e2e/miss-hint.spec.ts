import { test, expect, type Page } from '@playwright/test'

/**
 * 誤操作したときに正解の操作が画面に出ることの検証。
 *
 * 初見プレイヤーのプレイテストで、ブルーベリーを右クリックして0点になり
 * 「正解が何か一切出ない」ことを理由に25秒で離脱した。
 * 「単語がひとつ出てたら続けた。沈黙が引き金」という証言に基づく受け入れ条件。
 */
/**
 * 指定した種類のフルーツのうち、他のフルーツに覆われていないものを返す。
 *
 * フルーツは重なって描画されることがあり、中心座標をクリックすると
 * 上に乗った別のフルーツが受け取ってしまう（狙いと違う操作になる）。
 */
async function pickClickableFruit(page: Page, type: string) {
  const handle = await page.evaluateHandle((fruitType) => {
    const candidates = Array.from(document.querySelectorAll('[data-fruit-id]'))
      .filter(el => el.querySelector(`img[src*="${fruitType}"]`))

    return candidates.find(el => {
      const r = el.getBoundingClientRect()
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return top !== null && el.contains(top)
    }) ?? null
  }, type)

  const element = handle.asElement()
  expect(element, `重なっていない ${type} が見つからなかった`).not.toBeNull()
  return element!
}

test.describe('誤操作のヒント', () => {
  // フルーツは装飾アニメーションで揺れており、続けてクリックすると
  // Playwright の安定性チェックに引っかかる。
  // アプリは MotionConfig reducedMotion="user" を持つので、これで揺れを止められる
  test.use({ reducedMotion: 'reduce' })

  test('ブルーベリーを右クリックすると「ダブルクリック」と出る', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('mode-select-arcade').click()
    await page.getByTestId('mode-start').click()

    const gameArea = page.getByTestId('game-area')
    await expect(gameArea.locator('[data-fruit-id]').first()).toBeVisible()

    // ブルーベリーはダブルクリックが正解。右クリックは誤操作
    const blueberry = await pickClickableFruit(page, 'blueberry')
    await blueberry.click({ button: 'right' })

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

    // 同じフルーツで「間違える → 正しく取る」を続ける。
    // 誤操作ではフルーツは消えないので、狙いがずれない
    const blueberry = await pickClickableFruit(page, 'blueberry')

    await blueberry.click({ button: 'right', force: true })
    await expect(page.getByTestId('miss-hint')).toBeVisible()

    // 出現アニメーションで要素がわずかに揺れ続けるため、安定性チェックは飛ばす
    // （覆われていないフルーツを選んでいるので、狙いはずれない）
    await blueberry.dblclick({ force: true })
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

    const lemon = await pickClickableFruit(enPage, 'lemon')
    await lemon.click()

    const hint = enPage.getByTestId('miss-hint')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText(/Right-click/i)
    await context.close()
  })
})
