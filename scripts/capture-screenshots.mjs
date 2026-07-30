/**
 * README / itch.io ストアページ用のスクリーンショットを撮影する。
 *
 * 使い方:
 *   npm run build:itch          # 配布物を作る
 *   node scripts/capture-screenshots.mjs
 *
 * 配布するものと同じビルド成果物を、itch.io と同じサブパス配信の形で撮る。
 * 出力先: docs/screenshots/
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDir = path.join(projectRoot, 'dist-itch', 'build')
const outDir = path.join(projectRoot, 'docs', 'screenshots')
const VIEWPORT = { width: 1280, height: 800 }

/**
 * 空いているポートを取得する。
 * 固定ポートだと、別のプロジェクトが同じポートで配信していた場合に
 * そちらへ接続してしまい、無関係な画面（や404）を撮ってしまう。
 */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.on('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })
}

function fail(what, how) {
  console.error(`\n❌ ${what}\n   対処: ${how}\n`)
  process.exit(1)
}

if (!fs.existsSync(buildDir)) {
  fail('dist-itch/build が見つかりません', '先に npm run build:itch を実行してください')
}

// itch.io と同じ「サブパス配信」を再現する
const serveRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fruit-shots-'))
const gameDir = path.join(serveRoot, 'html', '12345')
fs.mkdirSync(gameDir, { recursive: true })
fs.cpSync(buildDir, gameDir, { recursive: true })

const PORT = await findFreePort()
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: serveRoot,
  stdio: 'ignore',
})

const URL = `http://127.0.0.1:${PORT}/html/12345/index.html`

/** 自分が立てたサーバーが、意図したゲームを返しているか確かめる */
async function assertServingOurGame() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(URL)
      if (res.ok) {
        const html = await res.text()
        if (html.includes('フルーツハーベスト')) return
        fail(
          `ポート${PORT}が別の内容を返しています`,
          '他のプロセスが同じポートを使っていないか確認してください'
        )
      }
    } catch {
      // 起動待ち
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  fail('配信サーバーが起動しませんでした', 'python3 が使えるか確認してください')
}

/** フォント適用と登場アニメーション（delay 0.2s + duration 0.5s）の完了を待つ */
const settle = async (page) => {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1300)
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })
  await assertServingOurGame()
  console.log(`   配信: ${URL}`)

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: VIEWPORT, locale: 'ja-JP' })
  const shots = []

  const shot = async (page, name) => {
    const file = path.join(outDir, name)
    await page.screenshot({ path: file })
    shots.push(name)
    console.log(`   撮影: ${name}`)
  }

  // 01: 起動直後
  {
    const page = await context.newPage()
    await page.goto(URL, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await shot(page, '01-idle-screen.png')

    // 05: 待機中の下部（熟達レベルとバッジ）
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    await shot(page, '05-gamification-overview.png')
    await page.close()
  }

  // 02: プレイ中
  {
    const page = await context.newPage()
    await page.goto(URL, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    await page.waitForTimeout(1200)
    await shot(page, '02-playing.png')

    // 03: 何度か収穫した状態
    const gameArea = page.getByTestId('game-area')
    const dropArea = await gameArea.locator('.drop-area').boundingBox()
    for (const type of ['apple', 'apple', 'apple']) {
      const targets = gameArea.locator(`[role="button"]:has(img[src*="${type}"])`)
      const count = await targets.count()
      for (let i = 0; i < count; i++) {
        const box = await targets.nth(i).boundingBox()
        if (!box) continue
        if (dropArea && box.x + box.width > dropArea.x) continue
        await targets.nth(i).click({ timeout: 2000 }).catch(() => {})
        break
      }
      await page.waitForTimeout(300)
    }
    await shot(page, '03-playing-streak.png')
    await page.close()
  }

  // 06 / 07: 図鑑
  {
    const page = await context.newPage()
    await page.goto(URL, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await page.getByRole('button', { name: /ずかん|Collection/ }).click()
    await page.waitForTimeout(700)
    await shot(page, '06-collection-fruits.png')

    const dialog = page.getByRole('dialog')
    // タブは role="tab"（CollectionModal.tsx 参照）
    const badgeTab = dialog.getByRole('tab', { name: 'バッジ' })
    if (await badgeTab.isVisible().catch(() => false)) {
      await badgeTab.click()
      await page.waitForTimeout(600)
      await shot(page, '07-collection-badges.png')
    } else {
      console.log('   ⚠️ バッジタブが見つかりませんでした')
    }
    await page.close()
  }

  // 04: 結果画面（時間切れまで待つ。ステージ1は60秒）
  {
    const page = await context.newPage()
    await page.goto(URL, { waitUntil: 'domcontentloaded' })
    await settle(page)
    await page.getByRole('button', { name: /はじめる|Start/ }).click()
    await page.waitForTimeout(800)

    // スコアを入れておく（0点だと結果画面が出ない）
    const gameArea = page.getByTestId('game-area')
    const dropArea = await gameArea.locator('.drop-area').boundingBox()
    for (let round = 0; round < 4; round++) {
      const targets = gameArea.locator('[role="button"]:has(img[src*="apple"])')
      const count = await targets.count()
      for (let i = 0; i < count; i++) {
        const box = await targets.nth(i).boundingBox()
        if (!box) continue
        if (dropArea && box.x + box.width > dropArea.x) continue
        await targets.nth(i).click({ timeout: 2000 }).catch(() => {})
        break
      }
      await page.waitForTimeout(400)
    }

    console.log('   結果画面: 時間切れを待っています（最大70秒）...')
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: 70_000 }).catch(() => {})
    if (await dialog.isVisible().catch(() => false)) {
      await page.waitForTimeout(600)
      await shot(page, '04-result-modal.png')
    } else {
      console.log('   ⚠️ 結果画面を撮影できませんでした（既存ファイルを残します）')
    }
    await page.close()
  }

  await browser.close()
  console.log(`\n✅ ${shots.length}枚を ${path.relative(projectRoot, outDir)} に保存しました`)
}

try {
  await main()
} finally {
  server.kill()
  fs.rmSync(serveRoot, { recursive: true, force: true })
}
