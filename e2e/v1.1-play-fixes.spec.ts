import { test, expect, type Page } from '@playwright/test'
import { startArcade, harvestFruit } from './helpers/itch-release'

/**
 * v1.1 計画の合格条件を、実ブラウザで測る（docs/v1.1-plan.md）。
 * ベースラインは docs/v1.1-tasks.md T1。
 */

// 配置の基準は itch.io の埋め込みサイズ（docs/game-spec.md §3、types/game.ts PLACEMENT_CONFIG）
test.use({ viewport: { width: 1280, height: 800 } })

/**
 * 人がマウスで押すのと同じく、座標で「はじめる」を押す。
 *
 * Firefox では Playwright の locator.click()（要素を画面内に入れる処理を伴う）で押すと、
 * 開始の瞬間にページが最下部までスクロールすることがある（45回中11回）。
 * 座標で直接押すと 105 回で一度も起きなかったので、テストの押し方による現象と判断した（2026-09-24）
 */
async function startArcadeByMouse(page: Page) {
  await page.getByTestId('mode-start').waitFor()
  await page.waitForTimeout(300)
  const card = (await page.getByTestId('mode-select-arcade').boundingBox())!
  await page.mouse.click(card.x + card.width / 2, card.y + card.height / 2)
  const start = (await page.getByTestId('mode-start').boundingBox())!
  await page.mouse.click(start.x + start.width / 2, start.y + start.height / 2)
  await expect(page.getByRole('button', { name: /ちゅうだん|Pause/i })).toBeVisible()
}

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
      await startArcadeByMouse(page)
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

  test('?test=1&debug=1&bot=beginner で、4操作すべてを使って結果画面まで行く', async ({ page, browserName }) => {
    // チャレンジは時間をかせぐ型（v1.2 D1）なので、ミスしない expert は約 5 分続く。
    // 約 90 秒で終わる beginner（1.5 秒ごと・ミス 20%）で通す。
    // ヘッドレスの WebKit（Linux・ソフトウェア描画）では、収穫が続くと演出の描画でタイマーごと遅れ、
    // 単独で流しても 180 秒で終わらない（何も操作しなければ遅れない。2026-09-24 実測）。実機 Safari は未確認
    test.fixme(browserName === 'webkit', 'ヘッドレス WebKit では収穫が続くとタイマーが遅れる。実機 Safari で要確認')
    test.setTimeout(200_000)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/?test=1&debug=1&bot=beginner')
    const panel = page.getByTestId('debug-panel')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText('mode: arcade')

    await expect(page.getByRole('dialog').filter({ hasText: /チャレンジけっか/ })).toBeVisible({ timeout: 180_000 })
    for (const action of ['click', 'doubleClick', 'rightClick', 'drop']) {
      const value = Number(await panel.getByTestId(`debug-ok-${action}`).textContent())
      expect(value).toBeGreaterThanOrEqual(1)
    }
    // beginner は5回に1回まちがえる。ミスは数として出て、結果には「にがてな そうさ」が出る
    expect(Number(await panel.getByTestId('debug-miss').textContent())).toBeGreaterThan(0)
    await expect(page.getByTestId('arcade-weak-operation')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('指定しなければ診断は出ず、自動では始まらない', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await expect(page.getByTestId('debug-panel')).toHaveCount(0)
    await expect(page.getByTestId('mode-start')).toBeVisible()
  })
})

test.describe('G7: 待機中の画面の文字を減らす（D6）', () => {
  test('ビューポート内の文字ブロックが 20 以下（ベースライン 47）', async ({ page }) => {
    await page.goto('/?lang=ja')
    await expect(page.getByTestId('mode-start')).toBeVisible()
    await page.waitForTimeout(800)

    // T1 のベースライン計測と同じ数え方: 直下に文字を持つ、画面内に見えている要素
    const blocks = await page.evaluate(() => {
      const visible = (e: Element) => {
        const r = e.getBoundingClientRect()
        const s = getComputedStyle(e)
        return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && s.visibility !== 'hidden' && s.opacity !== '0'
      }
      return [...document.body.querySelectorAll('*')]
        .filter((e) => !['SCRIPT', 'STYLE', 'OPTION'].includes(e.tagName))
        .filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
        .filter(visible)
        .map((e) => e.textContent!.trim().slice(0, 20))
    })
    console.log(`G7 measurement: ${blocks.length} ${JSON.stringify(blocks)}`)
    expect(blocks.length).toBeLessThanOrEqual(20)
  })
})

test.describe('G2: アーケードのコンボ倍率は1か所', () => {
  test('3つ続けて取ると、倍率の表示は1つだけで x2', async ({ page }) => {
    await page.goto('/?lang=ja')
    await startArcade(page)
    for (let i = 0; i < 3; i++) await harvestFruit(page, 'apple', 'click')

    const multipliers = page.getByTestId('game-area').locator('xpath=ancestor::body').getByText(/^x\d+$/)
    await expect(page.getByTestId('arcade-combo')).toContainText('x2')
    await expect(multipliers).toHaveCount(1)
    await expect(page.getByText(/コンボ!/)).toHaveCount(0)
  })
})

