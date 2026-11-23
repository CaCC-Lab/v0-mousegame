import React from 'react'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import { MotionGlobalConfig } from 'framer-motion'
import { FruitHarvestGame } from '../FruitHarvestGame'
import { ARCADE_CONFIG } from '@/types/arcade'

/**
 * 結果やステージクリアを出しているあいだは、キーボードでゲームを始めたり取ったりしない
 * （docs/game-spec.md §4.3「リザルト表示中は、背後の操作を押せない」）。
 *
 * 以前は待機中ならモーダルが出ていてもキーボード操作が効き、
 * キーボードで果物を取っている子が Enter を押し続けると、ステージクリアを出したまま
 * 裏で同じステージが始まってタイマーが進んでいた。結果画面も Enter 1回で消えていた。
 *
 * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
 * |---|---|---|---|---|
 * | MK-A-01 | チャレンジの結果表示中に Enter | Equivalence – abnormal | 結果は残り、ゲームは始まらない | フォーカスは body のまま |
 * | MK-A-02 | チャレンジの結果表示中に Space と矢印 | Equivalence – abnormal | 結果は残り、ゲームは始まらない | - |
 * | MK-A-03 | れんしゅうの結果表示中に Enter | Equivalence – abnormal | 結果は残り、ゲームは始まらない | - |
 * | MK-A-04 | ステージクリア表示中に Enter | Equivalence – abnormal | クリア表示は残り、ゲームは始まらない | 実ブラウザで再現した不具合 |
 * | MK-A-05 | ステージ選択を開いているときに Enter | Equivalence – abnormal | ゲームは始まらない | - |
 * | MK-A-06 | ステージクリアだけ「閉じる」で閉じ、下のれんしゅうの結果が残っているときに Enter | Boundary – モーダルが1つ残る | 結果は残り、ゲームは始まらない | クリア時は結果も出る（§5） |
 * | MK-N-01 | モーダルが何も無い待機中に Enter | Equivalence – normal | 選んでいるモードで始まる | 既存の挙動を守る |
 * | MK-N-02 | チャレンジの結果を「メニューへ」で閉じた直後に Enter | Boundary – モーダルを閉じた直後 | チャレンジが始まる | - |
 * | MK-N-03 | ステージクリアと結果の両方を閉じた直後に Enter | Boundary – モーダルが0になった直後 | れんしゅうが始まる | - |
 */
