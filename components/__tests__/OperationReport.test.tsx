import React from 'react'
import { render, screen, act, within } from '@testing-library/react'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { OperationReportModal } from '../game/OperationReportModal'
import { translations } from '@/lib/i18n/translations'
import { GAMIFICATION_STORAGE_KEY, GAMIFICATION_SAVE_VERSION } from '@/types/gamification'

/**
 * 先生・保護者むけ「そうさごとの せいこう率」画面。
 *
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---|---|---|---|---|
 * | ORM-N-01 | 累計と前回あり | Equivalence – normal | 4操作の回数と率、前回の率 | - |
 * | ORM-N-02 | 閉じるを押す | Equivalence – normal | onClose | - |
 * | ORM-N-03 | せっていから開く | Integration | 保存済みの累計が見える | - |
 * | ORM-A-01 | open=false | Boundary | 何も出さない | - |
 * | ORM-A-02 | 記録なし | Boundary – 0 | 「—」と「まだ あそんでいない」 | ゼロ除算しない |
 * | ORM-A-03 | 保存データが壊れている | Invalid format | 0 回で開ける | - |
 * | ORM-A-04 | 英語 | i18n | 英語の見出し | - |
 */
const zero = { click: { totalSuccess: 0, totalFail: 0 }, doubleClick: { totalSuccess: 0, totalFail: 0 }, rightClick: { totalSuccess: 0, totalFail: 0 }, drop: { totalSuccess: 0, totalFail: 0 } }
const cumulative = { ...zero, click: { totalSuccess: 30, totalFail: 10 }, doubleClick: { totalSuccess: 5, totalFail: 15 } }
const last = { click: { success: 4, fail: 0 }, doubleClick: { success: 1, fail: 3 }, rightClick: { success: 0, fail: 0 }, drop: { success: 0, fail: 0 } }

describe('OperationReportModal', () => {
  it('ORM-N-01: 操作ごとの回数・せいこう率・前回の率を出す', () => {
    // Given: 累計と前回 When: 開く Then: クリック 75%（30/40）、ダブルクリック 25%、前回 100%
    render(<OperationReportModal open onClose={() => {}} cumulativeStats={cumulative} lastSessionStats={last} t={translations.ja} />)
    const click = screen.getByTestId('report-row-click')
    expect(within(click).getByTestId('report-total-rate')).toHaveTextContent('75%')
    expect(click).toHaveTextContent('30')
    expect(click).toHaveTextContent('10')
    expect(within(click).getByTestId('report-last-rate')).toHaveTextContent('100%')
    expect(within(screen.getByTestId('report-row-doubleClick')).getByTestId('report-total-rate')).toHaveTextContent('25%')
  })

  it('ORM-N-02: 「とじる」で onClose', () => {
    // Given: 開いている When: とじる Then: onClose 1回
    const onClose = jest.fn()
    render(<OperationReportModal open onClose={onClose} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} />)
    act(() => screen.getByTestId('report-close').click())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ORM-A-01: open=false なら何も出さない', () => {
    // Given: 閉じている When: 描画 Then: dialog なし
    render(<OperationReportModal open={false} onClose={() => {}} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ORM-A-02: 記録が無ければ「—」と案内を出す', () => {
    // Given: すべて0回・前回なし When: 開く Then: 率は「—」、まだ あそんでいない
    render(<OperationReportModal open onClose={() => {}} cumulativeStats={zero} lastSessionStats={null} t={translations.ja} />)
    for (const r of screen.getAllByTestId('report-total-rate')) expect(r).toHaveTextContent('—')
    expect(screen.getByText(translations.ja.operationReport.empty)).toBeInTheDocument()
  })

  it('ORM-A-04: 英語の見出し', () => {
    // Given: 英語 When: 開く Then: 英語のタイトル
    render(<OperationReportModal open onClose={() => {}} cumulativeStats={cumulative} lastSessionStats={null} t={translations.en} />)
    expect(screen.getByRole('dialog', { name: translations.en.operationReport.title })).toBeInTheDocument()
  })
})

describe('せっていから開く', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
  })

  const open = () => {
    act(() => screen.getByRole('button', { name: /せってい/ }).click())
    act(() => screen.getByTestId('operation-report-open').click())
  }

  it('ORM-N-03: 保存されている累計が見える', () => {
    // Given: 累計を保存 When: せってい → せいこう率 Then: クリック 75%
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify({
      stageStars: {}, badges: { earnedBadges: [], earnedAt: {} },
      cumulativeStats: cumulative, lastSessionStats: last, version: GAMIFICATION_SAVE_VERSION,
    }))
    render(<FruitHarvestGame />)
    open()
    const dialog = screen.getByRole('dialog', { name: translations.ja.operationReport.title })
    expect(within(within(dialog).getByTestId('report-row-click')).getByTestId('report-total-rate')).toHaveTextContent('75%')
  })

  it('ORM-A-03: 保存データが壊れていても 0 回で開ける', () => {
    // Given: 壊れた JSON When: 開く Then: 「—」で開ける
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, '{broken')
    render(<FruitHarvestGame />)
    open()
    const dialog = screen.getByRole('dialog', { name: translations.ja.operationReport.title })
    expect(within(within(dialog).getByTestId('report-row-click')).getByTestId('report-total-rate')).toHaveTextContent('—')
  })
})
