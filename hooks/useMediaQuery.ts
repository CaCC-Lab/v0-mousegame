import { useEffect, useState } from 'react'

/**
 * メディアクエリに一致するかを返す。
 *
 * CSS の hidden / lg:flex で同じ部品を2か所に置くと、画面では片方だけ見えても DOM には2つあり、
 * 読み上げで2回読まれ、テストでも2つ見つかる。どちらか1つだけを描くためにこちらを使う。
 *
 * @param fallback 測れないとき（静的エクスポートの HTML を作るとき）の値
 */
export function useMediaQuery(query: string, fallback = true): boolean {
  const [matches, setMatches] = useState(fallback)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener?.('change', update)
    return () => list.removeEventListener?.('change', update)
  }, [query])

  return matches
}
