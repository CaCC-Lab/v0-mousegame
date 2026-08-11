/**
 * docs/itch-io-release.md 「公開前の動作確認」向け e2e。
 *
 * このスイートは次の両方を同じテストで検証できる:
 * - 通常デプロイ（ルート配信）: BASE_URL=https://v0-mousegame.vercel.app
 * - itch 向け成果物のサブパス配信: BASE_URL=http://localhost:8765/html/12345/
 *   （docs のローカル確認: dist-itch/build をサブパス配置して http.server で配信）
 *
 * CHECK-(1)〜(4) の本丸は itch ビルド（絶対パス→相対パス書き換え後）のサブパス配信。
 * Vercel ルートだけでは書き換え不具合を見逃すため、公開前は itch 側 BASE_URL でも走らせること。
 *
 * 注意: itch ローカル確認の python http.server は単スレッドのため、
 * 並列実行で操作系がフレークしうる。公開前の itch サブパス検証は --workers=1 を推奨。
 *
 * 実行例:
 *   BASE_URL=https://v0-mousegame.vercel.app npx playwright test e2e/itch-release-verification.spec.ts --project=chromium
 *   BASE_URL=http://localhost:8765/html/12345/ npx playwright test e2e/itch-release-verification.spec.ts --project=chromium --workers=1
 *
 * --- 自動化しない項目・理由 ---
 * - itch.io Draft プレビュー自体（Embed 設定・Click to launch・Fullscreen・決済スキップ等）:
 *   itch.io のホスティング画面は外部サービスのため手動確認（CHECK-(5)〜(12) のプレビューURL確認）。
 *   ここでは iframe 埋め込み相当と、通常デプロイ / itch サブパス配信上のゲーム動作を自動化する。
 * - 実スピーカーでの可聴性: OS/ブラウザのオーディオ出力は自動判定できない。
 *   代わりに AudioContext / OscillatorNode.start の発火をスパイする（TC: 効果音）。
 * - 実ブラウザでの右クリックコンテキストメニュー体感:
 *   ゲーム側は game-area で preventDefault しているが、itch iframe + OS の組み合わせ差は手動確認が必要。
 * - Google Fonts オフライン時の書体フォールバック見た目: 機能非影響のため対象外（docs 既知注意点）。
 */
import { test, expect } from '@playwright/test'
import {
  dragWatermelonToDropArea,
  getAudioPlayCount,
  getScoreValue,
  gotoApp,
  harvestFruit,
  installAudioPlayCounter,
  normalizeAppBaseURL,
  startArcade,
  startViaHajimeru,
} from './helpers/itch-release'

