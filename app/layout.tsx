import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

/**
 * フルーツ絵文字の同梱フォント。
 *
 * 絵文字はOSごとに絵柄が違う（Windows: Segoe UI Emoji / macOS: Apple Color Emoji /
 * Linux・Android: Noto Color Emoji）。配布先の環境によって別のフルーツが
 * 表示されるのを防ぐため、Noto Color Emoji から4文字だけ抜き出して同梱する。
 *
 * unicode-range でこのゲームが使う文字だけに適用するので、他の文字には影響しない。
 * ライセンスは app/fonts/FRUIT-EMOJI-LICENSE.txt を参照。
 */
const fruitEmoji = localFont({
  src: [
    { path: "./fonts/fruit-emoji.woff", weight: "400", style: "normal" },
  ],
  variable: "--font-fruit-emoji",
  display: "swap",
  // 絵文字4文字だけのフォントなので、メトリクス調整用の
  // フォールバックフォント生成は不要（生成に失敗してエラーになる）
  adjustFontFallback: false,
  declarations: [
    { prop: "unicode-range", value: "U+1F34E, U+1FAD0, U+1F34B, U+1F349" },
  ],
});

export const metadata: Metadata = {
  title: "フルーツハーベスト - Fruit Harvest Game",
  description: "落下するフルーツをキャッチして高得点を目指すアクションゲーム。様々なフルーツを集めてステージをクリアしよう！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fruitEmoji.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
