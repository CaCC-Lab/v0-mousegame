/**
 * 配布物が「どのコミットから作られたか」を記録・検査するための純粋関数（v1.1 計画 G13）。
 *
 * 2026-09-23 の監査で、手元の配布 zip が最新の3つの PR より前のビルドだった
 * （chunk に feverGaugeMax:100、ソースは 50）。どのコミットから作ったかが zip に残っておらず、
 * 「直したつもりのものが配布物に入っているか」を実体で確かめられなかった。
 *
 * build-itch.mjs が使う。テストは scripts/__tests__/build-info.test.ts。
 */

/** ビルド結果に効くパス。ここに未コミットの変更があれば、そのビルドはどのコミットとも一致しない */
export const BUILD_INPUT_PATHS = [
  'app',
  'components',
  'hooks',
  'lib',
  'types',
  'public',
  'next.config.mjs',
  'package.json',
  'package-lock.json',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
  'scripts/build-itch.mjs',
  'scripts/itch-path-rewrite.mjs',
  'scripts/build-info.mjs',
]

export function zipNameFor(shortCommit) {
  return `fruit-harvest-itch-${shortCommit}.zip`
}

/** `name: 123` の形で書かれた数値定数をソースから読む。無ければ null */
export function parseNumericConstant(source, name) {
  const match = new RegExp(`\\b${name}\\s*:\\s*(\\d+(?:\\.\\d+)?)`).exec(source)
  return match ? Number(match[1]) : null
}

/** minify 後の JS から `name:123` をすべて拾う */
export function findNumericConstantInBundle(bundle, name) {
  const re = new RegExp(`\\b${name}:(\\d+(?:\\.\\d+)?)`, 'g')
  return [...bundle.matchAll(re)].map((m) => Number(m[1]))
}

/**
 * `git status --porcelain` の出力から、ビルドに効くファイルの変更だけを返す。
 * 作業ログや未追跡のメモ（.claude/、promo/ など）はビルドに入らないので無視する。
 */
export function dirtyBuildInputs(porcelain) {
  return porcelain
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((p) => (p.includes(' -> ') ? p.split(' -> ')[1] : p))
    .filter((p) => BUILD_INPUT_PATHS.some((input) => p === input || p.startsWith(`${input}/`)))
}

/** out/ の最新ファイルが HEAD のコミット時刻より古ければ、コミット後に作り直していない */
export function isOutputStale(newestOutputMtimeMs, headCommitEpochSec) {
  return newestOutputMtimeMs < headCommitEpochSec * 1000
}
