import fs from 'node:fs'
import path from 'node:path'
import { parseNumericConstant, findNumericConstantInBundle } from '../build-info.mjs'

/**
 * 配布物（dist-itch/build）が公開先の要件を満たしているかの検査。
 *
 * itch.io はサブパス配信（/html/<id>/index.html）、
 * PLiCy は配信パスの形が公表されていないため、どちらでも動く必要がある。
 * その前提を崩す変更が入ったら気づけるようにする。
 *
 * ビルド未実行のときはスキップする（CIやクリーンな環境で落とさないため）。
 */
const buildDir = path.join(process.cwd(), 'dist-itch', 'build')
const hasBuild = fs.existsSync(path.join(buildDir, 'index.html'))

const describeIfBuilt = hasBuild ? describe : describe.skip

function collectFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? collectFiles(full) : [full]
  })
}

describeIfBuilt('配布物の検査（npm run build:itch の出力）', () => {
  it('index.html が zip のルートにある', () => {
    // itch.io / PLiCy どちらも「起動ページは index.html」を要求する
    expect(fs.existsSync(path.join(buildDir, 'index.html'))).toBe(true)
  })

  it('HTML にルート起点の絶対パスが残っていない', () => {
    // 配信パスがルート直下でない場合に 404 になる
    const htmlFiles = collectFiles(buildDir).filter((f) => f.endsWith('.html'))
    expect(htmlFiles.length).toBeGreaterThan(0)

    const offenders = htmlFiles.flatMap((file) => {
      const content = fs.readFileSync(file, 'utf8')
      const matches = content.match(/(?:href|src)=["']\/(?!\/)[^"']*/g) ?? []
      return matches.map((m) => `${path.relative(buildDir, file)}: ${m}`)
    })

    expect(offenders).toEqual([])
  })

  it('CSS にルート起点の絶対パスが残っていない', () => {
    // HTMLのpreloadに救われる参照があるため、CSS側も個別に確認する
    const cssFiles = collectFiles(buildDir).filter((f) => f.endsWith('.css'))
    expect(cssFiles.length).toBeGreaterThan(0)

    const offenders = cssFiles.flatMap((file) => {
      const content = fs.readFileSync(file, 'utf8')
      const matches = content.match(/url\(["']?\/(?!\/)[^)"']*/g) ?? []
      return matches.map((m) => `${path.relative(buildDir, file)}: ${m}`)
    })

    expect(offenders).toEqual([])
  })

  it('フルーツのスプライトが同梱されている', () => {
    for (const name of ['apple', 'blueberry', 'lemon', 'watermelon']) {
      expect(fs.existsSync(path.join(buildDir, 'sprites', `${name}.png`))).toBe(true)
    }
  })

  it('ファイル名に絵文字や日本語が含まれない', () => {
    // PLiCy は絵文字入りのファイル名でアップロードに失敗する
    const asciiOnly = /^[\w.\-/]+$/
    const offenders = collectFiles(buildDir)
      .map((f) => path.relative(buildDir, f))
      .filter((f) => !asciiOnly.test(f))

    expect(offenders).toEqual([])
  })

  it('itch.io のアップロード制限に収まっている', () => {
    const files = collectFiles(buildDir)
    const totalBytes = files.reduce((sum, f) => sum + fs.statSync(f).size, 0)

    expect(files.length).toBeLessThanOrEqual(1000)
    expect(totalBytes).toBeLessThanOrEqual(500 * 1024 * 1024)
    files.forEach((f) => {
      expect(fs.statSync(f).size).toBeLessThanOrEqual(200 * 1024 * 1024)
    })
  })

  it('どのコミットから作ったかが build-info.json に残っている（v1.1 計画 G13）', () => {
    const infoPath = path.join(buildDir, 'build-info.json')
    expect(fs.existsSync(infoPath)).toBe(true)
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
    expect(info.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(info.dirty).toBe(false)
  })

  it('配布物の定数がいまのソースと一致している（古いビルドを出さない。v1.1 計画 G13）', () => {
    // 監査時、配布物は feverGaugeMax:100 のまま（ソースは 50）だった。
    // 落ちたら: npm run build:itch で作り直す
    const source = fs.readFileSync(path.join(process.cwd(), 'types', 'arcade.ts'), 'utf8')
    const expected = parseNumericConstant(source, 'feverGaugeMax')
    const found = collectFiles(buildDir)
      .filter((f) => f.endsWith('.js'))
      .flatMap((f) => findNumericConstantInBundle(fs.readFileSync(f, 'utf8'), 'feverGaugeMax'))
    expect(found.length).toBeGreaterThan(0)
    expect(new Set(found)).toEqual(new Set([expected]))
  })
})
