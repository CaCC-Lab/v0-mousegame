import { test, expect } from '@playwright/test'

/**
 * カード=選択、はじめる=開始 の分離（プレイテストの指摘への対応）。
 *
 * 「Arcade と Practice のカードを押した瞬間にタイマーが走り出して、
 * 　下にある Start ボタンは何だったのか分からないまま時間を溶かす」
 */
test.describe('モード選択と開始の分離', () => {
  test('カードを押してもタイマーは動かない', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('mode-select-practice').click()

    // 選んだことは見た目で分かる
    await expect(page.getByTestId('mode-select-practice')).toHaveAttribute('aria-pressed', 'true')

    // まだ始まっていない: モード選択が出たままで、残り時間も減らない
    const timer = page.getByText(/\d+分\d{2}秒/).first()
    const before = await timer.innerText()
    await page.waitForTimeout(1500)
    await expect(page.getByTestId('mode-start')).toBeVisible()
    expect(await timer.innerText()).toBe(before)
  })

  test('「はじめる」を押すとゲームが始まる', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('mode-select-arcade').click()
    await page.getByTestId('mode-start').click()

    // モード選択が消え、プレイエリアにフルーツが出る
    await expect(page.getByTestId('mode-start')).not.toBeVisible()
    await expect(page.getByTestId('game-area').locator('[data-fruit-id]').first()).toBeVisible()
  })

  test('待機中の開始ボタンはひとつだけ', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('mode-start')).toBeVisible()

    // 下部の操作ボタン列からは「はじめる」を外している
    await expect(page.getByRole('button', { name: 'はじめる' })).toHaveCount(1)
  })
})
