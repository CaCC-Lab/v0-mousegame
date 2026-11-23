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
 * | ORM-A-09 | フォーカスがダイアログの外（body）にある | 選択・クリックでフォーカスが外れた | Escape で閉じ、Tab で「とじる」に戻る | - |
 * | ORM-A-08 | クリックでフォーカスが移らない（Safari） | ブラウザ差 | 閉じたら「せいこう率」ボタンに戻る | jsdom の click もフォーカスしない |
 * | RST-N-01 | 記録あり・「きろくを けす」 | Equivalence – normal | 確認が出て「やめる」にフォーカス。まだ消さない | 押しまちがい対策 |
 * | RST-N-02 | 確認で「けす」 | Equivalence – normal | onReset 1回、確認は消え「とじる」にフォーカス | - |
 * | RST-A-01 | 確認で「やめる」 | 取り消し | onReset なし、「きろくを けす」にフォーカス | - |
 * | RST-A-02 | 記録0回 | Boundary – 0 | 「きろくを けす」は押せない | - |
 * | RST-A-03 | onReset を渡さない | Boundary – undefined | ボタンを出さない | - |
 * | RST-A-04 | 確認中に Escape | キーボード | 確認だけ閉じる（onClose なし） | - |
 * | RST-A-05 | 確認中に閉じて開き直す | 状態 | 確認は出ていない | - |
 * | RST-A-06 | Tab / Shift+Tab | キーボード | ダイアログ内のボタンを回り、外へ出ない | ORM-A-05 の拡張 |
 * | RST-A-07 | 英語 | i18n | 英語のボタン名 | - |
 * | RST-N-03 | せっていから開いて消す | Integration | 表は「—」、保存も0、星とバッジは残る | - |
 * | RST-A-08 | せっていから開いて「やめる」 | Integration | 保存は変わらない | - |
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
    // Given: 後ろにスタートボタンがある画面で開く（リセットなし＝ボタンは「とじる」だけ）
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

describe('OperationReportModal: フォーカスが外れたとき', () => {
  it('ORM-A-09: フォーカスが body にあっても、Tab で「とじる」に戻り、Escape で閉じる', () => {
    // Given: 開いたあと、文字の選択などでフォーカスが外れた
    const onClose = jest.fn()
    render(<><button>スタート</button><OperationReportModal open onClose={onClose} cumulativeStats={cumulative} lastSessionStats={null} t={translations.ja} /></>)
    act(() => (document.activeElement as HTMLElement).blur())
    expect(document.body).toHaveFocus()
    // When: body で Tab
    const tab = fireEvent.keyDown(document.body, { key: 'Tab' })
    // Then: 後ろへ行かず「とじる」へ
    expect(tab).toBe(false)
    expect(screen.getByTestId('report-close')).toHaveFocus()
    // When: もう一度外して Escape Then: 閉じる
    act(() => (document.activeElement as HTMLElement).blur())
    fireEvent.keyDown(document.body, { key: 'Escape' })
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

describe('OperationReportModal: きろくを けす', () => {
  const renderModal = (props: Partial<React.ComponentProps<typeof OperationReportModal>> = {}) => {
    const onReset = jest.fn()
    const onClose = jest.fn()
    const utils = render(
      <>
        <button>スタート</button>
        <OperationReportModal open onClose={onClose} onReset={onReset} cumulativeStats={cumulative} lastSessionStats={last} t={translations.ja} {...props} />
      </>
    )
    return { onReset, onClose, ...utils }
  }
  const r = translations.ja.operationReport

  it('RST-N-01: 押すと確認が出て、まだ消さない', () => {
    // Given: 記録あり When: きろくを けす
    const { onReset } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: r.reset }))
    // Then: 確認文と「やめる」（フォーカス）、onReset はまだ
    expect(screen.getByText(r.resetConfirm)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: r.resetCancel })).toHaveFocus()
    expect(onReset).not.toHaveBeenCalled()
  })

  it('RST-N-02: 確認で「けす」を押すと onReset、確認は閉じて「とじる」へ', () => {
    // Given: 確認を出した When: けす
    const { onReset } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: r.reset }))
    fireEvent.click(screen.getByRole('button', { name: r.resetConfirmButton }))
    // Then: onReset 1回、確認なし、「とじる」にフォーカス
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(r.resetConfirm)).not.toBeInTheDocument()
    expect(screen.getByTestId('report-close')).toHaveFocus()
  })

  it('RST-A-01: 「やめる」なら消さず、「きろくを けす」へ戻る', () => {
    // Given: 確認を出した When: やめる
    const { onReset } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: r.reset }))
    fireEvent.click(screen.getByRole('button', { name: r.resetCancel }))
    // Then: onReset なし、確認なし、元のボタンにフォーカス
    expect(onReset).not.toHaveBeenCalled()
    expect(screen.queryByText(r.resetConfirm)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: r.reset })).toHaveFocus()
  })

  it('RST-A-02: 記録が0回なら押せない', () => {
    // Given: 記録なし When: 開く Then: 無効
    renderModal({ cumulativeStats: zero, lastSessionStats: null })
    expect(screen.getByRole('button', { name: r.reset })).toBeDisabled()
  })

  it('RST-A-03: onReset が無ければボタンを出さない', () => {
    // Given: onReset なし When: 開く Then: ボタンなし
    renderModal({ onReset: undefined })
    expect(screen.queryByRole('button', { name: r.reset })).not.toBeInTheDocument()
  })

  it('RST-A-04: 確認中の Escape は確認だけ閉じる', () => {
    // Given: 確認を出した When: Escape
    const { onReset, onClose } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: r.reset }))
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })
    // Then: 確認なし、画面は開いたまま、消さない
    expect(screen.queryByText(r.resetConfirm)).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(onReset).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: r.reset })).toHaveFocus()
  })

  it('RST-A-05: 確認中に閉じて開き直すと、確認は出ていない', () => {
    // Given: 確認を出した
    const { rerender } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: r.reset }))
    // When: 閉じて開き直す
    rerender(<OperationReportModal open={false} onClose={() => {}} onReset={() => {}} cumulativeStats={cumulative} lastSessionStats={last} t={translations.ja} />)
    rerender(<OperationReportModal open onClose={() => {}} onReset={() => {}} cumulativeStats={cumulative} lastSessionStats={last} t={translations.ja} />)
    // Then: 確認なし
    expect(screen.queryByText(r.resetConfirm)).not.toBeInTheDocument()
  })

  it('RST-A-06: Tab / Shift+Tab はダイアログ内のボタンを回り、外へ出ない', () => {
    // Given: 「とじる」にフォーカス
    renderModal()
    const close = screen.getByTestId('report-close')
    const reset = screen.getByRole('button', { name: r.reset })
    expect(close).toHaveFocus()
    // When: Tab Then: 「きろくを けす」
    expect(fireEvent.keyDown(close, { key: 'Tab' })).toBe(false)
    expect(reset).toHaveFocus()
    // When: もう一度 Tab Then: 先頭の「とじる」へ戻る（スタートへは出ない）
    fireEvent.keyDown(reset, { key: 'Tab' })
    expect(close).toHaveFocus()
    // When: Shift+Tab Then: 末尾の「きろくを けす」
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(reset).toHaveFocus()
  })

  it('RST-A-07: 英語のボタン名', () => {
    // Given: 英語 When: 開いて押す Then: 英語のボタンと確認文
    renderModal({ t: translations.en })
    fireEvent.click(screen.getByRole('button', { name: translations.en.operationReport.reset }))
    expect(screen.getByText(translations.en.operationReport.resetConfirm)).toBeInTheDocument()
  })
})

