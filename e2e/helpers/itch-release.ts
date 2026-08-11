import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test'

export type FruitKind = 'apple' | 'blueberry' | 'lemon' | 'watermelon'

/**
 * Playwright の baseURL をディレクトリとして正規化する。
 * 末尾スラッシュがないと `new URL('./', base)` が親ディレクトリに解決される。
 */
export function normalizeAppBaseURL(baseURL: string): string {
  const url = new URL(baseURL)
  if (!url.pathname.endsWith('/')) {
    url.pathname += '/'
  }
  return url.href
}

/**
 * アプリを開く。
 *
 * `page.goto('/')` はパス絶対指定のため baseURL のサブパスを捨て、
 * `http://host/`（ディレクトリ一覧など）へ飛んでしまう。
 * itch のサブパス配信（例: /html/12345/）と Vercel ルート配信の両方で
 * 同じテストを通すため、baseURL をディレクトリとして開く。
 *
 * 相対指定 `./` でもよいが、末尾スラッシュ有無の差を吸収するため絶対URLへ正規化する。
 */
export async function gotoApp(page: Page, baseURL: string) {
  const target = normalizeAppBaseURL(baseURL)
  await page.goto(target)
  await page.waitForLoadState('domcontentloaded')
  // サブパスを捨ててオリジン直下へ落ちていないこと
  expect(
    page.url().startsWith(target.replace(/\/$/, '')),
    `unexpected url: ${page.url()} (expected under ${target})`
  ).toBe(true)
}

/**
 * itch.io 公開前チェック用ヘルパー。
 * exploratory.spec.ts の fruitsOfType と同じく、スプライト画像から操作対象を辿る。
 */
export function fruitsOfType(
  root: Page | FrameLocator,
  type: FruitKind
): Locator {
  return root.locator(`[data-testid="game-area"] [role="button"]:has(img[src*="${type}"])`)
}

export async function startViaHajimeru(page: Page | FrameLocator) {
  await page.getByRole('button', { name: /はじめる|Start/i }).click()
}

/** アーケードは generateBalancedFruits で4種が揃うため、操作別収穫の検証向き */
export async function startArcade(page: Page | FrameLocator) {
  await page.getByTestId('mode-select-arcade').click()
  await expect(page.getByRole('button', { name: /ちゅうだん|Pause/i })).toBeVisible()
}

export async function getScoreValue(page: Page | FrameLocator): Promise<number> {
  const text = await page.getByTestId('score-value').textContent()
  return parseInt((text ?? '0').replace(/[^\d]/g, ''), 10) || 0
}

/**
 * 右端ドロップエリアに重なっていない個体を優先して1つ返す。
 * 見つからなければ先頭（呼び出し側で再試行する）。
 *
 * 注意: 返した Locator は遅延評価のため、取得から操作までに間を空けると
 * アーケードの補充・重なり変化で別ノードを指すことがある。操作は直後に行うこと。
 */
export async function findInteractableFruit(
  page: Page,
  type: FruitKind
): Promise<Locator> {
  const dropArea = page.locator('[data-testid="game-area"] .drop-area')
  const dropBox = await dropArea.boundingBox()
  const fruits = fruitsOfType(page, type)
  await expect(fruits.first()).toBeVisible({ timeout: 15_000 })

  const count = await fruits.count()
  for (let i = 0; i < count; i++) {
    const fruit = fruits.nth(i)
    const box = await fruit.boundingBox()
    if (!box) continue
    const overlapsDropArea = dropBox !== null && box.x + box.width > dropBox.x
    if (!overlapsDropArea) return fruit
  }
  return fruits.first()
}

async function waitForScoreAbove(
  page: Page,
  minimumExclusive: number,
  timeoutMs: number
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if ((await getScoreValue(page)) > minimumExclusive) return true
    await page.waitForTimeout(40)
  }
  return (await getScoreValue(page)) > minimumExclusive
}

/**
 * 指定種類のフルーツを正しい操作で収穫する。
 *
 * Flaky の理由:
 * - アーケードでは収穫のたびに畑が差し替わり、重なりも変わる。
 * - 「種類の n 番目」Locator を握ってから操作するまでに対象が消える／差し替わると空振りし、
 *   得点が増えない（アプリ欠陥ではなく操作タイミングの問題）。
 * - レモンは onMouseDown(button===2) で収穫判定する。
 *
 * 対策:
 * - 試行ごとに data-fruit-id で個体をピン留めし、そのノードへ force 操作する
 *   （座標クリックは上に重なった別種を誤爆しやすいので使わない）
 * - 失敗したら別個体で再試行する（上限付き）
 *
 * リトライが許容すること:
 * - 対象消失・差し替え・瞬間的な取りこぼし（MAX_HARVEST_ATTEMPTS 回まで）
 *
 * リトライが許容しないこと:
 * - 操作種別そのものの実装バグ（上限到達で失敗）
 * - 当該フルーツが一向に出ない（visible 待ちタイムアウト）
 */
