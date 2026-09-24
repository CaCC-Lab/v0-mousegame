import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FruitHarvestGame } from '../FruitHarvestGame'

/**
 * 待機中のヘッダは、選んでいるモードに合わせる（v1.1 計画 G6、docs/game-spec.md §4.3）。
 *
 * 以前はアーケードが選ばれているのに「ステージ 1 フルーツ畑」「ステージ目標 0/100」が出ていて、
 * 初見テストで「どちらのルールで遊ぶのか迷った」と指摘された。
 * また Enter キーでの開始は、選んでいるモードに関係なく必ずれんしゅうで始まっていた。
 */
describe('待機中のヘッダと Enter での開始は、選んでいるモードに従う', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fruitHarvestLanguage', JSON.stringify('ja'))
  })

  it('アーケードを選んでいる（既定）あいだは、ステージの表示とステージ目標を出さない', () => {
    render(<FruitHarvestGame />)

    expect(screen.getByTestId('mode-select-arcade')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText(/ステージ目標/)).not.toBeInTheDocument()
    expect(screen.queryByText('フルーツ畑')).not.toBeInTheDocument()
  })

  it('れんしゅうを選んで始めると、ステージの表示とステージ目標が出る', async () => {
    // 待機中はヘッダ自体を出さない（v1.1 計画 D6）。遊び始めたときに選んだモードの表示になる
    const user = userEvent.setup()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-practice'))
    await user.click(screen.getByTestId('mode-start'))

    expect(screen.getByText(/ステージ目標/)).toBeInTheDocument()
    expect(screen.getByText('フルーツ畑')).toBeInTheDocument()
  })

  it('アーケードを選んだまま Enter を押すと、アーケードで始まる', () => {
    render(<FruitHarvestGame />)

    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' })
    })

    // アーケードの HUD（フィーバーゲージ）が出て、ステージ目標は出ない
    expect(screen.getByRole('progressbar', { name: 'フィーバーゲージ' })).toBeInTheDocument()
    expect(screen.queryByText(/ステージ目標/)).not.toBeInTheDocument()
  })

  it('れんしゅうを選んで Enter を押すと、れんしゅうで始まる', async () => {
    const user = userEvent.setup()
    render(<FruitHarvestGame />)

    await user.click(screen.getByTestId('mode-select-practice'))
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' })
    })

    expect(screen.queryByRole('progressbar', { name: 'フィーバーゲージ' })).not.toBeInTheDocument()
    expect(screen.getByText(/ステージ目標/)).toBeInTheDocument()
  })
})
