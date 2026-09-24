# CrazyGames 向けストア文言

CrazyGames への提出用の見せ方をまとめる。Issue #42 の「ストア文言の転換」に対応する。

> **前提**: itch.io / PLiCy 側の文言は**教育路線のまま変えない**。
> 同じゲームでも、辿り着く人と探しているものが違うため。
>
> | 掲載先 | 読者 | 見せ方 |
> | --- | --- | --- |
> | itch.io / PLiCy | 保護者・先生・子ども | マウス操作の練習ツール |
> | CrazyGames | 遊ぶ場所を探しているプレイヤー | 気軽に競える収穫アーケード |

CrazyGames の審査は「プレイヤーを何分つかまえておけるか」を見る。
入口の文言も、練習の説明ではなく**遊びの説明**にする。

---

## 転換の要点

| 項目 | これまで（教育路線） | CrazyGames 向け |
| --- | --- | --- |
| 一言説明 | mouse practice for kids | casual harvest arcade |
| 主役 | 4つのマウス操作を覚える | 取るほど時間が延びる。どこまで続けられるか（v1.2） |
| 数字の見せ方 | 習熟度・バッジ | スコア・コンボ・段位 |
| 練習モードの扱い | 主役 | 「ゆっくり練習したい人向け」として併記 |

練習モードは消していないので、教育面を求めて来た人も従来どおり遊べる。

---

## 提出フォーム用テキスト（英語）

### Title

```
Fruit Harvest Arcade
```

### Short description（〜160字目安）

```
Every fruit you pick adds time. Chain combos, hit Bonus Time, and see how long you can keep going. Four ways to pick: click, double-click, right-click and drag.
```

### Long description

```
Fruit Harvest Arcade starts with 30 seconds on the clock — and every fruit you pick adds a little more.
Mistakes take time away, and the fruits start moving once you get going.

Every fruit is picked a different way — click an apple, double-click a blueberry,
right-click a lemon, and drag a watermelon to the drop zone. Keep picking without a
miss and your combo multiplier climbs, all the way to 5x. Fill the Bonus Time gauge and
the whole field lights up: double points on top of your combo, and fruit pouring in.

Every run ends with your next goal and the move you missed most, with a one-click
way to practice it. The better you get, the longer each run lasts.

Prefer to take it slow? Practice mode is still here: six stages that teach every
mouse move at your own pace.

- Time-attack runs: every catch adds time, every mistake costs some
- Combo multipliers up to 5x and Bonus Time
- Personal best and five ranks to climb
- Four distinct controls — great for sharpening your mouse skills
- Plays on touch too: tap, double tap, long press and drag
- English and Japanese
```

### Controls（フォームの操作説明欄）

```
Mouse: click apples, double-click blueberries, right-click lemons,
drag watermelons to the drop zone on the right.
Touch: tap, double tap, long press (instead of right-click), and drag.
Keyboard: arrow keys to select, Enter to pick, Space to pause.
```

### Tags 候補

```
arcade, casual, time-attack, combo, fruit, clicker, skill, mouse, mobile-friendly
```

---

## 日本語版（PLiCy 等で同じ路線に寄せたくなった場合の控え）

そのまま使う予定はない。CrazyGames の文言を訳したものとして残す。

```
とると じかんが のびる。どこまで つづけられる？

りんごはクリック、ブルーベリーはダブルクリック、レモンは右クリック、
スイカはドラッグ。つづけてとるほどコンボがのびて、てんすうは最大5ばい。
ゲージがたまれば「ボーナスタイム」で、さらに2ばい。

まちがえると じかんが へる。たくさん とると フルーツが うごきだす。
おわったら「つぎの めあて」と「にがてな そうさ」がわかる。
```

---

## 提出前チェック

Issue #42 の合格ラインに対応する。

- [x] ロード後10秒以内にプレイ到達（開いた画面のプレイエリアがそのままモード選択）
- [x] コンボ→ボーナスタイム→段位更新のループが成立している
- [x] 腕前で1プレイの長さが変わる（v1.2。`docs/v1.2-plan.md` の計測）
- [x] 英語で完全に遊べる（`?lang=en` および言語切替）
- [x] モバイルで全4操作が成立する（タップ／2回タップ／長押し／なぞる）
- [x] デバッグページなし・アプリ由来の console 出力なし
- [ ] リワード広告（スペシャルフルーツ）は SDK 導入後に有効化
      （`lib/ads/rewardedBoost.ts` に差し込み口だけ用意済み。
      プロバイダ未登録のあいだはボタンを描画しない）
- [ ] 提出タイミングは MCH・悪夢の結果を見てから
      （基準未達の繰り返し提出はアカウント制限の対象）
