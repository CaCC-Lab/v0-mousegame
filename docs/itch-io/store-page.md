# itch.io ストアページ入稿用テキスト

itch.io の「Edit game」画面にそのまま貼り付けるための原稿。
価格モデルは **Name your own price（投げ銭）** を前提にしている。

---

## 1. 基本情報

| 項目 | 入力値 |
| --- | --- |
| **Title** | フルーツハーベスト / Fruit Harvest |
| **Project URL** | `fruit-harvest`（`https://<ユーザー名>.itch.io/fruit-harvest`） |
| **Short description / tagline** | マウスのクリック・ダブルクリック・右クリック・ドラッグを、フルーツを収穫しながら練習できる子ども向け学習ゲーム |
| **Classification** | Game |
| **Kind of project** | HTML |
| **Release status** | Released |
| **Pricing** | $0 or donate（Name your own price / 最低価格 0） |
| **Suggested donation** | $3.00 |

### Embed 設定（HTML5）

| 項目 | 入力値 | 理由 |
| --- | --- | --- |
| Viewport dimensions | 1280 × 960 | 縦にゲーム＋学習パネルが並ぶため、縦に余裕のある比率にする |
| Fullscreen button | ON | 小さい画面でも操作対象を大きく表示できる |
| Enable scrollbars | ON | ゲーム下部の練習記録・図鑑まで到達できるようにする |
| Mobile friendly | OFF | マウス操作の学習が目的のため |
| Automatically start on page load | OFF | 音とアニメーションが不意に始まらないようにする |

> **右クリック（レモン）について**
> ブラウザによっては iframe 内の右クリックでコンテキストメニューが出る場合がある。
> 説明文に「フルサイズ表示（fullscreen）だと右クリックの練習がしやすい」と案内している。

---

## 2. タグ（最大10個）

itch.io の既存タグから選択する。

```
educational, kids, mouse, practice, learning, cursor, html5, casual, family-friendly, japanese
```

| 分類 | 入力値 |
| --- | --- |
| Genre | Educational |
| Average session | A few minutes |
| Languages | 日本語 (Japanese), English |
| Inputs | Mouse |
| Accessibility | Configurable difficulty, Subtitles（＝日英切り替え）|

---

## 3. 説明文（Description）

> itch.io の説明欄にそのまま貼り付ける。日本語 → 英語の順に併記する。

### 貼り付け用テキスト

```
## 🍎 マウス操作を、楽しく練習しよう

フルーツハーベストは、パソコンのマウス操作を練習するための学習ゲームです。
落ちてくるフルーツを、それぞれ違う操作で収穫します。

- 🍎 **リンゴ** … クリック
- 🫐 **ブルーベリー** … ダブルクリック
- 🍋 **レモン** … 右クリック
- 🍉 **スイカ** … ドラッグ＆ドロップ

小学生がはじめてマウスに触れるときの練習用として作りました。
判定はやさしめに調整してあるので、うまくいかなくても大丈夫です。

### 特徴

- **6つのステージ** — 進むほどフルーツの種類と速さが変わります（1回1〜2分半）
- **練習の記録** — 操作ごとの成功回数がたまり、レベルとバッジで残ります
- **きょうのれんしゅう** — 4種類の操作を毎日ひとつずつ達成していく日課モード
- **難易度切り替え** — ふつう / むずかしい、「うごくモード」のオン・オフ
- **日本語・English** — 画面右下のボタンでいつでも切り替えられます
- **広告なし・アカウント登録なし** — 記録はブラウザの中だけに保存されます

### 遊びかた

1. 「はじめる」を押す
2. 落ちてくるフルーツを、それぞれの操作で収穫する
3. 時間になったら結果を見る（1回のプレイは1〜2分半。ステージによって変わります）

右クリックの練習は、右下の全画面ボタンを押すとやりやすくなります。

### 対象

- はじめてマウスを使う小学生
- クリックやドラッグの練習をしたい方
- 授業や家庭学習でマウス操作を教える先生・保護者の方

---

## 🍎 Practice mouse control, the fun way

Fruit Harvest is a small educational game for practicing mouse control.
Each falling fruit is harvested with a different action:

- 🍎 **Apple** … click
- 🫐 **Blueberry** … double-click
- 🍋 **Lemon** … right-click
- 🍉 **Watermelon** … drag & drop

It was built for elementary-school children using a mouse for the first time,
so the hit detection is deliberately forgiving.

### Features

- **6 stages** with changing fruit types and speed (1-2.5 minutes per run)
- **Progress tracking** — per-action success counts, levels and badges
- **Daily practice** — one goal per action, every day
- **Difficulty options** — normal / hard, and a moving-target mode
- **Japanese & English** — switch any time from the button at the bottom
- **No ads, no account** — all progress stays in your browser

### How to play

1. Press "Start"
2. Harvest each falling fruit with its matching mouse action
3. Check your result when the timer runs out (1-2.5 minutes, depending on the stage)

For right-click practice, the fullscreen button (bottom right) works best.

---

## 💛 このゲームについて / About this game

このゲームは無料で遊べます。気に入っていただけたら、開発の支えとして
サポートしていただけると嬉しいです（金額はご自由に設定できます）。

ソースコードは MIT ライセンスで公開しています。
GitHub: https://github.com/CaCC-Lab/v0-mousegame

This game is free to play. If you find it useful, an optional tip helps
support further development — you choose the amount.

The source code is open source under the MIT License.
```

---

## 4. 画像素材

| 用途 | ファイル | サイズ | 備考 |
| --- | --- | --- | --- |
| **Cover image** | `docs/itch-io/cover.png` | 630 × 500 | 必須。一覧・埋め込みカードに表示される |
| Screenshot 1 | `docs/screenshots/01-idle-screen.png` | — | ゲーム開始前の全体像 |
| Screenshot 2 | `docs/screenshots/02-playing.png` | — | プレイ中。フルーツが落ちている様子 |
| Screenshot 3 | `docs/screenshots/04-result-modal.png` | — | 結果画面 |
| Screenshot 4 | `docs/screenshots/05-gamification-overview.png` | — | 練習記録・レベル |
| Screenshot 5 | `docs/screenshots/06-collection-fruits.png` | — | 図鑑 |
| GIF（任意） | `docs/videos/gameplay.gif` | 1.2 MB | 実際の操作の様子 |

カバー画像は `docs/itch-io/cover.html` から生成している。作り直す場合:

```bash
node scripts/render-cover.mjs
```

---

## 5. 公開前チェックリスト

- [ ] `npm run build:itch` を実行し `dist-itch/fruit-harvest-itch.zip` を生成した
- [ ] zip を「This file will be played in the browser」に設定した
- [ ] Viewport を 1280 × 960、fullscreen を ON にした
- [ ] 価格を「$0 or donate」にした
- [ ] カバー画像（630×500）をアップロードした
- [ ] スクリーンショットを 3 枚以上登録した
- [ ] 支払い受取（Stripe / PayPal）を設定した
- [ ] 公開前に「Draft」で動作確認した（音・右クリック・ドラッグ）
- [ ] Visibility を Public にした

手順の詳細は [itch-io-release.md](../itch-io-release.md) を参照。
