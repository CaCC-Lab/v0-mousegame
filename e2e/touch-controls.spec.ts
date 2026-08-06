import { test, expect, devices, Page, Locator } from '@playwright/test'

/**
 * タッチ操作でマウス4操作が成立することの検証（Issue #42）。
 *
 * タップ＝クリック / すばやく2回タップ＝ダブルクリック /
 * 長押し＝右クリック相当 / なぞる＝ドラッグ＆ドロップ。
 *
 * 長押しと「なぞる」は Playwright に押し続ける API がないため、
 * ポインタイベントを直接発火して検証する（実ブラウザ上で実装のハンドラを通す）。
 * タップだけは実際の tap() を使い、合成クリックによる二重カウントが
 * 起きないことも同時に確かめる。
 */
test.use({ ...devices['Pixel 7'] })

/**
 * アーケードで始める。
 * 畑に4種類がそろうため、どのフルーツも必ず1個は存在する。
 * また各テストの収穫は1回だけなので、コンボ倍率は常に等倍＝素点で検証できる。
 */
async function startArcade(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByTestId('mode-select-arcade').tap()
  await expect(page.getByTestId('arcade-fever-gauge')).toBeVisible()
}

/**
 * 指定した種類のうち、中心が他のフルーツに隠れていない個体を返す。
 *
 * フルーツはランダム配置なので重なることがあり、隠れた個体を掴むと
 * 「別の要素が手前にある」と判定されて操作が成立しない。
 * 実際に指が届く個体を選ぶことで、検証したいジェスチャーだけを見る。
 */
async function hittableFruit(page: Page, name: string): Promise<Locator> {
  const id = await page.evaluate((label) => {
    const nodes = Array.from(document.querySelectorAll('[data-fruit-id]'))
    for (const node of nodes) {
      if (!(node.getAttribute('aria-label') ?? '').includes(label)) continue
      const rect = node.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      if (hit && node.contains(hit)) return node.getAttribute('data-fruit-id')
    }
    return null
  }, name)

  if (!id) throw new Error(`触れる位置にある${name}が見つかりませんでした`)
  return page.locator(`[data-fruit-id="${id}"]`)
}

async function readScore(page: Page): Promise<number> {
  const text = await page.getByRole('application').innerText()
  const match = text.match(/得点:\s*([\d,]+)/)
  return match ? Number(match[1].replace(/,/g, '')) : 0
}

async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox()
  if (!box) throw new Error('要素の位置が取得できませんでした')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('タッチ操作', () => {
  test('タップでりんごを収穫できる（合成クリックで二重に数えない）', async ({ page }) => {
    await startArcade(page)

    const apple = await hittableFruit(page, 'りんご')
    await expect(apple).toBeVisible()
    const before = await readScore(page)

    await apple.tap()

    await expect.poll(() => readScore(page)).toBeGreaterThan(before)
    // りんごは10点。二重に数えていれば20点増える
    expect(await readScore(page) - before).toBe(10)
  })

  test('長押しでレモンを収穫できる（右クリックの代わり）', async ({ page }) => {
    await startArcade(page)

    const lemon = await hittableFruit(page, 'レモン')
    await expect(lemon).toBeVisible()
    const before = await readScore(page)
    const { x, y } = await centerOf(lemon)

    await lemon.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: x, clientY: y })

    // 長押しが成立した時点で収穫され、レモンは畑から消える。
    // 指を離す操作（pointerup）は結果に関与しないため送らない
    // （送ろうとしても要素が既に無く、locator の解決が失敗する）。
    // レモンは15点
    await expect.poll(() => readScore(page), { timeout: 5000 }).toBe(before + 15)
  })

  test('すばやく2回タップでブルーベリーを収穫できる', async ({ page }) => {
    await startArcade(page)

    const blueberry = await hittableFruit(page, 'ブルーベリー')
    await expect(blueberry).toBeVisible()
    const before = await readScore(page)
    const { x, y } = await centerOf(blueberry)

    for (let i = 0; i < 2; i++) {
      await blueberry.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: x, clientY: y })
      await blueberry.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1, clientX: x, clientY: y })
    }

    // ブルーベリーは20点
    await expect.poll(() => readScore(page)).toBe(before + 20)
  })

  test('指でなぞってスイカをドロップエリアへ運べる', async ({ page }) => {
    await startArcade(page)

    const watermelon = await hittableFruit(page, 'スイカ')
    await expect(watermelon).toBeVisible()
    const before = await readScore(page)
    const start = await centerOf(watermelon)

    const dropBox = await page.locator('.drop-area').boundingBox()
    if (!dropBox) throw new Error('ドロップエリアが見つかりませんでした')
    const target = { x: dropBox.x + dropBox.width / 2, y: dropBox.y + dropBox.height / 2 }

    await watermelon.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 1, clientX: start.x, clientY: start.y })
    await watermelon.dispatchEvent('pointermove', { pointerType: 'touch', pointerId: 1, clientX: (start.x + target.x) / 2, clientY: target.y })
    await watermelon.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 1, clientX: target.x, clientY: target.y })

    // スイカは25点
    await expect.poll(() => readScore(page)).toBe(before + 25)
  })

  test('タッチ端末でもアーケードを始められる', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('mode-select-arcade').tap()

    await expect(page.getByTestId('arcade-fever-gauge')).toBeVisible()
  })
})
