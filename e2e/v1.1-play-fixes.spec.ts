import { test, expect, type Page } from '@playwright/test'
import { startArcade, harvestFruit } from './helpers/itch-release'

/**
 * v1.1 計画の合格条件を、実ブラウザで測る（docs/v1.1-plan.md）。
 * ベースラインは docs/v1.1-tasks.md T1。
 */

// 配置の基準は itch.io の埋め込みサイズ（docs/game-spec.md §3、types/game.ts PLACEMENT_CONFIG）
test.use({ viewport: { width: 1280, height: 800 } })

test.describe('G1: ブルーベリーの正しいダブルクリックはミスにならない', () => {
  test('りんご→ブルーベリーの順に正しく取ると、ミスのヒントが出ずコンボが 2 になる', async ({ page }) => {
    await page.goto('/')
    await startArcade(page)

    await harvestFruit(page, 'apple', 'click')
    await harvestFruit(page, 'blueberry', 'dblclick')

    // ダブルクリックの途中のクリックが遅れて届いても拾えるよう、保留時間より長く待つ
    await page.waitForTimeout(800)
    await expect(page.getByText(/ダブルクリックだよ/)).toHaveCount(0)
    await expect(page.getByText(/2\s*コンボ/)).toBeVisible()
  })

  test('ブルーベリーを1回だけクリックすると、これまでどおりヒントが出る', async ({ page }) => {
    await page.goto('/')
    await startArcade(page)

    const berry = page.locator('[data-testid="game-area"] [role="button"]:has(img[src*="blueberry"])').first()
    const box = (await berry.boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    await expect(page.getByText(/ブルーベリーはダブルクリックだよ/)).toBeVisible()
  })
})

test.describe('G5: 開始直後の果物が、他の果物や凡例に隠れない', () => {
  test.setTimeout(120_000)

  async function measure(page: Page) {
    return page.evaluate(() => {
      const legend = document.querySelector('[data-testid="operation-legend"]')?.getBoundingClientRect()
        ?? [...document.querySelectorAll('div')]
          .find((d) => d.className.includes('bottom-1.5') && d.textContent?.includes('とりかた'))
          ?.firstElementChild?.getBoundingClientRect()
      const hit = (a: DOMRect, b: DOMRect) =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
      const els = [...document.querySelectorAll<HTMLElement>('[role="button"][data-fruit-id]')]
      const rects = els.map((e) => e.getBoundingClientRect())
      let pairs = 0
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (hit(rects[i], rects[j])) pairs++
      let covered = 0
      els.forEach((e, i) => {
        const r = rects[i]
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        if (top?.closest('[data-fruit-id]') !== e) covered++
      })
      const underLegend = legend ? rects.filter((r) => hit(r, legend)).length : -1
      return { n: els.length, pairs, covered, underLegend }
    })
  }

  test('アーケードを20回開始して、重なり・覆われ・凡例との重なりがすべて 0', async ({ page }) => {
    const total = { n: 0, pairs: 0, covered: 0, underLegend: 0 }
    for (let run = 0; run < 20; run++) {
      await page.goto('/')
      await startArcade(page)
      await expect(page.locator('[data-fruit-id]').first()).toBeVisible()
      // 登場アニメーションが落ち着くのを待つ
      await page.waitForTimeout(700)
      const m = await measure(page)
      expect(m.underLegend).toBeGreaterThanOrEqual(0)
      total.n += m.n
      total.pairs += m.pairs
      total.covered += m.covered
      total.underLegend += m.underLegend
    }
    console.log(`G5 measurement: ${JSON.stringify(total)}`)
    expect(total.n).toBe(240)
    expect(total.pairs).toBe(0)
    expect(total.covered).toBe(0)
    expect(total.underLegend).toBe(0)
  })
})

test.describe('G12: ?debug=1 の診断と ?test=1 の自動プレイ', () => {
  test.setTimeout(120_000)

  test('?test=1&debug=1 で、4操作すべてが成功し、ミス 0 で結果画面まで行く', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/?test=1&debug=1')
    const panel = page.getByTestId('debug-panel')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText('mode: arcade')

    await expect(page.getByRole('dialog').filter({ hasText: /アーケードけっか/ })).toBeVisible({ timeout: 80_000 })
    for (const action of ['click', 'doubleClick', 'rightClick', 'drop']) {
      const value = Number(await panel.getByTestId(`debug-ok-${action}`).textContent())
      expect(value).toBeGreaterThanOrEqual(1)
    }
    expect(Number(await panel.getByTestId('debug-miss').textContent())).toBe(0)
    expect(errors).toEqual([])
  })

  test('指定しなければ診断は出ず、自動では始まらない', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await expect(page.getByTestId('debug-panel')).toHaveCount(0)
    await expect(page.getByTestId('mode-start')).toBeVisible()
  })
})
