import {
  rewriteToRelativePaths,
  findRemainingAbsolutePaths,
  rewriteCssToRelativePaths,
  findRemainingAbsolutePathsInCss,
} from '../itch-path-rewrite.mjs'

/**
 * itch.io配信用のパス書き換えロジックのテスト（モックなし・ピュア関数）
 *
 * itch.ioはzipを https://html-classic.itch.zone/html/<id>/ 配下に展開して配信するため、
 * Next.jsが出力する絶対パス(/_next/...)はドメインルートを指してしまい404になる。
 */
describe('rewriteToRelativePaths', () => {
  it('スクリプトの絶対パスを相対パスに書き換える', () => {
    const html = '<script src="/_next/static/chunks/main.js"></script>'

    expect(rewriteToRelativePaths(html)).toBe(
      '<script src="./_next/static/chunks/main.js"></script>'
    )
  })

  it('スタイルシートの絶対パスを相対パスに書き換える', () => {
    const html = '<link rel="stylesheet" href="/_next/static/css/app.css"/>'

    expect(rewriteToRelativePaths(html)).toBe(
      '<link rel="stylesheet" href="./_next/static/css/app.css"/>'
    )
  })

  it('faviconなど_next配下以外の絶対パスも書き換える', () => {
    const html = '<link rel="icon" href="/favicon.ico"/>'

    expect(rewriteToRelativePaths(html)).toBe('<link rel="icon" href="./favicon.ico"/>')
  })

  it('シングルクォートの属性も書き換える', () => {
    const html = "<script src='/_next/static/chunks/app.js'></script>"

    expect(rewriteToRelativePaths(html)).toBe(
      "<script src='./_next/static/chunks/app.js'></script>"
    )
  })

  it('RSCペイロードに埋め込まれた_nextのパス文字列も書き換える', () => {
    // App Routerはプリロード指示をJSON文字列としてHTMLに埋め込む
    const html = 'self.__next_f.push([1,"[\\"/_next/static/css/app.css\\"]"])'

    expect(rewriteToRelativePaths(html)).toContain('./_next/static/css/app.css')
  })

  it('外部URLには手を加えない', () => {
    const html =
      '<script src="https://example.com/script.js"></script>' +
      '<link href="http://example.com/style.css"/>'

    expect(rewriteToRelativePaths(html)).toBe(html)
  })

  it('プロトコル相対URLには手を加えない', () => {
    const html = '<script src="//cdn.example.com/script.js"></script>'

    expect(rewriteToRelativePaths(html)).toBe(html)
  })

  it('すでに相対パスのものを二重に書き換えない', () => {
    const html = '<script src="./_next/static/chunks/main.js"></script>'

    expect(rewriteToRelativePaths(html)).toBe(html)
  })

  it('複数の参照をまとめて書き換える', () => {
    const html =
      '<link href="/_next/static/css/a.css"/>' +
      '<script src="/_next/static/chunks/b.js"></script>' +
      '<img src="/images/c.png"/>'

    const result = rewriteToRelativePaths(html)

    expect(result).toContain('href="./_next/static/css/a.css"')
    expect(result).toContain('src="./_next/static/chunks/b.js"')
    expect(result).toContain('src="./images/c.png"')
  })

  it('アンカーリンクやフラグメントを壊さない', () => {
    const html = '<a href="#main">skip</a>'

    expect(rewriteToRelativePaths(html)).toBe(html)
  })
})

describe('findRemainingAbsolutePaths', () => {
  it('書き換え後のHTMLには絶対パスが残らない', () => {
    const html =
      '<link href="/_next/static/css/a.css"/><script src="/_next/static/chunks/b.js"></script>'

    expect(findRemainingAbsolutePaths(rewriteToRelativePaths(html))).toEqual([])
  })

  it('相対化されていない絶対パスを検出する', () => {
    const html = '<img src="/sounds/collect.mp3"/>'

    expect(findRemainingAbsolutePaths(html)).toEqual(['src="/sounds/collect.mp3'])
  })

  it('同じ絶対パスは重複して報告しない', () => {
    const html = '<img src="/a.png"/><img src="/a.png"/>'

    expect(findRemainingAbsolutePaths(html)).toHaveLength(1)
  })

  it('外部URLは絶対パスとして報告しない', () => {
    const html = '<script src="https://example.com/script.js"></script>'

    expect(findRemainingAbsolutePaths(html)).toEqual([])
  })

  it('プロトコル相対URLは絶対パスとして報告しない', () => {
    const html = '<script src="//cdn.example.com/script.js"></script>'

    expect(findRemainingAbsolutePaths(html)).toEqual([])
  })
})

describe('rewriteCssToRelativePaths', () => {
  it('CSS内のフォント参照を相対パスに書き換える', () => {
    // CSSは _next/static/css/ にあるので、_next/static/media/ へは ../media/ で届く
    const css = '@font-face{src:url(/_next/static/media/font.woff) format("woff")}'

    expect(rewriteCssToRelativePaths(css)).toBe(
      '@font-face{src:url(../media/font.woff) format("woff")}'
    )
  })

  it('クォート付きのurlも書き換える', () => {
    expect(rewriteCssToRelativePaths(`src:url("/_next/static/media/a.woff")`)).toBe(
      `src:url("../media/a.woff")`
    )
    expect(rewriteCssToRelativePaths(`src:url('/_next/static/media/a.woff')`)).toBe(
      `src:url('../media/a.woff')`
    )
  })

  it('chunks配下の参照も書き換える', () => {
    expect(rewriteCssToRelativePaths('background:url(/_next/static/chunks/bg.png)')).toBe(
      'background:url(../chunks/bg.png)'
    )
  })

  it('外部URLには手を加えない', () => {
    const css = "@import url('https://fonts.googleapis.com/css2?family=Nunito');"
    expect(rewriteCssToRelativePaths(css)).toBe(css)
  })

  it('data URIには手を加えない', () => {
    const css = 'src:url(data:font/woff2;base64,AAAA)'
    expect(rewriteCssToRelativePaths(css)).toBe(css)
  })

  it('すでに相対パスのものを二重に書き換えない', () => {
    const css = 'src:url(../media/font.woff)'
    expect(rewriteCssToRelativePaths(css)).toBe(css)
  })
})

describe('findRemainingAbsolutePathsInCss', () => {
  it('書き換え後のCSSには絶対パスが残らない', () => {
    const css = 'src:url(/_next/static/media/a.woff),url("/_next/static/media/b.ttf")'
    expect(findRemainingAbsolutePathsInCss(rewriteCssToRelativePaths(css))).toEqual([])
  })

  it('相対化されていない参照を検出する', () => {
    expect(findRemainingAbsolutePathsInCss('src:url(/fonts/a.woff)')).toEqual(['url(/fonts/a.woff)'])
  })

  it('外部URLとdata URIは報告しない', () => {
    const css = "@import url('https://example.com/a.css');src:url(data:font/woff2;base64,AA)"
    expect(findRemainingAbsolutePathsInCss(css)).toEqual([])
  })
})
