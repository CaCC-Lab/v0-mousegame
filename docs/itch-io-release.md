# itch.io 公開手順書

フルーツハーベストを itch.io で HTML5 ゲームとして公開し、投げ銭（Name your own price）で
支援を受け取れるようにするまでの手順。

ストアページに入力する文章・タグ・画像は [itch-io/store-page.md](itch-io/store-page.md) にまとめてある。

> **公開状況**: 2026-08-05 に https://cacc-lab.itch.io/fruit-harvest で公開済み
> （`opportunity-pipeline/SHIPPING.md` の DONE）。以後の更新は **§9 の手順**（前の版を残す）で行う。

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
| `dist-itch/fruit-harvest-itch-<短いハッシュ>.zip` | itch.io にアップロードするファイル。名前はビルドしたコミット |
| `dist-itch/build/` | zip の中身。ローカル検証用 |
| `dist-itch/build/build-info.json` | どのコミットから作ったか（commit・dirty・builtAt・version）。zip にも入る |

ビルドは次のとき**失敗する**（古い版や、どのコミットとも一致しない版を出さないため。v1.1 計画 G13）:

- app/・components/ などビルドに効くファイルに未コミットの変更がある（試しに作るだけなら `ALLOW_DIRTY=1 npm run build:itch`。zip 名に `-dirty` が付く）
- `out/` が HEAD のコミットより古い
- 配布物の定数（`feverGaugeMax`）がソースと一致しない

以前の zip は消さずに `dist-itch/` に残る（§9-2 で戻すときに使える）。

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

1. **Uploads** セクションで `dist-itch/fruit-harvest-itch-<短いハッシュ>.zip` をアップロードする
2. アップロード完了後、そのファイルの **「This file will be played in the browser」に必ずチェックを入れる**
   — これを忘れるとブラウザで起動せず、ダウンロード配布になってしまう

### Embed options（重要）

| 設定 | 値 |
| --- | --- |
| Embed in page | 選択 |
| Viewport dimensions | **1280 × 800** |
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
3. 公開 URL（`https://cacc-lab.itch.io/fruit-harvest`）を確認する

公開後の任意作業:

- README.md に itch.io へのリンクを追加する
- itch.io のコミュニティ機能（Comments）を有効にして反応を受け取る

---

## 9. 更新するとき（前の版を残して、すぐ戻せるようにする）

v1.1 計画 G14。「公開してみて。すぐ戻せる？」に即答できる状態を保つ。
以前は既存の zip を **Replace file** で差し替えていたため、前の版がどこにも残らなかった。

### 9-1. 新しい版を出す

1. 変更は PR でマージ済みであること。master を最新にする

   ```bash
   git switch master && git pull
   npm run build:itch        # 未コミットの変更や古い out/ があれば止まる
   ```

2. 出す版にタグを付けて push する（タグ名 = `itch-v<版>`。例 `itch-v1.1.0`）

   ```bash
   git tag -a itch-v1.1.0 -m "itch.io 公開版 v1.1.0"
   git push origin itch-v1.1.0
   ```

3. itch.io の Edit game → **Uploads** で **Upload files** から新しい zip を**追加**する（既存の zip は消さない・差し替えない）
4. 新しい zip の「**This file will be played in the browser**」に✅、前の zip はこのチェックを外す
5. 前の zip は「**Hide this file and prevent it from being downloaded**」に✅（ダウンロード欄に出さない）
6. Save して公開ページで起動を確認する
7. 起動しているのが新しい版かを **build-info.json** で確かめる: ゲームの iframe を新しいタブで開き、
   URL の `index.html` を `build-info.json` に変えて開く。`commit` がタグのコミットと一致すればよい

   ```bash
   git rev-list -n 1 itch-v1.1.0   # これと build-info.json の commit を比べる
   ```

アップロード済みの zip は直近の **3 版**まで残し、それより古いものは削除してよい。

### 9-2. 前の版に戻す

1. itch.io の Edit game → **Uploads** で、前の版の zip の「This file will be played in the browser」に✅、今の版は外す
2. Save して、9-1 の 7 と同じく build-info.json の `commit` が前のタグと一致することを確かめる

前の版の zip を itch.io から消してしまっていた場合は、タグから作り直してアップロードする:

```bash
git switch --detach itch-v1.0.1
npm ci && npm run build:itch
git switch master
```

### 9-3. リハーサルの記録

itch.io の管理画面の操作は人が行う（自動化しない）。手順を変えたら1回リハーサルして記録する。

| 日付 | やったこと | 所要時間 | 気づいたこと |
|---|---|---|---|
| （未実施） | 9-1 → 9-2 を通しで行い、build-info.json で切り替わりを確認する | — | 「Hide this file」の文言・場所が画面と合っているかも確認する |

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
| パワーアップの説明 | v1.1 でヘルプの秒数・個数を `types/powerup.ts` の定数から差し込む形にした。数値を変えるときは定数だけを直す（`docs/game-spec.md` §6） |
