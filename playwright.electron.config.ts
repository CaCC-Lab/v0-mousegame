import { defineConfig } from '@playwright/test'

/**
 * Electron デスクトップ版の E2E 設定。
 *
 * ブラウザ向けの playwright.config.ts とは分けている。
 * Electron のテストは _electron.launch() でアプリ本体を起動するため、
 * chromium / firefox / webkit / Mobile Chrome の各プロジェクトで
 * 繰り返し実行する意味がなく、ブラウザ用の webServer も不要なため。
 *
 * 実行前に `npm run build` で out/ を生成しておくこと
 * （electron/main.js は開発モード以外では out/index.html を読み込む）。
 *
 * 実行: npm run test:e2e:electron
 */
export default defineConfig({
  testDir: './e2e-electron',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron',
    },
  ],
})
