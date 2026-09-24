import { test, expect, type Page } from '@playwright/test'
import { startArcade } from './helpers/itch-release'

/**
 * 「何も操作せず放置して結果画面まで行く」（出荷前チェックリスト 6-3、v1.1 計画 G11）。
 *
 * 操作して遊ぶテストだけでは、ゲームが止まっていても・画面が真っ白でも気づけない。
 * 放置で結果に着くこと、プレイ中の画面に実際に絵が出ていることを assert する。
 */

/**
 * スクリーンショットの画素を数える。
 * 真っ白・真っ黒・単色なら distinctColors がごく少なくなる。
 */
async function measurePixels(page: Page, png: Buffer) {
  return page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const colors = new Set<number>()
    let dark = 0
    let total = 0
    // 4画素に1つ標本を取れば十分
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      colors.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3))
      if (r + g + b < 60) dark++
      total++
    }
    return { distinctColors: colors.size, darkRatio: dark / total }
  }, png.toString('base64'))
}

test.describe('放置で結果画面まで行く', () => {
  // 60 秒のラウンドを待つ
  test.setTimeout(120_000)

  test('チャレンジを何も操作せず放置すると、時間切れで結果画面が出る', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/')
    await startArcade(page)

    // プレイ中の画面に絵が出ている（真っ白・真っ黒・単色ではない）
    const gameArea = page.getByTestId('game-area')
    await expect(gameArea.locator('[data-fruit-id]').first()).toBeVisible()
    const pixels = await measurePixels(page, await gameArea.screenshot())
    expect(pixels.distinctColors).toBeGreaterThan(50)
    expect(pixels.darkRatio).toBeLessThan(0.5)

    // 時間切れで結果モーダルが出る（60 秒 + 余裕）
    const result = page.getByRole('dialog').filter({ hasText: /チャレンジけっか|Challenge Result/i })
    await expect(result).toBeVisible({ timeout: 80_000 })
    await expect(result.getByRole('button', { name: /もういちど|Play again/i })).toBeVisible()

    expect(errors).toEqual([])
  })
})
