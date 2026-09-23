import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelpDialog } from '../HelpDialog'
import { translations } from '@/lib/i18n/translations'
import { POWERUP_CONFIGS, POWERUP_SPAWN_INTERVAL, POWERUP_LIFETIME } from '@/types/powerup'
import { GAME_SCORES } from '@/types/game'

/**
 * HelpDialogの実装テスト（モックなし）
 *
 * あそびかたダイアログは、フルーツの取り方だけでなく
 * ゲームモード・制限時間・キーボード操作・パワーアップまでを説明する。
 * 実際の翻訳データを渡して、各セクションが表示されることを検証する。
 */
describe('HelpDialog', () => {
  const openDialog = async (t: typeof translations.ja | typeof translations.en) => {
    const user = userEvent.setup()
    render(<HelpDialog t={t} />)
    await user.click(screen.getByText(t.howToPlay))
  }

  describe('日本語', () => {
    it('ボタンを押すとあそびかたダイアログが開く', async () => {
      await openDialog(translations.ja)

      expect(await screen.findByText('フルーツあつめゲームのあそびかた')).toBeInTheDocument()
    })

    it('4種類のフルーツの取り方を表示する', async () => {
      await openDialog(translations.ja)

      expect(await screen.findByText('🍓 フルーツのとりかた 🍓')).toBeInTheDocument()
      expect(screen.getByText(/マウスでカチッとクリックしてつかまえよう/)).toBeInTheDocument()
      expect(screen.getByText(/すばやく２かいクリック/)).toBeInTheDocument()
      expect(screen.getByText(/マウスのみぎボタンをおしてとろう/)).toBeInTheDocument()
      expect(screen.getByText(/きいろいエリアまでもっていこう/)).toBeInTheDocument()
    })

    it('フルーツごとの色分けクラスを静的に付与する', async () => {
      // Tailwindはソース中の完全なクラス名しか検出しないため、
      // `bg-${color}-50` のように組み立てるとCSSが生成されず色が付かない
      await openDialog(translations.ja)
      await screen.findByText('🍓 フルーツのとりかた 🍓')

      const cardOf = (fruitName: string) =>
        screen.getByText(fruitName).closest('div.p-4')!

      expect(cardOf('りんご').className).toContain('bg-red-50')
      expect(cardOf('ブルーベリー').className).toContain('bg-blue-50')
      expect(cardOf('レモン').className).toContain('bg-yellow-50')
      expect(cardOf('スイカ').className).toContain('bg-green-50')
    })

    it('ゲームモードの違いを表示する', async () => {
      await openDialog(translations.ja)

      expect(await screen.findByText('🎮 ゲームモード 🎮')).toBeInTheDocument()
      expect(screen.getByText('🐢 とまるモード')).toBeInTheDocument()
      expect(screen.getByText('🏃 うごくモード')).toBeInTheDocument()
      expect(screen.getByText(/フルーツはうごかないから、ゆっくりあそべるよ/)).toBeInTheDocument()
      expect(screen.getByText(/フルーツがにげまわるよ/)).toBeInTheDocument()
    })

    it('制限時間と目標を表示する', async () => {
      await openDialog(translations.ja)

      expect(await screen.findByText(/じかんはステージによってかわるよ/)).toBeInTheDocument()
      expect(screen.getByText(/たかいてんすうをめざそう/)).toBeInTheDocument()
    })

    it('キーボード操作を表示する', async () => {
      await openDialog(translations.ja)

      expect(await screen.findByText('キーボードでもあそべるよ:')).toBeInTheDocument()
      expect(screen.getByText('Space')).toBeInTheDocument()
      expect(screen.getByText('↑↓←→')).toBeInTheDocument()
      expect(screen.getByText('Enter')).toBeInTheDocument()
      expect(screen.getByText(/ゲームをとめたり、つづけたりできるよ/)).toBeInTheDocument()
      expect(screen.getByText(/フルーツをえらべるよ/)).toBeInTheDocument()
    })

    it('パワーアップは実装されている5種類だけを表示し、架空の種類は出さない', async () => {
      // 以前は存在しない「じしゃく」「シールド」「じかんストップ」を含む8種類を説明していた（v1.1 計画 G3）
      await openDialog(translations.ja)
      expect(await screen.findByText('⚡ パワーアップアイテムについて ⚡')).toBeInTheDocument()

      const items = screen.getAllByTestId('help-powerup')
      expect(items).toHaveLength(Object.keys(POWERUP_CONFIGS).length)
      expect(screen.queryByText(/じしゃく|シールド|じかんストップ/)).not.toBeInTheDocument()
    })

    it('パワーアップの秒数・個数・出現間隔は定数から差し込む（手で書き写さない）', async () => {
      await openDialog(translations.ja)
      await screen.findByText('⚡ パワーアップアイテムについて ⚡')

      const sec = (ms: number) => String(ms / 1000)
      const textOf = (type: string) =>
        screen.getAllByTestId('help-powerup').find((el) => el.getAttribute('data-type') === type)!.textContent!

      expect(textOf('timeExtension')).toContain(`${sec(POWERUP_CONFIGS.timeExtension.effect.value)}びょう`)
      expect(textOf('scoreMultiplier')).toContain(`${sec(POWERUP_CONFIGS.scoreMultiplier.effect.duration)}びょう`)
      expect(textOf('speedBoost')).toContain(`${sec(POWERUP_CONFIGS.speedBoost.effect.duration)}びょう`)
      expect(textOf('extraFruits')).toContain(`${POWERUP_CONFIGS.extraFruits.effect.value}こ`)
      expect(textOf('freezeTime')).toContain(`${sec(POWERUP_CONFIGS.freezeTime.effect.duration)}びょう`)

      const desc = screen.getByTestId('help-powerup-desc').textContent!
      expect(desc).toContain(`${sec(POWERUP_SPAWN_INTERVAL)}びょう`)
      expect(desc).toContain(`${sec(POWERUP_LIFETIME)}びょう`)
      // 置き換え忘れの {…} が残っていない
      expect(desc).not.toMatch(/[{}]/)
      screen.getAllByTestId('help-powerup').forEach((el) => expect(el.textContent).not.toMatch(/[{}]/))
    })

    it('フルーツの点数は得点計算と同じ定数から出す', async () => {
      await openDialog(translations.ja)
      await screen.findByText('🍓 フルーツのとりかた 🍓')
      const cardOf = (fruitName: string) => screen.getByText(fruitName).closest('div.p-4')!

      expect(cardOf('りんご').textContent).toContain(`${GAME_SCORES.apple} てん`)
      expect(cardOf('ブルーベリー').textContent).toContain(`${GAME_SCORES.blueberry} てん`)
      expect(cardOf('レモン').textContent).toContain(`${GAME_SCORES.lemon} てん`)
      expect(cardOf('スイカ').textContent).toContain(`${GAME_SCORES.watermelon} てん`)
    })
  })

  describe('English', () => {
    it('全セクションを英語で表示する', async () => {
      await openDialog(translations.en)

      expect(await screen.findByText('How to Play Fruit Collecting Game')).toBeInTheDocument()
      expect(screen.getByText('🍓 How to Catch Fruits 🍓')).toBeInTheDocument()
      expect(screen.getByText('🎮 Game Modes 🎮')).toBeInTheDocument()
      expect(screen.getByText('🐢 Still Mode')).toBeInTheDocument()
      expect(screen.getByText('🏃 Moving Mode')).toBeInTheDocument()
      expect(screen.getByText(/Time varies by stage/)).toBeInTheDocument()
      expect(screen.getByText('You can also use keyboard:')).toBeInTheDocument()
      expect(screen.getByText('⚡ About Power-Up Items ⚡')).toBeInTheDocument()
      expect(screen.getAllByTestId('help-powerup')).toHaveLength(Object.keys(POWERUP_CONFIGS).length)
      expect(screen.getByTestId('help-powerup-desc').textContent).not.toMatch(/[{}]/)
      expect(screen.queryByText(/Magnet|Shield|Time Stop/)).not.toBeInTheDocument()
    })

    it('英語でも説明文の接頭辞を取り除いて表示する', async () => {
      await openDialog(translations.en)

      // 「🍎 Apple: 」「Still Mode: 」のような接頭辞は
      // カード見出しと重複するため本文からは取り除く
      expect(await screen.findByText('Click once to catch it!')).toBeInTheDocument()
      expect(screen.getByText("Fruits don't move, so you can play slowly")).toBeInTheDocument()
    })
  })
})
