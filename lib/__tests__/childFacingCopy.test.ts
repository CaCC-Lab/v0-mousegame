import { translations } from '../i18n/translations'

/**
 * 初見テストの判断（2026-11-11、docs/v1.2-plan.md §7）。
 *
 * 子ども向けに変える語は、初見が名前を挙げた2語だけ。漢字の一括禁止はしない。
 *
 * | Case ID | Input / Precondition | Perspective (Equivalence / Boundary) | Expected Result | Notes |
 * |---|---|---|---|---|
 * | CP-N-01 | ja.score | Equivalence – normal | 「てんすう:」 | 見出しの「得点」 |
 * | CP-N-02 | ja.stageSelect | Equivalence – normal | 「ステージをえらぶ」 | 「選択」をひらがな寄りに |
 * | CP-N-03 | ja.comboEffect / feverHintCharging | Equivalence – normal | 効果の1行と、語「コンボ」 | コンボは残す |
 * | CP-N-04 | ja.dropAreaShort | Equivalence – normal | 「スイカをここへ」 | 帯は隠さない |
 * | CP-N-05 | ja.difficulty | Equivalence – normal | 「難易度」のまま | 漢字の一括禁止をしない |
 * | CP-A-01 | ja.score | Equivalence – abnormal | 「得点」を含まない | 旧見出しが残っていない |
 * | CP-A-02 | ja.stageSelect | Equivalence – abnormal | 「選択」を含まない | 旧ボタン名が残っていない |
 * | CP-A-03 | en.score / en.stageSelect / en.comboEffect | Equivalence – abnormal | 英語のまま。日本語の文字が無い | 英語画面をひらがなにしない |
 * | CP-B-01 | ja.score / ja.stageSelect / ja.comboEffect | Boundary – empty | 空文字ではない | 空は見出しが消える |
 * | CP-B-02 | 辞書のキー | Boundary – NULL | score / stageSelect / comboEffect がある | キー欠落は画面に出ない |
 */

describe('子ども向けの2語とコンボの1行', () => {
  it('CP-N-01: 得点の見出しは「てんすう:」', () => {
    // Given: 日本語の辞書
    // When: プレイ中の得点見出しを読む
    // Then: 「てんすう:」
    expect(translations.ja.score).toBe('てんすう:')
  })

  it('CP-N-02: ステージ選択は「ステージをえらぶ」', () => {
    // Given: 日本語の辞書
    // When: ステージ選択ボタンの語を読む
    // Then: 「ステージをえらぶ」
    expect(translations.ja.stageSelect).toBe('ステージをえらぶ')
  })

  it('CP-N-03: コンボの語は残し、効果を1行で添える', () => {
    // Given: 日本語の辞書
    // When: ゲージ横の文と、溜まっているときの一言を読む
    // Then: 効果の文があり、コンボという語が残る
    expect(translations.ja.comboEffect).toBe('つづけてとるとてんすうアップ')
    expect(translations.ja.feverHintCharging).toContain('コンボ')
    expect(translations.ja.combo).toBe('コンボ')
  })

  it('CP-N-04: 右端の帯の表示は「スイカをここへ」', () => {
    // Given: 日本語の辞書
    // When: 帯の短い表示を読む
    // Then: 目的語の付いた「スイカをここへ」
    expect(translations.ja.dropAreaShort).toBe('スイカをここへ')
  })

  it('CP-N-05: 初見が挙げていない「難易度」は漢字のまま', () => {
    // Given: 日本語の辞書
    // When: 難易度の見出しを読む
    // Then: 「難易度」のまま（漢字を一括では消さない）
    expect(translations.ja.difficulty).toBe('難易度')
  })

  it('CP-A-01: 得点の見出しに「得点」は残らない', () => {
    // Given: 日本語の辞書
    // When: 得点見出しを検査する
    // Then: 旧語「得点」を含まない
    expect(translations.ja.score).not.toContain('得点')
  })

  it('CP-A-02: ステージ選択のボタンに漢字の「選択」は残らない', () => {
    // Given: 日本語の辞書
    // When: ボタンの語を検査する
    // Then: 「選択」を含まない
    expect(translations.ja.stageSelect).not.toContain('選択')
    expect(translations.ja.stageSelect).not.toBe('ステージ選択')
  })

  it('CP-A-03: 英語の見出し・ボタン・コンボの1行は英語のまま', () => {
    // Given: 英語の辞書
    // When: 対応する3語を読む
    // Then: 英語で、ひらがな・カタカナ・漢字が無い
    expect(translations.en.score).toBe('Score:')
    expect(translations.en.stageSelect).toBe('Select Stage')
    expect(translations.en.dropAreaShort).toBe('DROP')
    expect(translations.en.comboEffect).not.toMatch(/[ぁ-んァ-ヶ一-龠]/)
    expect(translations.en.comboEffect.length).toBeGreaterThan(0)
  })

  it('CP-B-01: 変えた語は空文字ではない', () => {
    // Given: 日本語の辞書
    // When: 見出し・ボタン・コンボの1行の長さを見る
    // Then: どれも空ではない
    expect(translations.ja.score).not.toBe('')
    expect(translations.ja.stageSelect).not.toBe('')
    expect(translations.ja.comboEffect).not.toBe('')
    expect(translations.ja.dropAreaShort).not.toBe('')
  })

  it('CP-B-02: 画面が参照するキーが欠けていない', () => {
    // Given: 日本語と英語の辞書
    // When: 追加・変更したキーの有無を見る
    // Then: 両方にある（欠けると英語画面に日本語キーが漏れる）
    expect(translations.ja).toHaveProperty('comboEffect')
    expect(translations.en).toHaveProperty('comboEffect')
    expect(translations.ja.score).toEqual(expect.any(String))
    expect(translations.ja.stageSelect).toEqual(expect.any(String))
  })
})
