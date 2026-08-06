import { test, expect, Page } from '@playwright/test'

/**
 * アーケードモード（60秒スコアアタック）の検証（Issue #42）。
 *
 * CrazyGames の合格ラインのうち、ここで機械的に確かめられるもの:
 * - ロード後すぐ遊び始められる（入口がプレイエリアにある）
 * - コンボ倍率が効く
 * - 60秒で結果が出て、そのまま再挑戦できる
 * - 英語でも遊べる
 */

async function harvestApples(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const apple = page.locator('[data-fruit-id][aria-label*="りんご"]').first()
    if (await apple.count() === 0) {
      await page.waitForTimeout(120)
      continue
    }
    // フルーツはランダム配置で重なることがあり、通常のクリックだと
    // 「別の要素が手前にある」と判定されて待ち続けてしまう。
    // ここで確かめたいのは得点計算のループなので、当たり判定は強制する。
    await apple.click({ force: true, timeout: 3000 }).catch(() => undefined)
    await page.waitForTimeout(120)
  }
}

async function readScore(page: Page): Promise<number> {
  const text = await page.getByRole('application').innerText()
  const match = text.match(/得点:\s*([\d,]+)|Score:\s*([\d,]+)/)
  const value = match?.[1] ?? match?.[2] ?? '0'
  return Number(value.replace(/,/g, ''))
}

test.describe('アーケードモード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('ロード直後にモードを選んですぐ遊び始められる', async ({ page }) => {
    await expect(page.getByTestId('mode-select-arcade')).toBeVisible()
    await expect(page.getByTestId('mode-select-practice')).toBeVisible()

    await page.getByTestId('mode-select-arcade').click()

    await expect(page.getByTestId('arcade-fever-gauge')).toBeVisible()
    await expect(page.getByRole('application')).toContainText(/1分00秒|1:00/)
  })

  test('連続で収穫するとコンボ倍率がつく', async ({ page }) => {
    await page.getByTestId('mode-select-arcade').click()

    // コンボは収穫が途切れると切れるため、倍率がつくまで収穫し続ける
    // （実行環境が遅いと1回あたりの間隔が伸びるので、回数ではなく結果で待つ）
    const combo = page.getByTestId('arcade-combo')
    for (let i = 0; i < 20; i++) {
      await harvestApples(page, 1)
      if (await combo.count() > 0 && /x[2-5]/.test(await combo.innerText())) break
    }

    await expect(combo).toBeVisible()
    await expect(combo).toContainText(/x[2-5]/)
    expect(await readScore(page)).toBeGreaterThan(0)
  })

  test('60秒たつと結果が出て、そのまま再挑戦できる', async ({ page }) => {
    // 制限時間ぶん実際に待つので、既定の30秒では足りない
    test.setTimeout(120_000)

    await page.getByTestId('mode-select-arcade').click()

    // 0点だと「自己ベスト更新」にはならない仕様なので、必ず1回は収穫しておく
    for (let i = 0; i < 20 && await readScore(page) === 0; i++) {
      await harvestApples(page, 1)
    }
    expect(await readScore(page)).toBeGreaterThan(0)

    // 制限時間ぶん待つ（タイマーは1秒刻み）
    await expect(page.getByTestId('arcade-retry')).toBeVisible({ timeout: 70_000 })

    await expect(page.getByTestId('arcade-result-score')).toBeVisible()
    await expect(page.getByTestId('arcade-result-rank')).toBeVisible()
    await expect(page.getByTestId('arcade-new-best')).toBeVisible()

    await page.getByTestId('arcade-retry').click()

    await expect(page.getByTestId('arcade-retry')).toBeHidden()
    await expect(page.getByTestId('arcade-fever-gauge')).toBeVisible()
  })

  test('練習モードは今までどおり遊べる', async ({ page }) => {
    await page.getByTestId('mode-select-practice').click()

    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/ })).toBeVisible()
    // アーケード専用のHUDは出さない
    await expect(page.getByTestId('arcade-fever-gauge')).toHaveCount(0)
  })

  test('英語でもアーケードを遊べる', async ({ page }) => {
    await page.goto('/?lang=en')

    await expect(page.getByTestId('mode-select-arcade')).toContainText('Arcade')
    await page.getByTestId('mode-select-arcade').click()

    await expect(page.getByTestId('arcade-fever-gauge')).toBeVisible()
  })
})
