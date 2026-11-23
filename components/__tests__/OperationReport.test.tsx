import React from 'react'
import { render, screen, act, within, fireEvent } from '@testing-library/react'
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
 * | ORM-A-05 | 開いた直後に Tab / Shift+Tab | キーボード | フォーカスは「とじる」から出ない | 後ろのスタートを押させない |
 * | ORM-N-04 | Escape | キーボード | onClose | - |
 * | ORM-N-05 | 開いたボタンから開いて閉じる | キーボード | フォーカスが開いたボタンに戻る | - |
 * | ORM-A-06 | 背景をクリック | マウス | onClose（パネル内クリックでは閉じない） | - |
 * | ORM-A-07 | パネル内で押して背景で離す | 文字の選択 | 閉じない | - |
 * | ORM-A-08 | クリックでフォーカスが移らない（Safari） | ブラウザ差 | 閉じたら「せいこう率」ボタンに戻る | jsdom の click もフォーカスしない |
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

describe('OperationReportModal: キーボード', () => {
  it('ORM-A-05: 開くと「とじる」にフォーカスし、Tab / Shift+Tab でも外へ出ない', () => {
    // Given: 後ろにスタートボタンがある画面で開く
    render(<><button>スタート</button><OperationReportModal open onClose={() => {}} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} /></>)
    const close = screen.getByTestId('report-close')
    expect(close).toHaveFocus()
    // When: Tab / Shift+Tab
    const tab = fireEvent.keyDown(close, { key: 'Tab' })
    const shiftTab = fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    // Then: 既定のフォーカス移動を止め、「とじる」のまま
    expect(tab).toBe(false)
    expect(shiftTab).toBe(false)
    expect(close).toHaveFocus()
  })

  it('ORM-N-04: Escape で onClose', () => {
    // Given: 開いている When: Escape Then: onClose 1回
    const onClose = jest.fn()
    render(<OperationReportModal open onClose={onClose} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('OperationReportModal: 閉じかた', () => {
  function Harness() {
    const [open, setOpen] = React.useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>ひらく</button>
        <OperationReportModal open={open} onClose={() => setOpen(false)} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} />
      </>
    )
  }

  it('ORM-N-05: 閉じたら、開いたボタンにフォーカスを戻す', () => {
    // Given: ボタンにフォーカスして開く
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'ひらく' })
    opener.focus()
    act(() => opener.click())
    expect(screen.getByTestId('report-close')).toHaveFocus()
    // When: Escape で閉じる
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    // Then: 開いたボタンに戻る
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('ORM-A-06: 背景をクリックすると閉じる（パネルの中では閉じない）', () => {
    // Given: 開いている
    const onClose = jest.fn()
    render(<OperationReportModal open onClose={onClose} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} />)
    // When: パネルの中 → 背景 の順にクリック
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByTestId('operation-report-backdrop'))
    fireEvent.click(screen.getByTestId('operation-report-backdrop'))
    // Then: 背景のときだけ閉じる
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ORM-A-07: パネルの中で押して背景で離しても閉じない（文字の選択）', () => {
    // Given: 開いている
    const onClose = jest.fn()
    render(<OperationReportModal open onClose={onClose} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} />)
    const backdrop = screen.getByTestId('operation-report-backdrop')
    // When: パネル内で mousedown、背景で click
    fireEvent.mouseDown(screen.getByRole('dialog'))
    fireEvent.click(backdrop)
    // Then: 閉じない。背景で押して離したときは閉じる
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.mouseDown(backdrop)
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
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

  it('ORM-A-08: クリックでフォーカスが移らないブラウザでも、閉じたら「せいこう率」ボタンに戻る', () => {
    // Given: Safari と同じく click でフォーカスしない（fireEvent.click）
    render(<FruitHarvestGame />)
    act(() => screen.getByRole('button', { name: /せってい/ }).click())
    const opener = screen.getByTestId('operation-report-open')
    // When: 開いて Escape で閉じる
    fireEvent.click(opener)
    fireEvent.keyDown(screen.getByRole('dialog', { name: translations.ja.operationReport.title }), { key: 'Escape' })
    // Then: 開いたボタンにフォーカス
    expect(opener).toHaveFocus()
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
