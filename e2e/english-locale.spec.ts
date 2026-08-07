import { test, expect } from '@playwright/test'

/**
 * 英語ロケールで日本語が混ざらないことの検証。
 *
 * CrazyGames は「locale に応じた言語 + 英語フォールバック」を要求している
 * （opportunity-pipeline/SHIPPING.md の提出前チェック）。
 * 英語で開いた画面に日本語が残っていると、英語話者には読めない情報になる。
 */
test.describe('英語ロケール', () => {
  test.use({ locale: 'en-US' })

  test('待機画面に日本語が出ない', async ({ page }) => {
    await page.goto('/')
    // 表示言語は navigator.language からクライアント側で決まるため、
    // 初期HTML（日本語）が英語に切り替わるのを待ってから中身を見る
    await expect(page.getByRole('heading', { name: /Fruit Harvest Game/ })).toBeVisible()
    await expect(page.getByTestId('mode-select-arcade')).toBeVisible()

    const text = await page.evaluate(() => document.body.innerText)
    const japanese = text.match(/[ぁ-んァ-ヶ一-龠]+/g) ?? []

    expect(japanese).toEqual([])
  })

  test('ずかん（コレクション）に日本語が出ない', async ({ page }) => {
    await page.goto('/')
    // 表示言語は navigator.language からクライアント側で決まるため、
    // 初期HTML（日本語）が英語に切り替わるのを待ってから中身を見る
    await expect(page.getByRole('heading', { name: /Fruit Harvest Game/ })).toBeVisible()
    await expect(page.getByTestId('mode-select-arcade')).toBeVisible()

    await page.getByRole('button', { name: /View collection/i }).click()
    await expect(page.getByTestId('collection-modal')).toBeVisible()

    // 4つのタブすべてを開く（バッジ名・じゅくたつ・スタンプが個別に翻訳漏れしやすい）
    for (const tab of ['fruits', 'badges', 'mastery', 'practice']) {
      await page.getByTestId(`collection-tab-${tab}`).click()
      const text = await page.getByTestId('collection-modal').innerText()
      expect(text.match(/[ぁ-んァ-ヶ一-龠]+/g) ?? []).toEqual([])
    }
  })

  test('あそびかたダイアログに日本語が出ない', async ({ page }) => {
    await page.goto('/')
    // 表示言語は navigator.language からクライアント側で決まるため、
    // 初期HTML（日本語）が英語に切り替わるのを待ってから中身を見る
    await expect(page.getByRole('heading', { name: /Fruit Harvest Game/ })).toBeVisible()
    await expect(page.getByTestId('mode-select-arcade')).toBeVisible()

    await page.getByRole('button', { name: /How to Play/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const text = await dialog.innerText()
    expect(text.match(/[ぁ-んァ-ヶ一-龠]+/g) ?? []).toEqual([])
  })

  test('ステージ選択に日本語が出ない', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Fruit Harvest Game/ })).toBeVisible()

    await page.getByRole('button', { name: /Select Stage/i }).click()
    // ステージ選択のオーバーレイは dialog ロールを持たないため、見出しから辿る
    const heading = page.getByRole('heading', { name: /Select Stage/i })
    await expect(heading).toBeVisible()

    const text = await heading.locator('xpath=ancestor::div[2]').innerText()
    expect(text.match(/[ぁ-んァ-ヶ一-龠]+/g) ?? []).toEqual([])
  })

  test('プレイ中の画面に日本語が出ない', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Fruit Harvest Game/ })).toBeVisible()
    await page.getByTestId('mode-select-arcade').click()
    await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible()
    await page.waitForTimeout(800)

    const text = await page.evaluate(() => document.body.innerText)
    const japanese = text.match(/[ぁ-んァ-ヶ一-龠]+/g) ?? []

    expect(japanese).toEqual([])
  })
})
