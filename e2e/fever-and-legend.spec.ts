import { test, expect, type Page } from '@playwright/test'

/**
 * 2人目の初見プレイテストで挙がった指摘の受け入れ条件。
 *
 * - フィーバーゲージが何なのか、プレイ中に画面から読めること
 * - 凡例と進捗カウンターが一目で別物と分かること
 */
test.use({ reducedMotion: 'reduce' })

/** 覆われていないフルーツを選ぶ（重なると別のフルーツにクリックが吸われる） */
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

  return handle.asElement()
}

async function startArcade(page: Page) {
  await page.goto('/')
  await page.getByTestId('mode-select-arcade').click()
  await page.getByTestId('mode-start').click()
  await expect(page.getByTestId('game-area').locator('[data-fruit-id]').first()).toBeVisible()
}

test.describe('フィーバーゲージの説明', () => {
  test('プレイ中に、ゲージの名前と溜め方が読める', async ({ page }) => {
    await startArcade(page)

    await expect(page.getByTestId('fever-label')).toBeVisible()
    await expect(page.getByTestId('fever-label')).toContainText('フィーバー')
    // 「あと何で発動するかは画面から読めない」への対応
    await expect(page.getByTestId('fever-hint')).toContainText('コンボ')
  })

  test('はじめて発動したときに、何が起きたのかを説明する', async ({ page }) => {
    await startArcade(page)

    // 正解操作を続けてゲージを満タンにする（りんご = クリック）
    for (let i = 0; i < 16; i++) {
      const apple = await pickClickableFruit(page, 'apple')
      if (apple) await apple.click({ force: true }).catch(() => {})
      if (await page.getByTestId('fever-intro').count()) break
      await page.waitForTimeout(110)
    }

    const intro = page.getByTestId('fever-intro')
    await expect(intro).toBeVisible()
    // 元から translations.ts にあった説明文がそのまま出る
    await expect(intro).toContainText('てんすうがさらに2ばい')

    // 発動中はゲージの説明も「いま起きていること」に変わる
    await expect(page.getByTestId('fever-hint')).toContainText('2ばい')
  })
})

test.describe('凡例と進捗カウンターの区別', () => {
  test('凡例には見出しが付いていて、数字が並ばない', async ({ page }) => {
    await startArcade(page)

    const legend = page.getByTestId('operation-legend')
    await expect(page.getByTestId('legend-title')).toContainText('とりかた')
    // カウンター側は「🍎 0」のように数が並ぶ。凡例には数を出さない
    expect(await legend.innerText()).not.toMatch(/\d/)
  })

  test('凡例と収穫カウンターは離れた位置にある', async ({ page }) => {
    await startArcade(page)

    const legend = await page.getByTestId('operation-legend').boundingBox()
    const counter = await page.getByTestId('collection-fruit-counters').boundingBox()
    expect(legend).not.toBeNull()
    expect(counter).not.toBeNull()

    // 隣接していると役割を取り違えるため、プレイエリアの上端と下端に分ける
    const gap = legend!.y - (counter!.y + counter!.height)
    expect(gap).toBeGreaterThan(200)
  })
})

test.describe('連続成功が途切れたときの表示', () => {
  test('ミスした瞬間に、途切れたことがはっきり出る', async ({ page }) => {
    await startArcade(page)

    // まず積み上げる（りんご = クリックが正解）
    for (let i = 0; i < 3; i++) {
      const apple = await pickClickableFruit(page, 'apple')
      if (apple) await apple.click({ force: true }).catch(() => {})
      await page.waitForTimeout(120)
    }
    await expect(page.getByTestId('streak-count')).not.toHaveAttribute('data-broken', 'true')

    // わざと間違える（ブルーベリーはダブルクリックが正解）
    const blueberry = await pickClickableFruit(page, 'blueberry')
    expect(blueberry).not.toBeNull()
    await blueberry!.click({ button: 'right', force: true })

    // 「薄い枠で気づくのが遅れた」ので、途切れをはっきり示す
    await expect(page.getByTestId('streak-broken')).toBeVisible()
    await expect(page.getByTestId('streak-count')).toHaveAttribute('data-broken', 'true')
  })
})