test.describe('G8: 0点でも次にやることが出る（D1）', () => {
  test.setTimeout(120_000)

  test('アーケードを放置して0点で終わると、ランクではなく「まずは 🍎 をクリックしてみよう」が出る', async ({ page }) => {
    await page.goto('/?lang=ja')
    await startArcade(page)
    const result = page.getByRole('dialog').filter({ hasText: /チャレンジけっか/ })
    await expect(result).toBeVisible({ timeout: 80_000 })
    await expect(result.getByTestId('arcade-zero-hint')).toContainText('まずは 🍎 をクリックしてみよう')
    await expect(result.getByTestId('arcade-result-rank')).toHaveCount(0)
  })

  test('れんしゅうを放置して0点で終わっても、リザルトと「もういちど」が出る', async ({ page }) => {
    await page.goto('/?lang=ja')
    await page.getByTestId('mode-select-practice').click()
    await page.getByTestId('mode-start').click()
    const result = page.getByRole('dialog').filter({ hasText: /れんしゅうけっか/ })
    await expect(result).toBeVisible({ timeout: 80_000 })
    await result.getByRole('button', { name: 'もういちど' }).click()
    await expect(page.getByRole('button', { name: /ちゅうだん/ })).toBeVisible()
  })
})

test.describe('G16: 日本語以外のブラウザは英語（D8）', () => {
  for (const locale of ['ko-KR', 'fr-FR', 'zh-CN']) {
    test.describe(locale, () => {
      test.use({ locale })
      test(`${locale} では英語で始まる`, async ({ page }) => {
        await page.goto('/')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Fruit Harvest Game/)
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      })
    })
  }

  test('ja-JP では日本語のまま', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/フルーツハーベストゲーム/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  })
})

test.describe('開始してもページがスクロールしない', () => {
  test.setTimeout(180_000)

  // 開始の瞬間に上側の HUD が増え、下側の練習パネルが消える（ページの高さが 2040 → 1108px）。
  // それでもプレイエリアの上部が画面外に出ないこと。押し方は人と同じ座標クリック（startArcadeByMouse の注記）
  test('「はじめる」を15回押して、毎回 scrollY が 0 のまま', async ({ page }) => {
    const scrolled: number[] = []
    for (let run = 0; run < 15; run++) {
      await page.goto('/')
      await startArcadeByMouse(page)
      await page.waitForTimeout(300)
      scrolled.push(await page.evaluate(() => window.scrollY))
    }
    expect(scrolled.filter((y) => y !== 0)).toEqual([])
  })
})

test.describe('小さい画面でも果物が重ならない（v1.1 残作業）', () => {
  test.setTimeout(180_000)
  // 800×600 ではプレイエリアが 768×312px。1280×800 基準で配置していた間は、
  // 15回開始×12個で重なり 29 組・覆われ 4 個・凡例と重なり 18 個だった（2026-09-24 実測）
  test.use({ viewport: { width: 800, height: 600 } })

  test('800×600 でアーケードを15回開始して、重なり・覆われ・凡例との重なりがすべて 0', async ({ page }) => {
    const total = { n: 0, pairs: 0, covered: 0, underLegend: 0 }
    for (let run = 0; run < 15; run++) {
      await page.goto('/')
      await startArcadeByMouse(page)
      await expect(page.locator('[data-fruit-id]').first()).toBeVisible()
      await page.waitForTimeout(600)
      const m = await page.evaluate(() => {
        const legend = [...document.querySelectorAll('div')]
          .find((d) => d.className.includes('bottom-1.5') && d.textContent?.includes('とりかた'))
          ?.firstElementChild?.getBoundingClientRect()
        const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
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
        return { n: els.length, pairs, covered, underLegend: legend ? rects.filter((r) => hit(r, legend)).length : -1 }
      })
      total.n += m.n
      total.pairs += m.pairs
      total.covered += m.covered
      total.underLegend += m.underLegend
    }
    console.log(`small viewport measurement: ${JSON.stringify(total)}`)
    expect(total).toEqual({ n: 180, pairs: 0, covered: 0, underLegend: 0 })
  })
})


test.describe('v1.2 G8: 800 幅でもプレイエリアが画面の半分以上（D8）', () => {
  test.use({ viewport: { width: 800, height: 600 } })

  test('チャレンジ中のプレイエリアの高さが 400px 以上。ゲージはプレイエリアの上端にあり、ヘッダのベストは隠れる', async ({ page }) => {
    await page.goto('/?lang=ja')
    await startArcadeByMouse(page)
    await page.waitForTimeout(500)
    const m = await page.evaluate(() => {
      const area = document.querySelector('[data-testid="game-area"]')!.getBoundingClientRect()
      const gauges = [...document.querySelectorAll('[role="progressbar"]')].filter((e) => (e as HTMLElement).offsetParent !== null)
      const gauge = gauges[0]?.getBoundingClientRect()
      return { areaH: Math.round(area.height), areaTop: area.top, areaBottom: area.bottom, gaugeTop: gauge?.top, visibleGauges: gauges.length }
    })
    console.log(`G8 measurement: ${JSON.stringify(m)}`)
    expect(m.areaH).toBeGreaterThanOrEqual(400)
    expect(m.visibleGauges).toBe(1)
    expect(m.gaugeTop!).toBeGreaterThanOrEqual(m.areaTop)
    await expect(page.getByText('ベスト:')).toBeHidden()
  })
})

test.describe('v1.2 D8: 広い画面ではヘッダにゲージとベスト', () => {
  test('1280×800 ではゲージはヘッダにあり、ベストが見える', async ({ page }) => {
    await page.goto('/?lang=ja')
    await startArcadeByMouse(page)
    await page.waitForTimeout(500)
    const m = await page.evaluate(() => {
      const area = document.querySelector('[data-testid="game-area"]')!.getBoundingClientRect()
      const gauges = [...document.querySelectorAll('[role="progressbar"]')].filter((e) => (e as HTMLElement).offsetParent !== null)
      return { areaTop: area.top, gaugeTop: gauges[0]?.getBoundingClientRect().top, visibleGauges: gauges.length }
    })
    expect(m.visibleGauges).toBe(1)
    expect(m.gaugeTop!).toBeLessThan(m.areaTop)
    await expect(page.getByText('ベスト:')).toBeVisible()
  })
})