const MAX_HARVEST_ATTEMPTS = 8

export async function harvestFruit(
  page: Page,
  type: FruitKind,
  action: 'click' | 'dblclick' | 'rightClick'
) {
  const scoreBefore = await getScoreValue(page)
  const dropArea = page.locator('[data-testid="game-area"] .drop-area')

  for (let attempt = 0; attempt < MAX_HARVEST_ATTEMPTS; attempt++) {
    const fruits = fruitsOfType(page, type)
    await expect(fruits.first()).toBeVisible({ timeout: 15_000 })

    const dropBox = await dropArea.boundingBox()
    const count = await fruits.count()

    let fruitId: string | null = null
    for (let i = 0; i < count; i++) {
      const candidate = fruits.nth(i)
      const candidateBox = await candidate.boundingBox()
      if (!candidateBox) continue
      const overlapsDropArea =
        dropBox !== null && candidateBox.x + candidateBox.width > dropBox.x
      if (overlapsDropArea) continue
      fruitId = await candidate.getAttribute('data-fruit-id')
      if (fruitId) break
    }
    if (!fruitId) {
      fruitId = await fruits.first().getAttribute('data-fruit-id')
    }
    if (!fruitId) continue

    // ピン留めした個体だけを操作する（nth のずれを避ける）
    // fruit.id は数値文字列のため属性セレクタにそのまま使える
    const pinned = page.locator(
      `[data-testid="game-area"] [data-fruit-id="${fruitId}"]`
    )
    if (!(await pinned.isVisible().catch(() => false))) continue

    try {
      // Playwright の actionability / 座標ヒットに頼らず、ピン留めノードへ直接イベントを送る。
      // レモンは onMouseDown(button===2)、りんごは onClick、ブルーベリーは onDoubleClick。
      await pinned.evaluate((el, act) => {
        const fire = (type: string, init: MouseEventInit) => {
          el.dispatchEvent(
            new MouseEvent(type, { bubbles: true, cancelable: true, view: window, ...init })
          )
        }
        if (act === 'rightClick') {
          fire('mousedown', { button: 2, buttons: 2 })
        } else if (act === 'dblclick') {
          fire('dblclick', { button: 0, buttons: 0 })
        } else {
          fire('click', { button: 0, buttons: 0 })
        }
      }, action)
    } catch {
      continue
    }

    if (await waitForScoreAbove(page, scoreBefore, 1200)) return
  }

  throw new Error(
    `${type} の ${action} で得点が増えませんでした（${MAX_HARVEST_ATTEMPTS} 回まで再試行）`
  )
}

/**
 * Web Audio の発火を数える。
 *
 * 注意: 実際にスピーカーから聞こえるかは自動判定できない。
 * SoundManager は OscillatorNode.start で合成音を鳴らすため、その呼び出し回数をスパイする。
 */
export async function installAudioPlayCounter(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __audioOscillatorStarts: number
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    w.__audioOscillatorStarts = 0

    // 効果音オフだと play() が早期 return するため、検証用に強制オン
    try {
      localStorage.setItem('soundEnabled', 'true')
    } catch {
      // private mode 等では無視
    }

    const Original = w.AudioContext ?? w.webkitAudioContext
    if (!Original) return

    const origCreateOscillator = Original.prototype.createOscillator
    Original.prototype.createOscillator = function createOscillator(
      this: AudioContext,
      ...args: Parameters<AudioContext['createOscillator']>
    ) {
      const osc = origCreateOscillator.apply(this, args)
      const origStart = osc.start.bind(osc)
      osc.start = (...startArgs: Parameters<OscillatorNode['start']>) => {
        w.__audioOscillatorStarts += 1
        return origStart(...startArgs)
      }
      return osc
    }
  })
}

export async function getAudioPlayCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      (window as unknown as { __audioOscillatorStarts?: number }).__audioOscillatorStarts ?? 0
  )
}

export type HttpErrorRecord = { url: string; status: number }

