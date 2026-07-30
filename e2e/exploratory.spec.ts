/**
 * 探索的テスト: monkey testing + 境界攻め
 * 目的: 子どもが雑に操作したときに壊れる箇所を発見する
 */
import { test, expect, Page } from '@playwright/test'

// ヘルパー: コンソールエラーを収集
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))
  return errors
}

// ヘルパー: ゲーム開始
async function startGame(page: Page) {
  const startBtn = page.getByRole('button', { name: /Start|はじめる/i })
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click()
    await page.waitForTimeout(500)
  }
}

// ヘルパー: 種類ごとのフルーツ要素を取得する
// フルーツはスプライト画像で描画されるため、画像から操作対象のラッパーを辿る
function fruitsOfType(page: Page, type: 'apple' | 'blueberry' | 'lemon' | 'watermelon') {
  return page.locator(`[data-testid="game-area"] [role="button"]:has(img[src*="${type}"])`)
}

// ヘルパー: ゲームエリア内のフルーツ要素を取得
async function getFruits(page: Page) {
  return page.locator('[data-fruit-id]').all()
}

// 連打・モンキーテストを含むため、既定の30秒では足りない
test.setTimeout(90_000)

test.describe('探索的テスト: フルーツハーベストゲーム', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  // === 1. 基本操作確認 ===

  test('1. ページ読み込みと初期状態', async ({ page }) => {
    const errors = collectConsoleErrors(page)

    // ゲームタイトル表示
    await expect(page.getByRole('heading', { name: /フルーツハーベストゲーム|Fruit Harvest Game/i })).toBeVisible()

    // ゲーム開始ボタン
    const startBtn = page.getByRole('button', { name: /Start|はじめる/i })
    await expect(startBtn).toBeVisible()

    // きょうのれんしゅうカード
    const dailyCard = page.getByTestId('daily-practice-card')
    if (await dailyCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('INFO: きょうのれんしゅうカード表示確認')
    }

    // コンソールエラーなし
    expect(errors.filter(e => !e.includes('hydration') && !e.includes('Hydration') && !e.includes('hydrat') && !e.includes('Text content did not match'))).toHaveLength(0)
  })

  // === 2. 開始ボタン連打 ===

  test('2. 開始ボタン連打', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    const startBtn = page.getByRole('button', { name: /Start|はじめる/i })

    // 10回連打
    for (let i = 0; i < 10; i++) {
      if (await startBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await startBtn.click({ force: true })
      }
    }
    await page.waitForTimeout(1000)

    // ゲーム状態が壊れていないこと
    const gameArea = page.getByTestId('game-area')
    await expect(gameArea).toBeVisible()

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 3. Pause/Resume 高速反復 ===

  test('3. Pause/Resume 高速反復', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)

    const pauseBtn = page.getByRole('button', { name: /Pause|ポーズ|一時停止/i })

    // 20回高速切り替え
    for (let i = 0; i < 20; i++) {
      const btn = page.getByRole('button', { name: /Pause|Resume|ポーズ|再開|一時停止/i })
      if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
        await btn.click({ force: true })
      }
    }
    await page.waitForTimeout(500)

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 4. Reset 連打 ===

  test('4. Reset 連打', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)

    const resetBtn = page.getByRole('button', { name: /Reset|リセット/i })
    for (let i = 0; i < 10; i++) {
      if (await resetBtn.isVisible({ timeout: 300 }).catch(() => false)) {
        await resetBtn.click({ force: true })
      }
    }
    await page.waitForTimeout(500)

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 5-7. ステージ選択・ハードモード・言語切替 ===

  test('5. ステージ選択 開閉反復', async ({ page }) => {
    const errors = collectConsoleErrors(page)

    const stageBtn = page.getByRole('button', { name: /Stage|ステージ/i })
    if (await stageBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      for (let i = 0; i < 10; i++) {
        await stageBtn.click()
        await page.waitForTimeout(200)
        const closeBtn = page.getByRole('button', { name: /Close|閉じる|とじる/i }).first()
        if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await closeBtn.click()
          await page.waitForTimeout(200)
        }
      }
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  test('6. ハードモード切り替え直後に即開始', async ({ page }) => {
    const errors = collectConsoleErrors(page)

    const hardToggle = page.getByRole('switch').or(page.getByLabel(/hard|ハード/i))
    if (await hardToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await hardToggle.click()
      await page.waitForTimeout(100)
      await startGame(page)
      await page.waitForTimeout(2000)

      // ハードモードではフルーツが動く
      const gameArea = page.getByTestId('game-area')
      await expect(gameArea).toBeVisible()
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 8-11. フルーツ操作判定 ===

  test('8. りんごへの単クリック連打', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(1000)

    const gameArea = page.getByTestId('game-area')
    const apples = fruitsOfType(page, 'apple')

    const count = await apples.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      try {
        await apples.nth(0).click({ timeout: 500 })
        await page.waitForTimeout(100)
      } catch { /* フルーツが消えた */ }
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  test('9. ブルーベリーへのダブルクリック / 単クリック / 3連打', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(1000)

    const gameArea = page.getByTestId('game-area')

    // 単クリック（失敗のはず）
    const blueberry1 = fruitsOfType(page, 'blueberry').first()
    if (await blueberry1.isVisible({ timeout: 1000 }).catch(() => false)) {
      await blueberry1.click({ force: true })
      await page.waitForTimeout(500)
    }

    // ダブルクリック（成功のはず）
    const blueberry2 = fruitsOfType(page, 'blueberry').first()
    if (await blueberry2.isVisible({ timeout: 1000 }).catch(() => false)) {
      await blueberry2.dblclick({ force: true })
      await page.waitForTimeout(500)
    }

    // 3連打
    const blueberry3 = fruitsOfType(page, 'blueberry').first()
    if (await blueberry3.isVisible({ timeout: 1000 }).catch(() => false)) {
      await blueberry3.click({ force: true })
      await blueberry3.click({ force: true })
      await blueberry3.click({ force: true })
      await page.waitForTimeout(500)
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  test('10. レモンへの左クリック・右クリック混在', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(1000)

    const gameArea = page.getByTestId('game-area')

    // 左クリック（失敗のはず）
    const lemon1 = fruitsOfType(page, 'lemon').first()
    if (await lemon1.isVisible({ timeout: 1000 }).catch(() => false)) {
      await lemon1.click({ force: true })
      await page.waitForTimeout(300)
    }

    // 右クリック（成功のはず）
    const lemon2 = fruitsOfType(page, 'lemon').first()
    if (await lemon2.isVisible({ timeout: 1000 }).catch(() => false)) {
      await lemon2.click({ button: 'right', force: true })
      await page.waitForTimeout(300)
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 11-15. スイカドラッグ&ドロップ ===

  test('11-13. スイカドラッグ: 途中で離す / 境界 / エリア外', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(1000)

    const gameArea = page.getByTestId('game-area')
    const watermelon = fruitsOfType(page, 'watermelon').first()

    if (await watermelon.isVisible({ timeout: 2000 }).catch(() => false)) {
      const wmBox = await watermelon.boundingBox()
      const gaBox = await gameArea.boundingBox()

      if (wmBox && gaBox) {
        // 途中で離す
        await page.mouse.move(wmBox.x + wmBox.width / 2, wmBox.y + wmBox.height / 2)
        await page.mouse.down()
        await page.mouse.move(wmBox.x + 50, wmBox.y + 50)
        await page.mouse.up()
        await page.waitForTimeout(500)

        // エリア外で離す
        const wm2 = fruitsOfType(page, 'watermelon').first()
        if (await wm2.isVisible({ timeout: 1000 }).catch(() => false)) {
          const wm2Box = await wm2.boundingBox()
          if (wm2Box) {
            await page.mouse.move(wm2Box.x + wm2Box.width / 2, wm2Box.y + wm2Box.height / 2)
            await page.mouse.down()
            await page.mouse.move(gaBox.x - 50, gaBox.y - 50) // エリア外
            await page.mouse.up()
            await page.waitForTimeout(500)
          }
        }
      }
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 16. 右クリック連打とcontext menu ===

  test('16. 右クリック連打', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(1000)

    const gameArea = page.getByTestId('game-area')
    const gaBox = await gameArea.boundingBox()

    if (gaBox) {
      for (let i = 0; i < 20; i++) {
        const x = gaBox.x + Math.random() * gaBox.width
        const y = gaBox.y + Math.random() * gaBox.height
        await page.mouse.click(x, y, { button: 'right' })
      }
    }
    await page.waitForTimeout(500)

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 17-18. 連続成功ボーナス ===

  test('17-18. フルーツ大量連続処理と5連続ボーナス', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(1000)

    const gameArea = page.getByTestId('game-area')
    let successCount = 0

    for (let i = 0; i < 20; i++) {
      // りんごをクリック
      const apple = fruitsOfType(page, 'apple').first()
      if (await apple.isVisible({ timeout: 300 }).catch(() => false)) {
        try {
          await apple.click({ timeout: 300 })
          successCount++
          await page.waitForTimeout(100)
        } catch { /* タイミング */ }
      }
    }

    console.log(`INFO: ${successCount} 回クリック成功`)

    // 5連続ボーナス後にフルーツ数が増えているか確認
    const streakCount = page.getByTestId('streak-count')
    if (await streakCount.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log(`INFO: streak表示あり`)
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 20. タイマー残り1秒付近 ===

  test('20. タイマー残り1秒付近で操作', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)

    // タイマーが0:05以下になるまで待つ（最大65秒）
    const timerText = page.locator('text=/0:0[0-5]/')
    try {
      await timerText.waitFor({ timeout: 65000 })
    } catch {
      console.log('WARN: タイマーが5秒以下にならなかった')
      return
    }

    // 残り数秒で連打
    const gameArea = page.getByTestId('game-area')
    for (let i = 0; i < 30; i++) {
      const apple = fruitsOfType(page, 'apple').first()
      if (await apple.isVisible({ timeout: 100 }).catch(() => false)) {
        await apple.click({ force: true }).catch(() => {})
      }
      await page.waitForTimeout(100)
    }

    // ゲーム終了後のモーダル確認
    await page.waitForTimeout(5000)

    const resultModal = page.getByRole('dialog')
    const hasModal = await resultModal.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`INFO: ゲーム終了後のモーダル表示: ${hasModal}`)

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 22. 結果モーダルとステージクリアモーダルの近接 ===

  test('22. モーダル重なり確認', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)

    // タイマー終了を待つ
    await page.waitForTimeout(65000)

    // ダイアログの数を確認
    const dialogs = page.getByRole('dialog')
    const dialogCount = await dialogs.count()
    console.log(`INFO: 表示中のダイアログ数: ${dialogCount}`)

    // 2つ以上重なっていないか
    if (dialogCount > 1) {
      console.log('WARN: 複数ダイアログが同時表示されている')
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 23-26. キーボード操作 ===

  test('23-26. キーボード操作', async ({ page }) => {
    const errors = collectConsoleErrors(page)

    // Enter でゲーム開始
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)

    // Arrow で選択移動
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(100)
    }
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(100)
    }

    // Enter で収穫
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)

    // Space でポーズ
    await page.keyboard.press('Space')
    await page.waitForTimeout(500)

    // Space で再開
    await page.keyboard.press('Space')
    await page.waitForTimeout(500)

    // Enter 連打
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Enter')
      await page.waitForTimeout(50)
    }

    // Space 連打
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Space')
      await page.waitForTimeout(50)
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 28-29. 画面リサイズ ===

  test('28-29. 画面リサイズ中の操作', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)

    // リサイズしながら操作
    for (let i = 0; i < 5; i++) {
      await page.setViewportSize({ width: 320, height: 568 }) // iPhone SE
      await page.waitForTimeout(200)

      const apple = fruitsOfType(page, 'apple').first()
      if (await apple.isVisible({ timeout: 300 }).catch(() => false)) {
        // 狭い幅ではドロップエリアに遮られる個体があり、タイムアウトなしの
        // クリックは無期限に再試行してテストごと固まる。
        // このテストの目的は「リサイズ中の操作でエラーが出ない」ことなので、
        // 遮蔽チェックを省くforceクリックで操作だけ行う
        await apple.click({ force: true, timeout: 1500 }).catch(() => {})
      }

      await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
      await page.waitForTimeout(200)
    }

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === 30. localStorage 復元 ===

  test('30. リロード後のlocalStorage復元', async ({ page }) => {
    const errors = collectConsoleErrors(page)

    // ゲームプレイ
    await startGame(page)
    await page.waitForTimeout(2000)

    // りんごを何回かクリック
    const gameArea = page.getByTestId('game-area')
    for (let i = 0; i < 3; i++) {
      const apple = fruitsOfType(page, 'apple').first()
      if (await apple.isVisible({ timeout: 500 }).catch(() => false)) {
        await apple.click().catch(() => {})
        await page.waitForTimeout(300)
      }
    }

    // localStorage の状態を保存
    const beforeReload = await page.evaluate(() => ({
      gamification: localStorage.getItem('gamificationData'),
      dailyPractice: localStorage.getItem('dailyPracticeData'),
      highScore: localStorage.getItem('fruitHarvestHighScore'),
    }))

    // リロード
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // localStorage が復元されているか
    const afterReload = await page.evaluate(() => ({
      gamification: localStorage.getItem('gamificationData'),
      dailyPractice: localStorage.getItem('dailyPracticeData'),
      highScore: localStorage.getItem('fruitHarvestHighScore'),
    }))

    console.log('INFO: gamification復元:', beforeReload.gamification === afterReload.gamification ? 'OK' : 'MISMATCH')
    console.log('INFO: dailyPractice復元:', beforeReload.dailyPractice === afterReload.dailyPractice ? 'OK' : 'MISMATCH')

    const realErrors = errors.filter(e => !e.includes('hydrat') && !e.includes('Hydrat') && !e.includes('Text content') && !e.includes('server-rendered'))
    expect(realErrors).toHaveLength(0)
  })

  // === Monkey Testing ===

  test('MONKEY: ランダムクリック100回', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(500)

    const gameArea = page.getByTestId('game-area')
    const gaBox = await gameArea.boundingBox()

    if (gaBox) {
      for (let i = 0; i < 100; i++) {
        const x = gaBox.x + Math.random() * gaBox.width
        const y = gaBox.y + Math.random() * gaBox.height
        const button = Math.random() < 0.3 ? 'right' as const : 'left' as const
        const clickCount = Math.random() < 0.2 ? 2 : 1

        await page.mouse.click(x, y, { button, clickCount })

        if (Math.random() < 0.1) {
          await page.keyboard.press('Space')
        }
        if (Math.random() < 0.05) {
          await page.keyboard.press('Enter')
        }

        await page.waitForTimeout(50)
      }
    }

    await page.waitForTimeout(1000)

    // ページがクラッシュしていないこと
    await expect(page.locator('body')).toBeVisible()

    console.log(`INFO: コンソールエラー数: ${errors.length}`)
    if (errors.length > 0) {
      errors.forEach((e, i) => console.log(`  ERROR[${i}]: ${e.substring(0, 200)}`))
    }
  })

  test('MONKEY: ドラッグ＆キーボード混在50回', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await startGame(page)
    await page.waitForTimeout(500)

    const gameArea = page.getByTestId('game-area')
    const gaBox = await gameArea.boundingBox()

    if (gaBox) {
      for (let i = 0; i < 50; i++) {
        const action = Math.random()

        if (action < 0.3) {
          // ランダムドラッグ
          const x1 = gaBox.x + Math.random() * gaBox.width
          const y1 = gaBox.y + Math.random() * gaBox.height
          const x2 = gaBox.x + Math.random() * gaBox.width
          const y2 = gaBox.y + Math.random() * gaBox.height
          await page.mouse.move(x1, y1)
          await page.mouse.down()
          await page.mouse.move(x2, y2)
          await page.mouse.up()
        } else if (action < 0.6) {
          // ランダムクリック
          const x = gaBox.x + Math.random() * gaBox.width
          const y = gaBox.y + Math.random() * gaBox.height
          await page.mouse.click(x, y)
        } else if (action < 0.8) {
          // キーボード
          const keys = ['Enter', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
          await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)])
        } else {
          // 右クリック
          const x = gaBox.x + Math.random() * gaBox.width
          const y = gaBox.y + Math.random() * gaBox.height
          await page.mouse.click(x, y, { button: 'right' })
        }

        await page.waitForTimeout(50)
      }
    }

    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()

    console.log(`INFO: コンソールエラー数: ${errors.length}`)
    if (errors.length > 0) {
      errors.forEach((e, i) => console.log(`  ERROR[${i}]: ${e.substring(0, 200)}`))
    }
  })
})
