import { Page } from '@playwright/test'

export async function startGame(page: Page) {
  await page.getByRole('button', { name: /はじめる|Start/ }).click()
}

export async function pauseGame(page: Page) {
  await page.getByRole('button', { name: /ちゅうだん|Pause/ }).click()
}

export async function resumeGame(page: Page) {
  await page.getByRole('button', { name: /さいかい|Resume/ }).click()
}

export async function resetGame(page: Page) {
  await page.getByRole('button', { name: /リセット|Reset/ }).click()
}


export async function toggleLanguage(page: Page) {
  const languageButton = page.getByRole('button', { name: /JA|EN/ })
  await languageButton.click()
}

export async function openHelpDialog(page: Page) {
  await page.getByRole('button', { name: /あそびかた|How to Play/ }).click()
}

export async function closeDialog(page: Page) {
  await page.keyboard.press('Escape')
}

export async function getScore(page: Page): Promise<number> {
  const scoreText = await page.getByText(/得点:|Score:/).locator('..').textContent()
  const match = scoreText?.match(/\d+/)
  return match ? parseInt(match[0]) : 0
}

export async function getHighScore(page: Page): Promise<number> {
  const highScoreText = await page.getByText(/最高得点:|High Score:/).locator('..').textContent()
  const match = highScoreText?.match(/\d+/)
  return match ? parseInt(match[0]) : 0
}

export async function clickFruit(page: Page, index: number = 0) {
  const gameArea = page.locator('.bg-green-300')
  const fruit = gameArea.locator('button').nth(index)
  if (await fruit.isVisible()) {
    await fruit.click()
  }
}

export async function waitForGameToLoad(page: Page) {
  await page.waitForSelector('[role="application"]')
  await page.waitForLoadState('networkidle')
}