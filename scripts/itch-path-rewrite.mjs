/**
 * itch.io配信用のパス書き換えロジック（ピュア関数）。
 *
 * itch.ioはアップロードしたzipを
 * https://html-classic.itch.zone/html/<id>/index.html のようなサブパスで配信する。
 * Next.jsの静的エクスポートが出力する絶対パス(/_next/...)はドメインルートを指すため、
 * そのままでは全アセットが404になる。
 *
 * テストしやすいよう、ファイル操作を含むbuild-itch.mjsから独立させている。
 */

/**
 * HTML内の「サイトルート起点の絶対パス」を相対パスへ書き換える。
 * 外部URL(https://...)とプロトコル相対URL(//...)には手を加えない。
 *
 * @param {string} html
 * @returns {string}
 */
export function rewriteToRelativePaths(html) {
  return (
    html
      // <link href="/_next/..."> / <script src="/_next/..."> など
      .replace(/((?:href|src)=)(["'])\/(?!\/)/g, '$1$2./')
      // RSCペイロードやプリロード指示に埋め込まれた "/_next/..." という文字列
      .replace(/(["'])\/_next\//g, '$1./_next/')
      // 上の置換でエスケープ済みJSON内のパスが漏れるため、そちらも拾う
      .replace(/(\\")\/_next\//g, '$1./_next/')
  )
}

/**
 * 相対化しきれなかった絶対パス参照を列挙する（配信時に404になる候補）。
 *
 * @param {string} html
 * @returns {string[]} 重複を除いた検出結果
 */
export function findRemainingAbsolutePaths(html) {
  const matches = html.match(/(?:href|src)=["']\/(?!\/)[^"']*/g) ?? []
  return [...new Set(matches)]
}

/**
 * CSS内の url() を相対パスへ書き換える。
 *
 * CSSは `_next/static/css/` に出力され、参照先のフォントや画像は
 * `_next/static/media/` にある。したがって `/_next/static/media/x`
 * への参照は、CSSから見て `../media/x` になる。
 *
 * HTMLの相対化だけでは足りない。HTMLに preload がある分（Geistフォント等）は
 * たまたま読めてしまうが、preload されない参照（同梱の絵文字フォント）は
 * サブパス配信で404になる。
 *
 * 外部URL（https://...）とdata URIには手を加えない。
 *
 * @param {string} css
 * @returns {string}
 */
export function rewriteCssToRelativePaths(css) {
  return css.replace(/url\((["']?)\/_next\/static\//g, 'url($1../')
}

/**
 * CSS内で相対化しきれなかった絶対パス参照を列挙する。
 *
 * @param {string} css
 * @returns {string[]} 重複を除いた検出結果
 */
export function findRemainingAbsolutePathsInCss(css) {
  const matches = css.match(/url\(["']?\/(?!\/)[^)"']*["']?\)/g) ?? []
  return [...new Set(matches)]
}
