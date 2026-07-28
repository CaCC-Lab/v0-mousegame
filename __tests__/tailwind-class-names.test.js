const fs = require('fs')
const path = require('path')

/**
 * Tailwindのクラス名が動的に組み立てられていないことを検証する。
 *
 * Tailwindはビルド時にソースを走査して「完全な文字列として現れるクラス名」だけを
 * CSSに出力する。そのため `bg-${color}-50` のように組み立てると、
 * DOM上のクラス名は正しく見えるのにCSSが存在せず、色や余白が効かなくなる。
 * （実際にHelpDialogのレモンのカードだけ背景色と枠線が消えていた）
 *
 * この不具合はブラウザで見るまで気付けず、ユニットテストでも検出できないため、
 * ソースコードの静的検査で防ぐ。
 */
describe('Tailwind class names', () => {
  const TARGET_DIRS = ['components', 'app']

  /** クラス名の途中にテンプレートリテラルの補間が入っているパターン */
  const DYNAMIC_CLASS_PATTERN =
    /\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|divide|outline|accent|caret|decoration|placeholder)-\$\{/

  function collectSourceFiles(dir) {
    const results = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') continue
        results.push(...collectSourceFiles(fullPath))
      } else if (/\.(tsx|jsx)$/.test(entry.name)) {
        results.push(fullPath)
      }
    }

    return results
  }

  const sourceFiles = TARGET_DIRS.filter((dir) =>
    fs.existsSync(path.join(process.cwd(), dir))
  ).flatMap((dir) => collectSourceFiles(path.join(process.cwd(), dir)))

  it('検査対象のソースファイルが見つかる', () => {
    expect(sourceFiles.length).toBeGreaterThan(0)
  })

  it('Tailwindのクラス名を文字列補間で組み立てていない', () => {
    const violations = sourceFiles
      .map((file) => ({
        file: path.relative(process.cwd(), file),
        lines: fs
          .readFileSync(file, 'utf8')
          .split('\n')
          .map((line, index) => ({ line: line.trim(), number: index + 1 }))
          // 注意書き自体がパターンに一致するため、コメント行は対象外にする
          .filter(({ line }) => !/^(\/\/|\/?\*)/.test(line))
          .filter(({ line }) => DYNAMIC_CLASS_PATTERN.test(line)),
      }))
      .filter(({ lines }) => lines.length > 0)

    const report = violations
      .flatMap(({ file, lines }) => lines.map(({ line, number }) => `${file}:${number}  ${line}`))
      .join('\n')

    expect(report).toBe('')
  })
})
