import { defineConfig, devices } from '@playwright/test'

/**
 * 性能計測用の E2E 設定。
 *
 * 通常の E2E（playwright.config.ts）とは分けている。
 * 性能テストを他のテストと並列に走らせると、開発サーバーへの同時アクセスで
 * 初回描画が遅れ、実装が悪くなくても閾値を割って落ちるため
 * （実際に12並列では毎回 first-paint > 1000ms で失敗していた）。
 *
 * 実行: npm run test:e2e:perf
 */
const PORT = process.env.PORT || '3000'
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e-perf',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ja-JP',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