describe('せっていから開いて きろくを けす', () => {
  const saved = {
    stageStars: { 1: 3 }, badges: { earnedBadges: ['clickMaster'], earnedAt: { clickMaster: 1 } },
    cumulativeStats: cumulative, lastSessionStats: last, version: GAMIFICATION_SAVE_VERSION,
  }
  const r = translations.ja.operationReport
  const stored = () => JSON.parse(localStorage.getItem(GAMIFICATION_STORAGE_KEY) ?? 'null')

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(saved))
    render(<FruitHarvestGame />)
    act(() => screen.getByRole('button', { name: /せってい/ }).click())
    act(() => screen.getByTestId('operation-report-open').click())
  })

  it('RST-N-03: 消すと表は「—」になり、保存も0、星とバッジは残る', () => {
    // Given: 記録ありで開いた When: きろくを けす → けす
    const dialog = screen.getByRole('dialog', { name: r.title })
    fireEvent.click(within(dialog).getByRole('button', { name: r.reset }))
    fireEvent.click(within(dialog).getByRole('button', { name: r.resetConfirmButton }))
    // Then: 率はすべて「—」、保存も0、星とバッジはそのまま
    for (const cell of within(dialog).getAllByTestId('report-total-rate')) expect(cell).toHaveTextContent('—')
    expect(stored().cumulativeStats).toEqual(zero)
    expect(stored().lastSessionStats).toBeNull()
    expect(stored().stageStars).toEqual({ 1: 3 })
    expect(stored().badges.earnedBadges).toEqual(['clickMaster'])
  })

  it('RST-A-08: 「やめる」なら保存は変わらない', () => {
    // Given: 記録ありで開いた When: きろくを けす → やめる
    const dialog = screen.getByRole('dialog', { name: r.title })
    fireEvent.click(within(dialog).getByRole('button', { name: r.reset }))
    fireEvent.click(within(dialog).getByRole('button', { name: r.resetCancel }))
    // Then: 75% のまま、保存も同じ
    expect(within(within(dialog).getByTestId('report-row-click')).getByTestId('report-total-rate')).toHaveTextContent('75%')
    expect(stored().cumulativeStats).toEqual(cumulative)
  })
})
