import { test, expect, Page, ConsoleMessage } from '@playwright/test'

/**
 * 審査でコンソールを開かれても、アプリ由来の出力が残っていないことの確認（Issue #42）。
 *
 * 開発サーバー由来のもの（Fast Refresh、React DevTools の案内、
 * webpack の hot-update）は開発時にしか出ないため除外する。
 */
const DEV_SERVER_NOISE = [
  /Fast Refresh/i,
  /Download the React DevTools/i,
  /hot-update/i,
  /webpack/i,
  /\[HMR\]/i,
  // ブラウザが出す読み込み診断。アプリのコードが書いた出力ではないので対象外にする。
  // 既知: Firefox は同梱の絵文字フォント（app/fonts）を sanitizer で弾き、
  // "downloadable font: rejected by sanitizer" を出す。
  // フルーツの絵はスプライト画像なので表示には影響しないが、別途の課題として残っている。
  /downloadable font/i,
]

function isAppMessage(message: ConsoleMessage): boolean {
  const text = message.text()
  return !DEV_SERVER_NOISE.some(pattern => pattern.test(text))
}

async function collectConsole(page: Page): Promise<string[]> {
  const messages: string[] = []
  page.on('console', (message) => {
    if (['error', 'warning', 'log', 'info'].includes(message.type()) && isAppMessage(message)) {
      messages.push(`${message.type()}: ${message.text()}`)
    }
  })
  return messages
}

test.describe('コンソール出力', () => {
  test('起動から1プレイまでアプリ由来の出力を出さない', async ({ page }) => {
    const messages = await collectConsole(page)

    await page.goto('/')
    await page.getByTestId('mode-select-arcade').click()

    // 収穫・言語切替・あそびかたの開閉まで一通り触る
    const apple = page.locator('[data-fruit-id][aria-label*="りんご"]').first()
    if (await apple.count() > 0) {
      await apple.click({ force: true }).catch(() => undefined)
    }
    await page.getByRole('button', { name: /あそびかた|How to Play/ }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: /日本語|English/ }).click()

    await page.waitForTimeout(500)

    expect(messages).toEqual([])
  })
})
