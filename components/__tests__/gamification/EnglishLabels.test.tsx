import React from 'react'
import { render, screen } from '@testing-library/react'
import { translations } from '@/lib/i18n/translations'
import { ResultModal } from '@/components/game/ResultModal'
import { MasteryDisplay } from '@/components/game/MasteryDisplay'
import { DailyPracticeCard } from '@/components/game/DailyPracticeCard'
import { BadgeDisplay } from '@/components/game/BadgeDisplay'
import { StreakIndicator } from '@/components/game/StreakIndicator'
import { CollectionModal } from '@/components/game/CollectionModal'
import { createDefaultCumulativeStats } from '@/lib/gamificationManager'

/**
 * 英語表示にしたとき、ゲーミフィケーション系のUIに日本語が残らないことの検証。
 *
 * バッジ名・熟達レベル・操作名は types/gamification.ts に日本語の定数として入っている。
 * 表示側が定数をそのまま出すと、英語ロケールの画面に日本語が混ざる
 * （CrazyGames は locale に応じた言語 + 英語フォールバックを求めている）。
 */
const t = translations.en

/** 描画結果に日本語（ひらがな・カタカナ・漢字）が含まれないこと */
function expectNoJapanese(container: HTMLElement) {
  expect(container.textContent?.match(/[ぁ-んァ-ヶ一-龠]+/g) ?? []).toEqual([])
}

describe('英語表示のゲーミフィケーションUI', () => {
  const cumulativeStats = createDefaultCumulativeStats()
  const masteryLevels = { click: 1, doubleClick: 1, rightClick: 1, drop: 1 } as const
  const masteryProgress = {
    click: { current: 0, nextThreshold: 10, remaining: 10 },
    doubleClick: { current: 0, nextThreshold: 10, remaining: 10 },
    rightClick: { current: 0, nextThreshold: 10, remaining: 10 },
    drop: { current: 0, nextThreshold: 10, remaining: 10 },
  }

  it('MasteryDisplay に日本語が出ない', () => {
    const { container } = render(
      <MasteryDisplay t={t} masteryLevels={masteryLevels} masteryProgress={masteryProgress} cumulativeStats={cumulativeStats} />
    )
    expectNoJapanese(container)
    expect(screen.getByText('Click')).toBeInTheDocument()
  })

  it('DailyPracticeCard に日本語が出ない', () => {
    const { container } = render(
      <DailyPracticeCard
        t={t}
        todayGoals={{ click: false, doubleClick: false, rightClick: false, drop: false }}
        isGoalComplete={false}
        practiceStreak={3}
      />
    )
    expectNoJapanese(container)
  })

  it('BadgeDisplay に日本語が出ない', () => {
    const { container } = render(
      <BadgeDisplay t={t} earnedBadges={['clickMaster']} cumulativeStats={cumulativeStats} />
    )
    expectNoJapanese(container)
    expect(screen.getByText('Click Master')).toBeInTheDocument()
  })

  it('StreakIndicator に日本語が出ない（10連続のボーナス表示を含む）', () => {
    const { container } = render(
      <StreakIndicator t={t} streak={10} lastBonus={{ threshold: 10, type: 'amazing', label: 'すごい！🌟' }} />
    )
    expectNoJapanese(container)
  })

  it('ResultModal に日本語が出ない', () => {
    const session = {
      click: { success: 5, miss: 1 },
      doubleClick: { success: 3, miss: 0 },
      rightClick: { success: 2, miss: 0 },
      drop: { success: 1, miss: 0 },
    }
    const { container } = render(
      <ResultModal
        t={t}
        open
        sessionStats={session}
        starRating={3}
        lastSessionStats={{ ...session, click: { success: 2, miss: 0 } }}
        onClose={() => {}}
      />
    )
    expectNoJapanese(container)
  })

  it('CollectionModal に日本語が出ない', () => {
    const { container } = render(
      <CollectionModal
        t={t}
        open
        onClose={() => {}}
        cumulativeStats={cumulativeStats}
        earnedBadges={['clickMaster']}
        masteryLevels={masteryLevels}
        masteryProgress={masteryProgress}
        stamps={[]}
        practiceStreak={2}
      />
    )
    expectNoJapanese(container)
  })
})