test.describe('itch.io 公開前動作確認', () => {
  // ---------------------------------------------------------------------------
  // (1) CSSが読めている
  // ---------------------------------------------------------------------------
  test('(1) CSSが読めている（カスタムプロパティと game-area 背景）', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)
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
  test('(2) 「はじめる」でゲームが開始する', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)

    await startViaHajimeru(page)
    await expect(page.getByRole('button', { name: /ちゅうだん|Pause/i })).toBeVisible()
    await expect(page.getByTestId('game-area').getByRole('button').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  // ---------------------------------------------------------------------------
  // (4) 開発者ツールに404が出ていない
  // ---------------------------------------------------------------------------
  test('(4) ページが参照する同一オリジンアセットに404がない', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)

    // 初期 HTML の script/link を document URL 基準で解決して確認する。
    // （webpack publicPath="/_next/" への動的再取得は、単スレッド http.server への
    //  並列負荷時にオリジン直下 404 としてフレークしうるため、ここは文書参照アセットに限定する。
    //  絶対パス書き換え漏れなら script[src] 自体がサブパス外を指してここで落ちる。）
    const broken = await page.evaluate(async () => {
      const origin = location.origin
      const appPrefix = location.href.replace(/[#?].*$/, '').replace(/\/?$/, '/')
      const urls = [
        ...[...document.querySelectorAll('script[src]')].map(
          (s) => (s as HTMLScriptElement).src
        ),
        ...[...document.querySelectorAll('link[href]')].map(
          (l) => (l as HTMLLinkElement).href
        ),
      ].filter((u) => {
        if (!u.startsWith(origin)) return false
        if (/favicon/i.test(u)) return false
        // CSS / JS / スプライトなど配信必須アセットに限定
        return /\/_next\/|\.css($|\?)|\.js($|\?)|\/sprites\//i.test(u)
      })

      const unique = [...new Set(urls)]
      const results = await Promise.all(
        unique.map(async (u) => {
          try {
            const res = await fetch(u, { method: 'HEAD' })
            // 一部静的サーバは HEAD 未対応のため GET で再試行
            if (res.status === 405 || res.status === 501) {
              const getRes = await fetch(u, { method: 'GET' })
              return { u, status: getRes.status, underApp: u.startsWith(appPrefix) }
            }
            return { u, status: res.status, underApp: u.startsWith(appPrefix) }
          } catch {
            return { u, status: 0, underApp: u.startsWith(appPrefix) }
          }
        })
      )
      // サブパス外（例: /_next/... 絶対パス）または非200を失敗とする
      return results.filter((r) => r.status !== 200 || !r.underApp)
    })

    expect(broken, `asset failures: ${JSON.stringify(broken, null, 2)}`).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // (5) iframe内で起動する
  // ---------------------------------------------------------------------------
  test('(5) iframe内で起動する（itch.io 埋め込み相当）', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    const appURL = normalizeAppBaseURL(baseURL!)

    // itch.io は別オリジンの iframe で HTML5 ゲームを配信する。
    // 「起動」= iframe 内でアプリがマウントされ開始UIが出ること。
    // プレイ開始操作自体は (2)(6)〜(9) でカバーする（iframe 内クリックはハイドレーション待ちでフレークしやすい）。
    await page.setContent(
      `<!DOCTYPE html>
      <html>
        <body style="margin:0;background:#222">
          <iframe
            id="itch-embed"
            src="${appURL}"
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
    // 800px 高の iframe では下部コントロールがビュー外で hidden 扱いになることがある。
    // 起動確認はタイトル + モード選択が出ていれば十分。
    await expect(frame.getByRole('button', { name: /はじめる|Start/i })).toBeAttached()
  })

  // ---------------------------------------------------------------------------
  // (6)(7)(8)(9) 4種のマウス操作で収穫
  // ---------------------------------------------------------------------------
  test('(6) 🍎 クリックで収穫できる', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)
    await startArcade(page)

    const before = await getScoreValue(page)
    await harvestFruit(page, 'apple', 'click')

    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(before)
  })

  test('(7) 🫐 ダブルクリックで収穫できる', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)
    await startArcade(page)

    const before = await getScoreValue(page)
    await harvestFruit(page, 'blueberry', 'dblclick')

    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(before)
  })

  test('(8) 🍋 右クリックで収穫できる', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)
    await startArcade(page)

    const before = await getScoreValue(page)
    await harvestFruit(page, 'lemon', 'rightClick')

    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(before)
  })

  test('(9) 🍉 ドラッグ＆ドロップで収穫できる', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)
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
  test('(3)(10) フルーツ収穫で効果音パイプラインが発火する', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    // 実際の可聴性は自動では判定できない（コメント: ファイル先頭も参照）。
    // SoundManager は Web Audio の OscillatorNode.start で合成するため、その回数を検証する。
    await installAudioPlayCounter(page)
    await gotoApp(page, baseURL!)
    await startArcade(page)

    // gameStart 音の発火を待つ
    await expect
      .poll(async () => getAudioPlayCount(page), { timeout: 5000 })
      .toBeGreaterThan(0)

    const afterStart = await getAudioPlayCount(page)
    const scoreBefore = await getScoreValue(page)
    await harvestFruit(page, 'apple', 'click')
    // 収穫成功を先に確認してから、効果音パイプラインを見る
    await expect
      .poll(async () => getScoreValue(page), { timeout: 5000 })
      .toBeGreaterThan(scoreBefore)

    await expect
      .poll(async () => getAudioPlayCount(page), { timeout: 5000 })
      .toBeGreaterThan(afterStart)
  })

  // ---------------------------------------------------------------------------
  // (11) 日本語 / English 切替
  // ---------------------------------------------------------------------------
  test('(11) 日本語 / English の切り替えが動く', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    await gotoApp(page, baseURL!)

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
  test('(12) スクロールして下部のきょうのれんしゅうパネルまで見える', async ({ page, baseURL }) => {
    expect(baseURL).toBeTruthy()
    // itch.io Embed 推奨サイズ。スクロールバー有効が前提（docs §5）。
    await page.setViewportSize({ width: 1280, height: 800 })
    await gotoApp(page, baseURL!)

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
