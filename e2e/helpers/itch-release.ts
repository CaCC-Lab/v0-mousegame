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
 * 指定座標の hit test 最前面が、指定 fruit id の個体か。
 * 実マウス操作では遮蔽された個体の中心をクリックしても届かないため、操作前に確認する。
 */
async function isFruitTopmostAtPoint(
  page: Page,
  fruitId: string,
  x: number,
  y: number
): Promise<boolean> {
  return page.evaluate(
    ({ fruitId: id, x: px, y: py }) => {
      const el = document.elementFromPoint(px, py)
      if (!el) return false
      const host = el.closest('[data-fruit-id]')
      return host?.getAttribute('data-fruit-id') === id
    },
    { fruitId, x, y }
  )
}

/**
 * 指定種類のフルーツを正しい操作で収穫する（実マウス操作）。
 *
 * スイカの D&D（page.mouse）と同じ水準で、click / dblclick / rightClick も
 * page.mouse の hit testing を通す。dispatchEvent は使わない
 * （遮蔽・pointer-events・イベント列・ユーザー操作相当を検証するため）。
 *
 * Flaky の理由と対策:
 * - アーケードでは畑の差し替え・重なりで、掴んだ個体が操作前に消える／隠れる。
 * - data-fruit-id でピン留めし、boundingBox 取得直後に page.mouse で操作する。
 * - 中心が他要素に隠れていればその個体は飛ばし、別個体を試す。
 * - 空振りしたら上限付きで再試行する。
 *
 * リトライが許容すること: 消失・遮蔽による一時的な空振り（MAX_HARVEST_ATTEMPTS 回まで）
 * リトライが許容しないこと: 操作実装バグ、フルーツが一向に出ないこと
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

    const tryClickPass = async (requireClearOfDropArea: boolean): Promise<boolean> => {
      for (let i = 0; i < count; i++) {
        const candidate = fruits.nth(i)
        const probeBox = await candidate.boundingBox()
        if (!probeBox) continue
        if (
          requireClearOfDropArea &&
          dropBox !== null &&
          probeBox.x + probeBox.width > dropBox.x
        ) {
          continue
        }

        const fruitId = await candidate.getAttribute('data-fruit-id')
        if (!fruitId) continue

        const pinned = page.locator(
          `[data-testid="game-area"] [data-fruit-id="${fruitId}"]`
        )
        // 操作直前に座標を取り直す（取得〜操作の隙間を最小化）
        const box = await pinned.boundingBox()
        if (!box) continue
        const x = box.x + box.width / 2
        const y = box.y + box.height / 2

        if (!(await isFruitTopmostAtPoint(page, fruitId, x, y))) continue

        try {
          if (action === 'click') {
            await page.mouse.click(x, y)
          } else if (action === 'dblclick') {
            await page.mouse.dblclick(x, y)
          } else {
            // レモンは onMouseDown(button===2)。page.mouse の right click がそれに相当
            await page.mouse.click(x, y, { button: 'right' })
          }
        } catch {
          continue
        }
        return true
      }
      return false
    }

    // ドロップエリア非重複を先に試し、だめなら全体から（実マウスの hit test 前提）
    const acted =
      (await tryClickPass(true)) || (await tryClickPass(false))
    if (!acted) continue
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
  // host ではなく origin で比較する。host だとプロトコルが異なる URL
  // (http:// と https:// が混在する構成) まで同一オリジンとして拾ってしまう
  // (独立レビュー CodeRabbit の指摘)。
  const origin = new URL(baseURL).origin
  const errors: HttpErrorRecord[] = []

  page.on('response', (res) => {
    const status = res.status()
    if (status < 400) return

    const url = res.url()
    try {
      if (new URL(url).origin !== origin) return
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
