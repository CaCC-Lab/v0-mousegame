import React from 'react'
import { render, screen } from '@testing-library/react'
import { ArcadeHUD } from '@/components/game/ArcadeHUD'
import { translations } from '@/lib/i18n/translations'
import { ARCADE_CONFIG } from '@/types/arcade'

const t = translations.ja

function setup(overrides: Partial<React.ComponentProps<typeof ArcadeHUD>> = {}) {
  render(
    <ArcadeHUD
      combo={0}
      comboMultiplier={1}
      feverGauge={0}
      isFever={false}
      t={t}
      {...overrides}
    />
  )
}

describe('ArcadeHUD', () => {
  it('コンボが2未満のうちは表示しない（画面を汚さない）', () => {
    setup({ combo: 1 })
    expect(screen.queryByTestId('arcade-combo')).not.toBeInTheDocument()
  })

  it('コンボが伸びたら数と倍率を表示する', () => {
    setup({ combo: 7, comboMultiplier: 3 })
    const combo = screen.getByTestId('arcade-combo')
    expect(combo).toHaveTextContent('7')
    expect(combo).toHaveTextContent('x3')
  })

  it('フィーバーゲージを進捗として読み上げられる', () => {
    setup({ feverGauge: 40 })
    const gauge = screen.getByTestId('arcade-fever-gauge')
    expect(gauge).toHaveAttribute('role', 'progressbar')
    expect(gauge).toHaveAttribute('aria-valuenow', '40')
    expect(gauge).toHaveAttribute('aria-valuemax', String(ARCADE_CONFIG.feverGaugeMax))
  })

  it('ゲージの端数は丸めて読み上げる', () => {
    setup({ feverGauge: 40.6 })
    expect(screen.getByTestId('arcade-fever-gauge')).toHaveAttribute('aria-valuenow', '41')
  })

  it('フィーバー中はフィーバー表示が出る', () => {
    setup({ isFever: true, feverGauge: 100 })
    expect(screen.getByTestId('arcade-fever-banner')).toHaveTextContent(t.fever)
  })

  it('フィーバーでないときはフィーバー表示を出さない', () => {
    setup({ isFever: false })
    expect(screen.queryByTestId('arcade-fever-banner')).not.toBeInTheDocument()
  })
})