describe('モーダルを出しているあいだのキーボード', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
    jest.useFakeTimers()
    // フェイクタイマーの下では退場アニメーションが終わらず、閉じたモーダルが DOM に残る
    MotionGlobalConfig.skipAnimations = true
  })

  afterEach(() => {
    MotionGlobalConfig.skipAnimations = false
    jest.useRealTimers()
  })

  const press = (key: string) => act(() => { fireEvent.keyDown(document.body, { key }) })
  const isPlaying = () => screen.queryByRole('button', { name: /ちゅうだん/ }) !== null
  // タイマーは描画のあとで張られるので1秒ずつ進める
  const advanceSeconds = (seconds: number) => {
    for (let s = 0; s < seconds; s++) act(() => { jest.advanceTimersByTime(1000) })
  }

  const finishArcade = () => {
    act(() => screen.getByTestId('mode-select-arcade').click())
    act(() => screen.getByTestId('mode-start').click())
    advanceSeconds(ARCADE_CONFIG.startTimeSec + 2)
    expect(screen.getByTestId('arcade-end-reason')).toBeInTheDocument()
  }

  const clearPracticeStageByKeyboard = () => {
    act(() => screen.getByTestId('mode-select-practice').click())
    act(() => screen.getByTestId('mode-start').click())
    for (let i = 0; i < 80 && !screen.queryByText(/ステージクリア/); i++) {
      press('ArrowDown')
      press('Enter')
    }
    expect(screen.getByText(/ステージクリア/)).toBeInTheDocument()
    expect(isPlaying()).toBe(false)
  }

  it('MK-A-01: チャレンジの結果表示中に Enter を押しても、結果は消えず次のゲームも始まらない', () => {
    // Given: チャレンジが時間切れで終わり、結果が出ている
    render(<FruitHarvestGame />)
    finishArcade()

    // When: Enter を押す
    press('Enter')

    // Then: 結果が残り、ゲームは始まっていない
    expect(screen.getByTestId('arcade-end-reason')).toBeInTheDocument()
    expect(isPlaying()).toBe(false)
  })

  it('MK-A-02: チャレンジの結果表示中に Space と矢印を押しても、何も起きない', () => {
    // Given: チャレンジの結果が出ている
    render(<FruitHarvestGame />)
    finishArcade()

    // When: Space と4方向の矢印を押す
    for (const key of [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) press(key)

    // Then: 結果が残り、ゲームは始まっていない
    expect(screen.getByTestId('arcade-end-reason')).toBeInTheDocument()
    expect(isPlaying()).toBe(false)
  })

  it('MK-A-03: れんしゅうの結果表示中に Enter を押しても、結果は消えず次のゲームも始まらない', () => {
    // Given: れんしゅうのステージ1（60秒）が0点で時間切れになり、結果が出ている
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-practice').click())
    act(() => screen.getByTestId('mode-start').click())
    advanceSeconds(62)
    expect(screen.getByRole('dialog')).toHaveTextContent('れんしゅうけっか')

    // When: Enter を押す
    press('Enter')

    // Then: 結果が残り、ゲームは始まっていない
    expect(screen.getByRole('dialog')).toHaveTextContent('れんしゅうけっか')
    expect(isPlaying()).toBe(false)
  })

  it('MK-A-04: ステージクリア表示中に Enter を押しても、裏で同じステージが始まらない', () => {
    // Given: キーボードで果物を取ってステージ1をクリアした
    render(<FruitHarvestGame />)
    clearPracticeStageByKeyboard()

    // When: 取るときと同じ流れで Enter を押す
    press('Enter')
    advanceSeconds(3)

    // Then: クリア表示が残り、ゲームは始まっていない
    expect(screen.getByText(/ステージクリア/)).toBeInTheDocument()
    expect(isPlaying()).toBe(false)
  })

  it('MK-A-05: ステージ選択を開いているときに Enter を押しても、ゲームは始まらない', () => {
    // Given: 待機中に「せってい」から「ステージ選択」を開いた
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-practice').click())
    act(() => screen.getByRole('button', { name: /せってい/ }).click())
    act(() => screen.getByRole('button', { name: /ステージをえらぶ/ }).click())
    expect(screen.getByRole('heading', { name: 'ステージをえらぶ' })).toBeInTheDocument()

    // When: Enter を押す
    press('Enter')

    // Then: ゲームは始まっていない
    expect(isPlaying()).toBe(false)
  })

  it('MK-N-01: モーダルが何も無い待機中に Enter を押すと、選んでいるモードで始まる', () => {
    // Given: 待機中にチャレンジを選んでいる
    render(<FruitHarvestGame />)
    act(() => screen.getByTestId('mode-select-arcade').click())

    // When: Enter を押す
    press('Enter')

    // Then: チャレンジが始まる
    expect(isPlaying()).toBe(true)
    expect(screen.getByText(/のこり/)).toBeInTheDocument()
  })

  it('MK-N-02: チャレンジの結果を「メニューへ」で閉じた直後の Enter では、チャレンジが始まる', () => {
    // Given: チャレンジの結果を「メニューへ」で閉じた
    render(<FruitHarvestGame />)
    finishArcade()
    act(() => within(screen.getByRole('dialog')).getByTestId('arcade-back-to-menu').click())
    expect(screen.queryByTestId('arcade-end-reason')).not.toBeInTheDocument()
    act(() => screen.getByTestId('mode-select-arcade').click())

    // When: Enter を押す
    press('Enter')

    // Then: チャレンジが始まる
    expect(isPlaying()).toBe(true)
  })

  const closeStageClear = async () => {
    act(() => screen.getByRole('button', { name: '閉じる' }).click())
    // AnimatePresence は退場の後始末を非同期に行う
    await act(async () => { await Promise.resolve() })
    expect(screen.queryByText(/ステージクリア/)).not.toBeInTheDocument()
  }

  it('MK-A-06: ステージクリアだけ閉じて、れんしゅうの結果が残っているあいだの Enter では始まらない', async () => {
    // Given: ステージクリアを「閉じる」で閉じ、下にれんしゅうの結果が残っている
    render(<FruitHarvestGame />)
    clearPracticeStageByKeyboard()
    await closeStageClear()
    expect(screen.getByRole('dialog')).toHaveTextContent('れんしゅうけっか')

    // When: Enter を押す
    press('Enter')

    // Then: 結果が残り、ゲームは始まっていない
    expect(screen.getByRole('dialog')).toHaveTextContent('れんしゅうけっか')
    expect(isPlaying()).toBe(false)
  })

  it('MK-N-03: ステージクリアと結果の両方を閉じた直後の Enter では、れんしゅうが始まる', async () => {
    // Given: ステージクリアを「閉じる」、れんしゅうの結果を「とじる」で閉じた
    render(<FruitHarvestGame />)
    clearPracticeStageByKeyboard()
    await closeStageClear()
    act(() => within(screen.getByRole('dialog')).getByRole('button', { name: 'とじる' }).click())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // When: Enter を押す
    press('Enter')

    // Then: れんしゅうが始まる
    expect(isPlaying()).toBe(true)
    expect(screen.getByText(/ステージ目標/)).toBeInTheDocument()
  })
})
