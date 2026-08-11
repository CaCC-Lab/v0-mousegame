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
 * 右端ドロップエリアに重なっていない個体を優先する。
 * 重なっているとポインタが遮られてクリックできない（game-flow.spec.ts と同じ理由）。
 * フルーツ同士の重なりもあるため、呼び出し側は click({ force: true }) を推奨。
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

/** フルーツ操作は重なりで遮られやすいので force クリックする。得点が増えるまで再試行する。 */
export async function harvestFruit(
  page: Page,
  type: FruitKind,
  action: 'click' | 'dblclick' | 'rightClick'
) {
  const scoreBefore = await getScoreValue(page)

  for (let attempt = 0; attempt < 5; attempt++) {
    const fruit = await findInteractableFruit(page, type)
    if (action === 'click') {
      await fruit.click({ force: true, timeout: 5000 })
    } else if (action === 'dblclick') {
      await fruit.dblclick({ force: true, timeout: 5000 })
    } else {
      await fruit.click({ button: 'right', force: true, timeout: 5000 })
    }
    await page.waitForTimeout(300)
    if ((await getScoreValue(page)) > scoreBefore) return
  }

  throw new Error(`${type} の ${action} で得点が増えませんでした`)
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
 * サブパス配信 + 単スレッド http.server 負荷時に出やすいノイズか。
 *
 * itch ビルドの webpack は publicPath が "/_next/" のまま残ることがあり、
 * 並列取得でチャンク再取得がオリジン直下へ飛ぶと 404 になる。
 * ルート配信（pathname === '/'）では /_next/ は正規パスなのでノイズ扱いにしない。
 *
 * /sprites/ の絶対パス化などは書き換え漏れの本命なので、ここでは除外しない。
 */
export function isWebpackPublicPathNoise(
  error: HttpErrorRecord,
  baseURL: string
): boolean {
  const app = new URL(normalizeAppBaseURL(baseURL))
  if (app.pathname === '/') return false

  try {
    const u = new URL(error.url)
    return u.origin === app.origin && u.pathname.startsWith('/_next/')
  } catch {
    return false
  }
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
