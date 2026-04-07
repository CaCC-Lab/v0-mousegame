import { chromium } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    recordVideo: { dir: 'docs/videos/', size: { width: 1280, height: 960 } },
    viewport: { width: 1280, height: 960 },
  })

  const page = await context.newPage()
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  console.log('Page loaded')
  await page.waitForTimeout(2000)

  // ゲーム開始
  const startBtn = page.getByRole('button', { name: /はじめる/i })
  await startBtn.click()
  console.log('Game started')
  await page.waitForTimeout(1000)

  // りんごを連続クリック
  for (let i = 0; i < 8; i++) {
    const apple = page.getByRole('button', { name: /apple fruit/i }).first()
    if (await apple.isVisible({ timeout: 500 }).catch(() => false)) {
      await apple.click({ force: true })
      console.log(`Apple clicked (${i + 1})`)
      await page.waitForTimeout(400)
    }
  }

  // ブルーベリーをダブルクリック
  for (let i = 0; i < 3; i++) {
    const blueberry = page.getByRole('button', { name: /blueberry fruit/i }).first()
    if (await blueberry.isVisible({ timeout: 500 }).catch(() => false)) {
      await blueberry.dblclick({ force: true })
      console.log(`Blueberry double-clicked (${i + 1})`)
      await page.waitForTimeout(400)
    }
  }

  // レモンを右クリック
  for (let i = 0; i < 2; i++) {
    const lemon = page.getByRole('button', { name: /lemon fruit/i }).first()
    if (await lemon.isVisible({ timeout: 500 }).catch(() => false)) {
      await lemon.click({ button: 'right', force: true })
      console.log(`Lemon right-clicked (${i + 1})`)
      await page.waitForTimeout(400)
    }
  }

  // スイカをドラッグ&ドロップ
  const watermelon = page.getByRole('button', { name: /watermelon fruit/i }).first()
  const dropArea = page.locator('.drop-area')
  if (await watermelon.isVisible({ timeout: 500 }).catch(() => false)) {
    const wmBox = await watermelon.boundingBox()
    const dropBox = await dropArea.boundingBox()
    if (wmBox && dropBox) {
      await page.mouse.move(wmBox.x + wmBox.width / 2, wmBox.y + wmBox.height / 2)
      await page.mouse.down()
      await page.waitForTimeout(300)
      await page.mouse.move(dropBox.x + dropBox.width / 2, dropBox.y + dropBox.height / 2, { steps: 20 })
      await page.waitForTimeout(200)
      await page.mouse.up()
      console.log('Watermelon dragged')
    }
  }

  // もう少しりんごを取る
  for (let i = 0; i < 5; i++) {
    const apple = page.getByRole('button', { name: /apple fruit/i }).first()
    if (await apple.isVisible({ timeout: 300 }).catch(() => false)) {
      await apple.click({ force: true })
      await page.waitForTimeout(300)
    }
  }

  // タイマー終了を待つ
  console.log('Waiting for game to end...')
  await page.waitForTimeout(45000)
  await page.waitForTimeout(3000)

  // とじる
  const closeBtn = page.getByRole('button', { name: /とじる/i })
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click()
    console.log('Result modal closed')
  }
  await page.waitForTimeout(2000)

  // 図鑑を開く
  const collectionBtn = page.getByTestId('collection-open-button')
  if (await collectionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await collectionBtn.click()
    console.log('Collection opened')
    await page.waitForTimeout(2000)
    const closeCollection = page.getByTestId('collection-modal-close')
    if (await closeCollection.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeCollection.click()
    }
  }

  await page.waitForTimeout(1000)
  await context.close()
  await browser.close()
  console.log('Recording saved to docs/videos/')
}

main().catch(console.error)
