import { defineConfig, devices } from '@playwright/test'

// 3000番が他のアプリで塞がっている場合に備えて、ポートを差し替えられるようにする。
// 例: PORT=3100 npx playwright test
const PORT = process.env.PORT || '3000'
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // アプリは navigator.language から表示言語を決める（hooks/useLanguage.ts）。
    // 指定しないと en-US と判定されて英語表示になり、
    // 日本語の文言を期待しているテストがすべて要素を見つけられなくなる
    locale: 'ja-JP',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile Chrome プロジェクトは持たない。
    // このゲームはマウス操作の練習ツールで、タッチのみの端末は対象外
    // （マウスなし端末には TouchDeviceNotice が案内を表示する）
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
