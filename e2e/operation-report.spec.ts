import { test, expect } from '@playwright/test'

/** 先生・保護者むけ「そうさごとの せいこう率」を実ブラウザで開く（docs/game-spec.md §5.1） */
test.use({ viewport: { width: 1280, height: 800 } })

test('せっていから開くと、保存済みの操作ごとのせいこう率が見える', async ({ page }) => {
  // Given: クリック 30/40、ダブルクリック 5/20 を保存済み
  await page.addInitScript(() => {
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    localStorage.setItem('gamificationData', JSON.stringify({
      stageStars: {}, badges: { earnedBadges: [], earnedAt: {} }, version: 1,
      cumulativeStats: {
        click: { totalSuccess: 30, totalFail: 10 }, doubleClick: { totalSuccess: 5, totalFail: 15 },
        rightClick: { totalSuccess: 12, totalFail: 4 }, drop: { totalSuccess: 0, totalFail: 0 },
      },
      lastSessionStats: {
        click: { success: 4, fail: 0 }, doubleClick: { success: 1, fail: 3 },
        rightClick: { success: 2, fail: 1 }, drop: { success: 0, fail: 0 },
      },
    }))
  })
  await page.goto('/')

  // When: せってい → せいこう率 を押す
  await page.getByRole('button', { name: /せってい/ }).click()
  await page.getByTestId('operation-report-open').click()

  // Then: 操作ごとの率が出て、とじると消える
  const dialog = page.getByRole('dialog', { name: /せいこう率/ })
  await expect(dialog.getByTestId('report-row-click').getByTestId('report-total-rate')).toHaveText('75%')
  await expect(dialog.getByTestId('report-row-doubleClick').getByTestId('report-total-rate')).toHaveText('25%')
  await expect(dialog.getByTestId('report-row-drop').getByTestId('report-total-rate')).toHaveText('—')
  await dialog.screenshot({ path: 'test-results/operation-report.png' })
  await dialog.getByTestId('report-close').click()
  await expect(dialog).toHaveCount(0)
})

test('「きろくを けす」で記録が消え、開き直しても消えたまま', async ({ page }) => {
  // Given: クリック 30/40 と星を保存済み（初回だけ入れる）
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    localStorage.setItem('gamificationData', JSON.stringify({
      stageStars: { 1: 3 }, badges: { earnedBadges: [], earnedAt: {} }, version: 1,
      cumulativeStats: {
        click: { totalSuccess: 30, totalFail: 10 }, doubleClick: { totalSuccess: 0, totalFail: 0 },
        rightClick: { totalSuccess: 0, totalFail: 0 }, drop: { totalSuccess: 0, totalFail: 0 },
      },
      lastSessionStats: null,
    }))
  })
  await page.goto('/')
  await page.getByRole('button', { name: /せってい/ }).click()
  await page.getByTestId('operation-report-open').click()
  const dialog = page.getByRole('dialog', { name: /せいこう率/ })
  await expect(dialog.getByTestId('report-row-click').getByTestId('report-total-rate')).toHaveText('75%')

  // When: きろくを けす → やめる Then: 残る
  await dialog.getByTestId('report-reset').click()
  await dialog.getByTestId('report-reset-cancel').click()
  await expect(dialog.getByTestId('report-row-click').getByTestId('report-total-rate')).toHaveText('75%')

  // When: きろくを けす → けす
  await dialog.getByTestId('report-reset').click()
  await dialog.screenshot({ path: 'test-results/operation-report-reset-confirm.png' })
  await dialog.getByTestId('report-reset-confirm').click()

  // Then: 「—」になり、ボタンは押せない。再読みこみしても消えたまま、星は残る
  await expect(dialog.getByTestId('report-row-click').getByTestId('report-total-rate')).toHaveText('—')
  await expect(dialog.getByTestId('report-reset')).toBeDisabled()
  await page.reload()
  await page.getByRole('button', { name: /せってい/ }).click()
  await page.getByTestId('operation-report-open').click()
  await expect(page.getByRole('dialog', { name: /せいこう率/ }).getByTestId('report-row-click').getByTestId('report-total-rate')).toHaveText('—')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gamificationData') ?? '{}'))
  expect(saved.stageStars).toEqual({ 1: 3 })
})
