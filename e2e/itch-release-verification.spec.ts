/**
 * docs/itch-io-release.md 「公開前の動作確認」向け e2e。
 *
 * 手動チェック12項目のうち、Playwright で再現できるものを自動化する。
 * 実行例:
 *   BASE_URL=https://v0-mousegame.vercel.app npx playwright test e2e/itch-release-verification.spec.ts --project=chromium
 *
 * --- 自動化しない項目・理由 ---
 * - 実スピーカーでの可聴性: OS/ブラウザのオーディオ出力は自動判定できない。
 *   代わりに AudioContext / OscillatorNode.start の発火をスパイする（TC: 効果音）。
 * - itch.io 本体の Embed UI（Click to launch / Fullscreen / 決済スキップ等）:
 *   itch.io のホスティング画面そのものは外部サービスのため、ここでは iframe 埋め込み相当のみ検証する。
 * - 実ブラウザでの右クリックコンテキストメニュー体感:
 *   ゲーム側は game-area で preventDefault しているが、itch iframe + OS の組み合わせ差は手動確認が必要。
 * - Google Fonts オフライン時の書体フォールバック見た目: 機能非影響のため対象外（docs 既知注意点）。
 */
import { test, expect } from '@playwright/test'
import {
  collectSameOrigin404s,
  dragWatermelonToDropArea,
  getAudioPlayCount,
  getScoreValue,
  harvestFruit,
  installAudioPlayCounter,
  startArcade,
  startViaHajimeru,
} from './helpers/itch-release'

