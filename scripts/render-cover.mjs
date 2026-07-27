/**
 * itch.io のカバー画像（630×500）を docs/itch-io/cover.html から生成する。
 *
 * 使い方: node scripts/render-cover.mjs
 * 出力:   docs/itch-io/cover.png
 *
 * カバー画像は itch.io の一覧・埋め込みカードに表示される必須素材で、
 * 推奨サイズが 630×500 と決まっているため、HTMLの.cover要素をそのサイズで切り出す。
 */
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceHtml = path.join(projectRoot, 'docs', 'itch-io', 'cover.html')
const outputPng = path.join(projectRoot, 'docs', 'itch-io', 'cover.png')

const COVER_WIDTH = 630
const COVER_HEIGHT = 500

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: COVER_WIDTH + 100, height: COVER_HEIGHT + 100 },
    deviceScaleFactor: 1,
  })

  await page.goto(pathToFileURL(sourceHtml).href, { waitUntil: 'networkidle' })
  // Webフォント(Fredoka/Nunito)の適用完了を待つ。未適用のまま撮ると別書体で写る
  await page.evaluate(() => document.fonts.ready)

  const cover = page.locator('.cover')
  const box = await cover.boundingBox()
  if (!box) {
    throw new Error('.cover 要素が見つかりません。cover.html の構造を確認してください。')
  }
  if (Math.round(box.width) !== COVER_WIDTH || Math.round(box.height) !== COVER_HEIGHT) {
    throw new Error(
      `カバーのサイズが ${Math.round(box.width)}×${Math.round(box.height)} です。` +
        `itch.io の推奨は ${COVER_WIDTH}×${COVER_HEIGHT} なので cover.html のCSSを確認してください。`
    )
  }

  await cover.screenshot({ path: outputPng, type: 'png' })
  console.log(`✅ カバー画像を生成しました: ${path.relative(projectRoot, outputPng)} (${COVER_WIDTH}×${COVER_HEIGHT})`)
} finally {
  await browser.close()
}
