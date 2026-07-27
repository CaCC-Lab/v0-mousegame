# itch.io 公開手順書

フルーツハーベストを itch.io で HTML5 ゲームとして公開し、投げ銭（Name your own price）で
支援を受け取れるようにするまでの手順。

ストアページに入力する文章・タグ・画像は [itch-io/store-page.md](itch-io/store-page.md) にまとめてある。

> 本書の itch.io 側の仕様は [公式ドキュメント](https://itch.io/docs/creators/html5) と
> [支払いドキュメント](https://itch.io/docs/creators/payments) の記載に基づく（2026-07 時点）。
> 画面の文言や手数料は変わることがあるため、実際の表示を優先すること。

---

## 0. 前提の確認

このゲームは MIT ライセンスで GitHub と Vercel に公開済みである。
そのため **有料販売ではなく投げ銭モデル**（無料で遊べる／支援は任意）を前提にしている。
有料販売に切り替えたい場合は、ソース公開と無料デモの扱いを先に決める必要がある。

---

## 1. 事前準備

### 1-1. itch.io アカウント

1. https://itch.io/register でアカウントを作成する
2. メールアドレスを確認する
3. 「Developer」として登録されていることを確認する（プロフィール設定）

### 1-2. 支払い受け取りの設定

投げ銭を受け取るには、支払いゲートウェイの接続が必要。**先に済ませておく**こと。
未設定のまま公開すると、支援したい人がいても受け取れない。

1. https://itch.io/dashboard → 右上のユーザーメニュー → **Settings** → **Payment settings**
2. **PayPal** または **Stripe** を接続する
   - どちらも決済手数料は **$0.30 + 2.9%**
   - PayPal は日本の個人アカウントでも受け取れる。Stripe は事業者情報の登録が必要
3. **Tax information**（税務情報）の入力を求められた場合は指示に従う
   - 米国外の個人は税務認証に **$3.00**（初回のみ）がかかる場合がある

### 1-3. 収益分配率（任意）

itch.io は「オープン収益分配モデル」で、売上の **0〜100%** を itch.io に渡す割合を自分で決められる。
**デフォルトは 10%**。変更する場合は Settings → Revenue sharing から。

---

## 2. 配布ファイルのビルド

```bash
npm run build:itch
```

生成物:

| パス | 用途 |
| --- | --- |
| `dist-itch/fruit-harvest-itch.zip` | itch.io にアップロードするファイル |
| `dist-itch/build/` | zip の中身。ローカル検証用 |

このスクリプトは以下を自動で行う:

- Next.js の絶対パス（`/_next/...`）を相対パスへ書き換える
  — itch.io はサブパス配信のため、絶対パスのままでは全アセットが 404 になる
- 開発用ページ（`test-translations`）を除外する
- `index.html` が zip 直下にあることを確認する
- itch.io の制限（1000 ファイル / 単一 200MB / 展開後 500MB / パス 240 文字）を検査する

相対化しきれない絶対パスが残った場合はビルドが失敗する。エラーに出たパスを
`scripts/itch-path-rewrite.mjs` の対象に追加すること。

### ローカルでの事前確認（推奨）

itch.io と同じサブパス配信を再現して動作を確認できる:

```bash
mkdir -p /tmp/itch-check/html/12345
cp -r dist-itch/build/. /tmp/itch-check/html/12345/
python3 -m http.server 8765 --directory /tmp/itch-check
# ブラウザで http://localhost:8765/html/12345/index.html を開く
```

確認する点:

- [ ] 画面のスタイルが崩れていない（CSS が読めている）
- [ ] 「はじめる」でゲームが開始する
- [ ] フルーツを取ると音が鳴る
- [ ] ブラウザの開発者ツールに 404 が出ていない

---

## 3. itch.io にプロジェクトを作成する

1. https://itch.io/game/new を開く
2. 以下を入力する（詳細な文面は [store-page.md](itch-io/store-page.md) 参照）

| 項目 | 値 |
| --- | --- |
| Title | フルーツハーベスト / Fruit Harvest |
| Project URL | `fruit-harvest` |
| Short description | store-page.md の tagline |
| Classification | Game |
| **Kind of project** | **HTML** ← これを選ばないとブラウザで遊べない |
| Release status | Released |

---

## 4. 価格を設定する

**Pricing** で **`$0 or donate`** を選ぶ。

- 無料でダウンロード・プレイできる状態を保ちつつ、任意の支援を受け付けられる
- **Suggested donation** に推奨額（例: `$3.00`）を入力する
- 支援画面では「No thanks, just take me to the downloads」で支払いをスキップできる

> **注意**: 無料でダウンロードした人は itch.io 上の「所有権」を得ない。
> 将来このプロジェクトを有料化する場合の扱いに影響するため、
> 無料配布を続ける前提であることを理解した上で選ぶこと。

---

## 5. ゲーム本体をアップロードする

1. **Uploads** セクションで `dist-itch/fruit-harvest-itch.zip` をアップロードする
2. アップロード完了後、そのファイルの **「This file will be played in the browser」に必ずチェックを入れる**
   — これを忘れるとブラウザで起動せず、ダウンロード配布になってしまう

### Embed options（重要）

| 設定 | 値 |
| --- | --- |
| Embed in page | 選択 |
| Viewport dimensions | **1280 × 960** |
| Fullscreen button | ✅ ON |
| Enable scrollbars | ✅ ON |
| Click to launch | ✅ ON（既定） |
| Mobile friendly | OFF |

補足:

- 「Click to launch」を有効にしておくと、ページを開いた瞬間に音やアニメーションが始まらない
- スクロールバーを有効にしないと、ゲーム下部の「きょうのれんしゅう」「図鑑」に到達できない
- モバイル端末では設定に関わらず、クリック起動のフルスクリーンモードになる

---

## 6. ストアページを仕上げる

[store-page.md](itch-io/store-page.md) の内容を貼り付ける。

1. **Description** — 日本語・英語の説明文
2. **Cover image** — `docs/itch-io/cover.png`（630×500）
3. **Screenshots** — `docs/screenshots/` から 3〜5 枚
4. **Tags / Genre / Languages / Inputs** — store-page.md の表のとおり

---

## 7. 公開前の動作確認

**Visibility を「Draft」のまま**保存し、表示されるプレビュー URL で確認する。

- [ ] ゲームが iframe 内で起動する
- [ ] 🍎 クリックで収穫できる
- [ ] 🫐 ダブルクリックで収穫できる
- [ ] 🍋 右クリックで収穫できる（コンテキストメニューが邪魔なら全画面ボタンを使う）
- [ ] 🍉 ドラッグ＆ドロップで収穫できる
- [ ] 効果音が鳴る
- [ ] 日本語 / English の切り替えが動く
- [ ] スクロールして下部のパネルまで見える

---

## 8. 公開する

1. ページ下部の **Visibility & access** を **Public** にする
2. **Save & view page**
3. 公開 URL（`https://<ユーザー名>.itch.io/fruit-harvest`）を確認する

公開後の任意作業:

- README.md に itch.io へのリンクを追加する
- itch.io のコミュニティ機能（Comments）を有効にして反応を受け取る

---

## 9. 更新するとき

```bash
npm run build:itch
```

1. Edit game → Uploads で、既存の zip の **Replace file** から新しい zip を差し替える
2. 「This file will be played in the browser」のチェックが外れていないか確認する
3. Save

ファイルを削除して新規追加すると Embed 設定がリセットされることがあるため、
**差し替え（Replace）を使う**のが安全。

---

## 10. 手数料と収益について

| 項目 | 金額 |
| --- | --- |
| 決済手数料（PayPal / Stripe） | $0.30 + 2.9% |
| itch.io の取り分 | 既定 10%（0〜100% で変更可） |
| 税務認証（初回のみ・該当する場合） | $3.00 |

支援 $3.00 を受け取った場合の概算: 決済手数料 約 $0.39、itch.io 10% で $0.30 →
手元に残るのは **$2.3 前後**。

### 期待値について正直な見立て

- itch.io の主な利用者層はインディーゲームのプレイヤーで、**教育・学習ツールは主戦場ではない**
- 無料公開かつソースも公開しているため、投げ銭の発生率は低いと考えるのが現実的
- 収益を主目的にするなら、itch.io 単体よりも次のような導線と組み合わせる方が現実的:
  - 学校・学習塾・保護者コミュニティへの直接的な紹介
  - GitHub Sponsors など継続支援の受け皿
  - 教材としてのまとまった提供（複数ツールのセット化）

---

## 11. 既知の注意点

| 項目 | 内容 |
| --- | --- |
| 外部フォント | `app/globals.css` が Google Fonts を読み込んでいる。オフラインや読み込み失敗時は書体が代替に変わる（機能には影響しない） |
| 右クリック | iframe 内ではブラウザのコンテキストメニューが出ることがある。全画面表示を案内している |
| データ保存 | ハイスコアや練習記録は localStorage に保存される。itch.io の埋め込み iframe 単位で保持されるため、ブラウザや端末をまたぐと引き継がれない |
| 音声 | 効果音は Web Audio API で合成している。音源ファイルは同梱していない |
| ヘルプの表記 | ゲーム内ヘルプに「じかんは３ぷんかん！」とあるが、実際の制限時間はステージごとに 60〜150 秒。修正する場合は `lib/i18n/translations.ts` |
