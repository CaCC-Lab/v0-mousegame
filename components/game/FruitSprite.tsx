"use client"

import React from 'react'
import { Fruit as FruitType, FRUIT_NAME } from '@/types/game'

interface FruitSpriteProps {
  type: FruitType['type']
  /** 一辺のピクセル数（正方形） */
  size?: number
  className?: string
  /** 隣に名前が文字で出ている場合など、読み上げを重複させたくないとき */
  decorative?: boolean
}

/**
 * フルーツのスプライト画像。
 *
 * 絵文字はOSごとに絵柄が変わるため、同梱した画像で描画する。
 * 支援技術には日本語の名前（りんご等）を伝える。
 *
 * 画像は public/sprites/ に置き、CSSやJSではなく素の <img> で読み込む。
 * itch.io はサブパス配信なので、絶対パスにならないよう相対パスで参照する
 * （scripts/build-itch.mjs が HTML と CSS の絶対パスを相対化するが、
 *  ここでは最初から相対で書いておく）。
 */
export function FruitSprite({
  type,
  size,
  className = '',
  decorative = false,
}: FruitSpriteProps): React.ReactElement {
  return (
    <img
      src={`./sprites/${type}.png`}
      alt={decorative ? '' : FRUIT_NAME[type]}
      width={size}
      height={size}
      draggable={false}
      className={`select-none ${className}`}
      // サイズ未指定なら親のfont-sizeに追従させる。
      // 絵文字はグリフが1emより大きく描かれるため、置き換え前と同じ見た目に
      // なるよう1.3emにしている（1emだと以前より小さく見える）
      style={size ? undefined : { width: '1.3em', height: '1.3em' }}
    />
  )
}
