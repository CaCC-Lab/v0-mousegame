/**
 * itch.io（HTML5ゲーム）向けの配布zipを生成する後処理スクリプト。
 *
 * 前提: `next build` によって out/ が生成済みであること。
 *
 * なぜ後処理が必要か:
 *   itch.ioはアップロードしたzipを
 *   https://html-classic.itch.zone/html/<id>/index.html のようなサブパスで配信する。
 *   Next.jsの静的エクスポートは既定で /_next/... という絶対パスを出力するため、
 *   そのままではドメインルートを参照して全アセットが404になる。
 *
 *   next.config.mjs の assetPrefix で相対化する方法は next/font が拒否する
 *   （"assetPrefix must start with a leading slash or be an absolute URL"）ため、
 *   ビルド後にHTML内の参照だけを相対パスへ書き換える。
 *
 * 使い方: npm run build:itch
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rewriteToRelativePaths, findRemainingAbsolutePaths } from './itch-path-rewrite.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(projectRoot, 'out')
const stagingDir = path.join(projectRoot, 'dist-itch', 'build')
const zipPath = path.join(projectRoot, 'dist-itch', 'fruit-harvest-itch.zip')

/** itch.ioの配布物に含めない開発用ファイル */
const EXCLUDED_ENTRIES = [
  'test-translations', // 翻訳確認用の開発ページ
  'test-translations.html',
  'test-translations.txt',
  'index.txt', // App RouterのRSCペイロード。静的配信では未使用
]

/** itch.ioのHTML5アップロード上限（無料プラン） */
const ITCH_ZIP_LIMIT_BYTES = 1024 * 1024 * 1024

function fail(what, why, how) {
  console.error(`\n❌ ${what}\n   原因: ${why}\n   対処: ${how}\n`)
  process.exit(1)
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function collectFiles(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath))
    } else {
      results.push(fullPath)
    }
  }
  return results
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    fail(
      'out/ が見つかりません',
      'next build による静的エクスポートがまだ実行されていません',
      'npm run build:itch を使うか、先に npm run build を実行してください'
    )
  }

  // 1. ステージング領域を作り直す
  fs.rmSync(path.dirname(stagingDir), { recursive: true, force: true })
  fs.mkdirSync(stagingDir, { recursive: true })
  fs.cpSync(sourceDir, stagingDir, { recursive: true })

  // 2. 開発用ファイルを除外する
  for (const entry of EXCLUDED_ENTRIES) {
    const target = path.join(stagingDir, entry)
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true })
      console.log(`   除外: ${entry}`)
    }
  }

  // 3. HTMLの絶対パスを相対パスへ書き換える
  const htmlFiles = collectFiles(stagingDir).filter((file) => file.endsWith('.html'))
  if (htmlFiles.length === 0) {
    fail(
      'HTMLファイルが見つかりません',
      'out/ の内容が想定と異なります',
      'npm run build を実行し直してから再試行してください'
    )
  }

  const problems = []
  for (const file of htmlFiles) {
    const original = fs.readFileSync(file, 'utf8')
    const rewritten = rewriteToRelativePaths(original)
    fs.writeFileSync(file, rewritten)

    const remaining = findRemainingAbsolutePaths(rewritten)
    if (remaining.length > 0) {
      problems.push({ file: path.relative(stagingDir, file), remaining })
    }
    console.log(`   相対化: ${path.relative(stagingDir, file)}`)
  }

  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`   ⚠️ ${problem.file} に絶対パスが残っています:`)
      problem.remaining.forEach((p) => console.error(`      ${p}`))
    }
    fail(
      '絶対パスを相対化しきれませんでした',
      'itch.ioのサブパス配信ではこれらの参照が404になります',
      'scripts/build-itch.mjs の rewriteToRelativePaths を上記パターンに対応させてください'
    )
  }

  // 4. index.html がzipのルートにあることを確認する（itch.ioの必須要件）
  const indexPath = path.join(stagingDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    fail(
      'index.html がルートにありません',
      'itch.ioはzip直下のindex.htmlをゲームの入口として読み込みます',
      'next.config.mjs の output 設定を確認してください'
    )
  }

  // 5. zipに固める（zip直下にindex.htmlが来るようステージング内で実行）
  fs.rmSync(zipPath, { force: true })
  try {
    execFileSync('zip', ['-r', '-q', zipPath, '.'], { cwd: stagingDir })
  } catch (error) {
    fail(
      'zipの作成に失敗しました',
      `zipコマンドを実行できませんでした: ${error.message}`,
      `zipをインストールするか、${stagingDir} の中身を手動でzip化してください（zip直下にindex.htmlが来るように）`
    )
  }

  const zipSize = fs.statSync(zipPath).size
  if (zipSize > ITCH_ZIP_LIMIT_BYTES) {
    fail(
      'zipがitch.ioのアップロード上限を超えています',
      `${formatSize(zipSize)} は上限の ${formatSize(ITCH_ZIP_LIMIT_BYTES)} を超えます`,
      'アセットを削減するか、itch.ioに容量上限の引き上げを申請してください'
    )
  }

  console.log('\n✅ itch.io向けビルドが完成しました')
  console.log(`   zip:  ${path.relative(projectRoot, zipPath)} (${formatSize(zipSize)})`)
  console.log(`   検証用ディレクトリ: ${path.relative(projectRoot, stagingDir)}`)
  console.log('\n   次の手順は docs/itch-io-release.md を参照してください。\n')
}

// テストからimportしたときは実行しない
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