test.describe('itch.io 公開前動作確認', () => {
  // ---------------------------------------------------------------------------
  // (1) CSSが読めている
  // ---------------------------------------------------------------------------
  test('(1) CSSが読めている（カスタムプロパティと game-area 背景）', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByTestId('game-area')).toBeVisible()

    const cssOk = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      const cream = root.getPropertyValue('--color-cream-dark').trim()
      const secondary = root.getPropertyValue('--color-secondary').trim()
      const gameArea = document.querySelector('[data-testid="game-area"]') as HTMLElement | null
      if (!gameArea) return { ok: false, reason: 'game-area missing' }

      const bg = getComputedStyle(gameArea).backgroundImage || getComputedStyle(gameArea).background
      // GamePlayArea は linear-gradient(#A8DADC → #4ECDC4) を inline でも持つが、
      // globals.css の変数が空なら Tailwind/独自CSSの読み込み失敗を疑う
      return {
        ok: cream !== '' && secondary !== '' && /linear-gradient|rgb\(/i.test(bg),
        cream,
        secondary,
        bg: bg.slice(0, 120),
      }
    })

    expect(cssOk.ok, `CSS未適用の可能性: ${JSON.stringify(cssOk)}`).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // (2) 「はじめる」でゲーム開始
  // ---------------------------------------------------------------------------
  test('(2) 「はじめる」でゲームが開始する', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    await startViaHajimeru(page)
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/i })).toBeVisible()
    await expect(page.getByTestId('game-area').getByRole('button').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  // ---------------------------------------------------------------------------
  // (4) 開発者ツールに404が出ていない
  // ---------------------------------------------------------------------------
  test('(4) 同一オリジンに404がない', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const notFound = collectSameOrigin404s(page, baseURL!)

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await startArcade(page)
    // スプライト等の遅延取得を待つ（Google Fonts 待ちの networkidle は使わない）
    await page.waitForTimeout(2000)

    expect(notFound, `404: ${notFound.join('\n')}`).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // (5) iframe内で起動する
  // ---------------------------------------------------------------------------
  test('(5) iframe内で起動する（itch.io 埋め込み相当）', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()

    // itch.io は別オリジンの iframe で HTML5 ゲームを配信する。
    // 「起動」= iframe 内でアプリがマウントされ開始UIが出ること。
    // プレイ開始操作自体は (2)(6)〜(9) でカバーする（iframe 内クリックはハイドレーション待ちでフレークしやすい）。
    await page.setContent(
      `<!DOCTYPE html>
      <html>
        <body style="margin:0;background:#222">
          <iframe
            id="itch-embed"
            src="${baseURL}"
            width="1280"
            height="800"
            allow="autoplay; gamepad; fullscreen"
            style="border:0;display:block"
          ></iframe>
        </body>
      </html>`,
      { waitUntil: 'domcontentloaded' }
    )

    const frame = page.frameLocator('#itch-embed')
    await expect(
      frame.getByRole('heading', { name: /フルーツハーベストゲーム|Fruit Harvest Game/i })
    ).toBeVisible({ timeout: 30_000 })
    await expect(frame.getByTestId('game-area')).toBeVisible()
    await expect(frame.getByTestId('mode-select-arcade')).toBeVisible()
    await expect(frame.getByRole('button', { name: /はじめる|Start/i })).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // (6)(7)(8)(9) 4種のマウス操作で収穫
  // ---------------------------------------------------------------------------
  test('(6) 🍎 クリックで収穫できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await startArcade(page)

    const before = await getScoreValue(page)
    await harvestFruit(page, 'apple', 'click')

    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(before)
  })

  test('(7) 🫐 ダブルクリックで収穫できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await startArcade(page)

    const before = await getScoreValue(page)
    await harvestFruit(page, 'blueberry', 'dblclick')

    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(before)
  })

  test('(8) 🍋 右クリックで収穫できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await startArcade(page)

    const before = await getScoreValue(page)
    await harvestFruit(page, 'lemon', 'rightClick')

    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(before)
  })

  test('(9) 🍉 ドラッグ＆ドロップで収穫できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await startArcade(page)

    const before = await getScoreValue(page)
    await dragWatermelonToDropArea(page)

    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(before)
  })

  // ---------------------------------------------------------------------------
  // (3)(10) 効果音が鳴る（AudioContext 発火のスパイ）
  // ---------------------------------------------------------------------------
  test('(3)(10) フルーツ収穫で効果音パイプラインが発火する', async ({ page }) => {
    // 実際の可聴性は自動では判定できない（コメント: ファイル先頭も参照）。
    // SoundManager は Web Audio の OscillatorNode.start で合成するため、その回数を検証する。
    await installAudioPlayCounter(page)
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await startArcade(page)

    // gameStart 音の発火を待つ
    await expect
      .poll(async () => getAudioPlayCount(page), { timeout: 5000 })
      .toBeGreaterThan(0)

    const afterStart = await getAudioPlayCount(page)
    await harvestFruit(page, 'apple', 'click')

    await expect
      .poll(async () => getAudioPlayCount(page), { timeout: 5000 })
      .toBeGreaterThan(afterStart)
  })

  // ---------------------------------------------------------------------------
  // (11) 日本語 / English 切替
  // ---------------------------------------------------------------------------
  test('(11) 日本語 / English の切り替えが動く', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const langButton = page.getByRole('button', { name: /Language:/i })
    await expect(langButton).toBeVisible()
    await expect(langButton).toContainText('日本語')

    await langButton.click()
    await expect(langButton).toContainText('English')
    await expect(
      page.getByRole('heading', { name: /Fruit Harvest Game/i })
    ).toBeVisible()

    await langButton.click()
    await expect(langButton).toContainText('日本語')
    await expect(
      page.getByRole('heading', { name: /フルーツハーベストゲーム/i })
    ).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // (12) スクロールして下部パネルまで見える
  // ---------------------------------------------------------------------------
  test('(12) スクロールして下部のきょうのれんしゅうパネルまで見える', async ({ page }) => {
    // itch.io Embed 推奨サイズ。スクロールバー有効が前提（docs §5）。
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const dailyCard = page.getByTestId('daily-practice-card')
    await dailyCard.scrollIntoViewIfNeeded()
    await expect(dailyCard).toBeVisible()
    await expect(dailyCard).toBeInViewport()

    // idle 時のみ出る図鑑ボタンも下部パネル群の代表として確認
    const collectionBtn = page.getByTestId('collection-open-button')
    await collectionBtn.scrollIntoViewIfNeeded()
    await expect(collectionBtn).toBeVisible()
    await expect(collectionBtn).toBeInViewport()
  })
})
