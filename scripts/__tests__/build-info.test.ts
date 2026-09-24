import {
  zipNameFor,
  parseNumericConstant,
  findNumericConstantInBundle,
  dirtyBuildInputs,
  isOutputStale,
  BUILD_INPUT_PATHS,
} from '../build-info.mjs'

/**
 * 配布物が「リリースするコミット」から作られていることを確かめる仕組み（v1.1 計画 G13、T16）。
 *
 * 2026-09-23 の監査で、手元の配布 zip が #52〜#54 より前のビルドだった
 * （chunk に feverGaugeMax:100、ソースは 50）。どのコミットから作ったかが zip に残っていなかった。
 */
describe('build-info', () => {
  it('zip の名前にコミットの短いハッシュを入れる', () => {
    expect(zipNameFor('abc1234')).toBe('fruit-harvest-itch-abc1234.zip')
  })

  it('TypeScript のソースから数値の定数を読む', () => {
    const source = `export const ARCADE_CONFIG = {\n  duration: 60,\n  feverGaugeMax: 50,\n}`
    expect(parseNumericConstant(source, 'feverGaugeMax')).toBe(50)
    expect(parseNumericConstant(source, 'missing')).toBeNull()
  })

  it('ビルド済みの JS から同じ名前の定数の値を拾う（minify 後の書式）', () => {
    const bundle = 'var a={duration:60,comboTimeoutMs:2500,feverGaugeMax:100,feverGainBase:6}'
    expect(findNumericConstantInBundle(bundle, 'feverGaugeMax')).toEqual([100])
    expect(findNumericConstantInBundle('nothing here', 'feverGaugeMax')).toEqual([])
  })

  it('ビルドに効くファイルの未コミット変更だけを拾う（ログや作業メモは無視する）', () => {
    const porcelain = [
      ' M .claude/task_completion.log',
      '?? promo/',
      ' M components/Fruit.tsx',
      '?? lib/newThing.ts',
      ' M docs/v1.1-plan.md',
    ].join('\n')
    expect(dirtyBuildInputs(porcelain)).toEqual(['components/Fruit.tsx', 'lib/newThing.ts'])
    expect(BUILD_INPUT_PATHS).toEqual(expect.arrayContaining(['app', 'components', 'hooks', 'lib', 'types', 'public']))
  })

  it('out/ がコミットより古ければ「古い」と判定する', () => {
    const commitSec = 1_800_000_000
    expect(isOutputStale(commitSec * 1000 - 1, commitSec)).toBe(true)
    expect(isOutputStale(commitSec * 1000 + 1, commitSec)).toBe(false)
  })
})
