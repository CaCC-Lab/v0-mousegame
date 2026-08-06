import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArcadeResultModal } from '@/components/game/ArcadeResultModal'
import { translations } from '@/lib/i18n/translations'
import type { ArcadeResult } from '@/types/arcade'
import { getRankProgress } from '@/lib/arcadeManager'

const t = translations.ja

const baseResult: ArcadeResult = {
  score: 1800,
  best: 1800,
  isNewBest: true,
  maxCombo: 12,
  feverCount: 2,
  rank: 'silver',
}

function setup(overrides: Partial<React.ComponentProps<typeof ArcadeResultModal>> = {}) {
  const onRetry = jest.fn()
  const onClose = jest.fn()
  const result = overrides.result === undefined ? baseResult : overrides.result

  render(
    <ArcadeResultModal
      open
      result={result}
      rankProgress={getRankProgress(result?.best ?? 0)}
      language="ja"
      onRetry={onRetry}
      onClose={onClose}
      t={t}
      {...overrides}
    />
  )
  return { onRetry, onClose }
}

describe('ArcadeResultModal', () => {
  it('閉じているときは描画しない', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('結果がなければ描画しない', () => {
    setup({ result: null })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('スコア・ベスト・最大コンボ・フィーバー回数を表示する', () => {
    setup()
    expect(screen.getByTestId('arcade-result-score')).toHaveTextContent('1,800')
    expect(screen.getByTestId('arcade-result-best')).toHaveTextContent('1,800')
    expect(screen.getByTestId('arcade-result-max-combo')).toHaveTextContent('12')
    expect(screen.getByTestId('arcade-result-fever-count')).toHaveTextContent('2')
  })

  it('自己ベスト更新時は祝福を出す', () => {
    setup()
    expect(screen.getByTestId('arcade-new-best')).toHaveTextContent(t.newBest)
  })

  it('自己ベストでなければ祝福を出さない', () => {
    setup({ result: { ...baseResult, score: 500, best: 1800, isNewBest: false } })
    expect(screen.queryByTestId('arcade-new-best')).not.toBeInTheDocument()
  })

  it('段位を表示する', () => {
    setup()
    expect(screen.getByTestId('arcade-result-rank')).toHaveTextContent('シルバー')
  })

  it('次の段位までの残り点を表示する', () => {
    setup()
    // silver(1000) → gold(2500)。ベスト1800なので残り700点
    expect(screen.getByTestId('arcade-rank-progress')).toHaveTextContent('700')
  })

  it('最高段位では残り点の代わりに到達表示を出す', () => {
    const result: ArcadeResult = { ...baseResult, score: 9000, best: 9000, rank: 'diamond' }
    setup({ result, rankProgress: getRankProgress(9000) })
    expect(screen.getByTestId('arcade-rank-progress')).toHaveTextContent(t.maxRankReached)
  })

  it('もういちどボタンで再挑戦できる', async () => {
    const user = userEvent.setup()
    const { onRetry } = setup()

    await user.click(screen.getByTestId('arcade-retry'))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('メニューへ戻れる', async () => {
    const user = userEvent.setup()
    const { onClose } = setup()

    await user.click(screen.getByTestId('arcade-back-to-menu'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('リワード広告が使えないときはスペシャルフルーツのボタンを出さない', () => {
    setup({ rewardedAvailable: false })
    expect(screen.queryByTestId('arcade-rewarded-boost')).not.toBeInTheDocument()
  })

  it('リワード広告が使えるときだけスペシャルフルーツのボタンを出す', async () => {
    const user = userEvent.setup()
    const onRewardedBoost = jest.fn()
    setup({ rewardedAvailable: true, onRewardedBoost })

    await user.click(screen.getByTestId('arcade-rewarded-boost'))

    expect(onRewardedBoost).toHaveBeenCalledTimes(1)
  })

  it('英語表示では英語の段位名になる', () => {
    setup({ language: 'en', t: translations.en })
    expect(screen.getByTestId('arcade-result-rank')).toHaveTextContent('Silver')
  })
})