/**
 * 同一オリジンの 4xx/5xx を収集する。
 * page.goto より前に呼ぶこと（初期ロードの失敗も拾うため）。
 *
 * 除外:
 * - 他オリジン（Google Fonts 等。オフライン時の見た目は docs 既知注意点で手動）
 * - favicon: ブラウザが勝手に取りに行くことがあり、ゲーム本体の配信成否とは無関係
 */
export function installSameOriginHttpErrorCollector(
  page: Page,
  baseURL: string
): HttpErrorRecord[] {
  const host = new URL(baseURL).host
  const errors: HttpErrorRecord[] = []

  page.on('response', (res) => {
    const status = res.status()
    if (status < 400) return

    const url = res.url()
    try {
      if (new URL(url).host !== host) return
    } catch {
      return
    }
    if (/\/favicon\.ico(\?|$)/i.test(url)) return

    errors.push({ url, status })
  })

  return errors
}

/**
 * 収集した 4xx/5xx のうち、同一 URL への再 GET が成功したものだけを一過性として落とす。
 *
 * - オリジン直下 `/_next/...` の 404 はパス誤り（CHECK-(4) の本命）なので、
 *   再試行も 404 のまま残り、除外されない。
 * - 503 等は再試行が 2xx/3xx なら一過性とみなして除外する。
 * - パスやステータス番号での一律除外はしない。
 */
export async function retainPersistentHttpErrors(
  page: Page,
  errors: HttpErrorRecord[]
): Promise<HttpErrorRecord[]> {
  const uniqueByUrl = new Map<string, HttpErrorRecord>()
  for (const error of errors) {
    if (!uniqueByUrl.has(error.url)) {
      uniqueByUrl.set(error.url, error)
    }
  }

  const persistent: HttpErrorRecord[] = []
  for (const error of uniqueByUrl.values()) {
    const retryStatus = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, { method: 'GET', cache: 'no-store' })
        return res.status
      } catch {
        return 0
      }
    }, error.url)

    if (retryStatus > 0 && retryStatus < 400) {
      continue
    }
    persistent.push(error)
  }
  return persistent
}

/**
 * ゲームエリア内のスプライト img がデコード済みか（実行時生成ノードのロード成否）。
 * naturalWidth === 0 は 404・パス壊れ・未ロードを示す。
 */
export async function assertGameAreaSpritesDecoded(page: Page) {
  const sprites = page.locator('[data-testid="game-area"] img[src*="sprites/"]')
  await expect(sprites.first()).toBeVisible({ timeout: 15_000 })

  const bad = await sprites.evaluateAll((imgs) =>
    (imgs as HTMLImageElement[])
      .map((img) => ({
        src: img.currentSrc || img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      }))
      .filter((i) => !(i.complete && i.naturalWidth > 0))
  )

  expect(bad, `sprite decode failed: ${JSON.stringify(bad, null, 2)}`).toEqual([])
}

/**
 * スイカを右端ドロップエリアへ運ぶ。
 * カスタム mouse ハンドラ実装のため HTML5 DnD ではなく page.mouse を使う。
 * 重なりや取りこぼしで失敗しうるので、得点が増えるまで別個体で再試行する。
 */
export async function dragWatermelonToDropArea(page: Page) {
  const dropArea = page.locator('[data-testid="game-area"] .drop-area')
  await expect(dropArea).toBeVisible()
  await expect(fruitsOfType(page, 'watermelon').first()).toBeVisible({ timeout: 15_000 })

  const scoreBefore = await getScoreValue(page)

  for (let attempt = 0; attempt < 5; attempt++) {
    const fruits = fruitsOfType(page, 'watermelon')
    const count = await fruits.count()
    if (count === 0) {
      await page.waitForTimeout(400)
      continue
    }

    const watermelon = fruits.nth(attempt % count)
    const wmBox = await watermelon.boundingBox()
    const dropBox = await dropArea.boundingBox()
    if (!wmBox || !dropBox) continue

    // record-gameplay.ts と同じ手順（down 後に一拍置いてから移動）
    await page.mouse.move(wmBox.x + wmBox.width / 2, wmBox.y + wmBox.height / 2)
    await page.waitForTimeout(100)
    await page.mouse.down()
    await page.waitForTimeout(300)
    await page.mouse.move(dropBox.x + dropBox.width / 2, dropBox.y + dropBox.height / 2, {
      steps: 25,
    })
    await page.waitForTimeout(200)
    await page.mouse.up()
    await page.waitForTimeout(400)

    if ((await getScoreValue(page)) > scoreBefore) return
  }

  throw new Error('スイカのドラッグ＆ドロップで得点が増えませんでした')
}
