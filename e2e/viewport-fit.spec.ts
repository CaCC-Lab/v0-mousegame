import { test, expect } from '@playwright/test'

/**
 * 画面サイズごとの収まりを検証する。
 *
 * itch.io は指定したサイズの iframe でゲームを配信するため、
 * ゲームを始めるのに必要な部分（タイトル〜「はじめる」ボタン）が
 * 表示領域に収まっていないと、開いた人がプレイを開始できない。
 *
 * 以前はプレイエリアが固定の 60vh だったため、ヘッダーやスコアバーの分だけ
 * 「はじめる」が画面外へ押し出されていた（1280x960 で下端 1188px）。
 */

/**
 * ゲームカードの登場アニメーション（scale 0.9 → 1、delay 0.2s + duration 0.5s）が
 * 終わるまで待つ。途中で測ると transform 適用中のサイズを拾ってしまう。
 */
async function waitForEntranceAnimation(page: import('@playwright/test').Page) {
  await page.waitForTimeout(1000)
}

/** transform の影響を受けないレイアウト上の高さを取得する */
async function layoutHeight(page: import('@playwright/test').Page, testId: string) {
  return page.evaluate(
    (id) => (document.querySelector(`[data-testid="${id}"]`) as HTMLElement)?.offsetHeight ?? null,
    testId
  )
}

/** ゲーム開始に必要な操作ボタンが表示領域に収まるべき画面サイズ */
const SUPPORTED_VIEWPORTS = [
  { name: 'itch.io 推奨 (1280x800)', width: 1280, height: 800 },
  { name: 'itch.io 旧推奨 (1280x960)', width: 1280, height: 960 },
  { name: 'ノートPC (1024x768)', width: 1024, height: 768 },
  { name: 'フルHD (1920x1080)', width: 1920, height: 1080 },
]

test.describe('画面サイズごとの収まり', () => {
  for (const viewport of SUPPORTED_VIEWPORTS) {
    test(`${viewport.name} で「はじめる」が表示領域に収まる`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')

      const startButton = page.getByRole('button', { name: /はじめる|Start/ })
      await expect(startButton).toBeVisible()
      await waitForEntranceAnimation(page)

      const box = await startButton.boundingBox()
      expect(box).not.toBeNull()

      // スクロールせずにクリックできる位置にあること
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
    })
  }

  test('プレイエリアは画面が広いほど大きくなる', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await waitForEntranceAnimation(page)
    const small = await layoutHeight(page, 'game-area')

    await page.setViewportSize({ width: 1280, height: 1200 })
    const large = await layoutHeight(page, 'game-area')

    expect(small).not.toBeNull()
    expect(large).not.toBeNull()
    expect(large!).toBeGreaterThan(small!)
  })

  test('プレイエリアは狭い画面でも最低限の高さを保つ', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 })
    await page.goto('/')
    await waitForEntranceAnimation(page)

    const height = await layoutHeight(page, 'game-area')
    expect(height).not.toBeNull()
    // フルーツが落ちる余地が残っていること
    expect(height!).toBeGreaterThanOrEqual(200)
  })
})
