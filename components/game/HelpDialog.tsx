"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { translations } from '@/lib/i18n/translations'
import type { Fruit as FruitType } from '@/types/game'
import { FruitSprite } from './FruitSprite'

interface HelpDialogProps {
  /** 現在の言語の翻訳データ（lib/i18n/translations.ts） */
  t: typeof translations.ja
}

interface FruitHelpInfo {
  type: FruitType['type']
  points: number
  /**
   * Tailwindはソース中に現れる完全なクラス名しか拾わないため、
   * `bg-${color}-50` のように組み立ててはいけない（CSSが生成されず色が付かない）。
   * 色ごとのクラスは静的に書き下す。
   */
  cardClass: string
  nameClass: string
  pointsClass: string
}

const FRUIT_HELP_DATA: FruitHelpInfo[] = [
  {
    type: 'apple',
    points: 10,
    cardClass: 'bg-red-50 border-red-200 hover:border-red-400',
    nameClass: 'text-red-700',
    pointsClass: 'text-red-600',
  },
  {
    type: 'blueberry',
    points: 20,
    cardClass: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    nameClass: 'text-blue-700',
    pointsClass: 'text-blue-600',
  },
  {
    type: 'lemon',
    points: 15,
    cardClass: 'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
    nameClass: 'text-yellow-700',
    pointsClass: 'text-yellow-600',
  },
  {
    type: 'watermelon',
    points: 25,
    cardClass: 'bg-green-50 border-green-200 hover:border-green-400',
    nameClass: 'text-green-700',
    pointsClass: 'text-green-600',
  },
]

/** 説明文の一覧に並べるパワーアップの翻訳キー */
const POWER_UP_KEYS = [
  'powerUpSpeedBoost',
  'powerUpScoreMultiplier',
  'powerUpSlowMotion',
  'powerUpMagnet',
  'powerUpShield',
  'powerUpTimeExtension',
  'powerUpExtraFruits',
  'powerUpFreezeTime',
] as const

/**
 * 「🍎 りんご: 〜」「とまるモード: 〜」のような見出し部分を取り除く。
 * 見出しはカードのタイトルとして別に表示するため、本文では重複させない。
 */
function stripLabel(text: string): string {
  return text.replace(/^[^:]+:\s*/, '')
}

function FruitHelpCard({ info, t }: { info: FruitHelpInfo; t: HelpDialogProps['t'] }): React.ReactElement {
  const fruitName = t[info.type as keyof typeof t] as string
  const helpText = stripLabel(t.helpContent[info.type as keyof typeof t.helpContent] as string)

  return (
    <motion.div
      className={`p-4 rounded-[var(--radius-lg)] border-2 hover-lift ${info.cardClass}`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center mb-2">
        <FruitSprite type={info.type} size={40} className="mr-3" decorative />
        <span className={`text-display text-xl font-bold ${info.nameClass}`}>
          {fruitName}
        </span>
      </div>
      <div className="text-base leading-relaxed">
        {helpText}
      </div>
      <div className={`mt-2 text-sm font-semibold ${info.pointsClass}`}>
        {info.points} {t.points}
      </div>
    </motion.div>
  )
}

function KeyboardRow({ keyLabel, description }: { keyLabel: string; description: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-[var(--radius-lg)]">
      <kbd className="px-4 py-2 bg-white border-2 border-gray-300 rounded-[var(--radius-lg)] text-base font-mono shadow-sm shrink-0">
        {keyLabel}
      </kbd>
      <span className="text-base">{description}</span>
    </div>
  )
}

export function HelpDialog({ t }: HelpDialogProps): React.ReactElement {
  return (
    // HUDバーの1要素として並ぶため、自前の全幅バーは持たない
    <div className="shrink-0">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-white/90 shadow px-3 py-1 rounded-[var(--radius-full)] font-bold text-[var(--color-purple)] border-2 border-[var(--color-purple)]"
            data-help-trigger
          >
            <Info className="mr-1 h-4 w-4" /> {t.howToPlay}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-xl)]">
          <DialogHeader>
            <DialogTitle className="text-display text-3xl font-bold text-center" style={{ color: 'var(--color-primary)' }}>
              {t.helpTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">{t.helpDescription}</DialogDescription>
          </DialogHeader>
          <div className="mt-6 text-left text-gray-700">
            {/* アーケードモード（競って遊ぶ側の主役） */}
            <section className="mb-6 p-4 bg-rose-50 rounded-[var(--radius-lg)] border-2 border-rose-200">
              <h4 className="text-display font-bold text-lg text-rose-700 mb-3 text-center">
                {t.helpContent.arcadeTitle}
              </h4>
              <div className="space-y-2 text-base">
                <p>{t.helpContent.arcadeDesc}</p>
                <p>🔥 {t.helpContent.arcadeFever}</p>
                <p>🥇 {t.helpContent.arcadeRank}</p>
              </div>
            </section>

            {/* フルーツの取り方 */}
            <h3 className="text-display text-2xl font-bold mb-4 text-center" style={{ color: 'var(--color-secondary)' }}>
              {t.fruitSection}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {FRUIT_HELP_DATA.map((info) => (
                <FruitHelpCard key={info.type} info={info} t={t} />
              ))}
            </div>

            {/* ゲームモード */}
            <section className="mb-6 p-4 bg-purple-50 rounded-[var(--radius-lg)] border-2 border-purple-200">
              <h4 className="text-display font-bold text-lg text-purple-700 mb-3 text-center">
                {t.modeSection}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-[var(--radius-lg)]">
                  <div className="font-semibold text-purple-600 mb-1">{t.easyMode}</div>
                  <div className="text-sm">{stripLabel(t.helpContent.easyModeDesc)}</div>
                </div>
                <div className="p-3 bg-white rounded-[var(--radius-lg)]">
                  <div className="font-semibold text-purple-600 mb-1">{t.hardModeTitle}</div>
                  <div className="text-sm">{stripLabel(t.helpContent.hardModeDesc)}</div>
                </div>
              </div>
            </section>

            {/* 制限時間と目標 */}
            <section className="mb-6 p-4 bg-orange-50 rounded-[var(--radius-lg)] border-2 border-orange-200">
              <div className="text-center space-y-2">
                <div className="text-lg">⏱️ {t.helpContent.timeLimit}</div>
                <div className="text-lg font-semibold">🎯 {t.helpContent.goal}</div>
              </div>
            </section>

            {/* タッチ操作（スマホ・タブレット） */}
            <section className="mb-6 p-4 bg-teal-50 rounded-[var(--radius-lg)] border-2 border-teal-200">
              <h4 className="text-display font-bold text-lg text-teal-700 mb-3 text-center">
                {t.helpContent.touchTitle}
              </h4>
              <div className="space-y-2">
                {[t.helpContent.touchTap, t.helpContent.touchDoubleTap, t.helpContent.touchLongPress, t.helpContent.touchDrag].map((line) => (
                  <div key={line} className="p-2 bg-white rounded-[var(--radius-lg)] text-base">
                    {line}
                  </div>
                ))}
              </div>
            </section>

            {/* キーボード操作 */}
            <section className="mb-6 p-4 bg-gray-50 rounded-[var(--radius-lg)] border-2 border-gray-200">
              <h4 className="text-display font-bold text-lg text-gray-700 mb-3 text-center">
                {t.helpContent.keyboardTitle}
              </h4>
              <div className="space-y-3">
                <KeyboardRow keyLabel="Space" description={stripLabel(t.helpContent.keyboardSpace)} />
                <KeyboardRow keyLabel="↑↓←→" description={stripLabel(t.helpContent.keyboardArrow)} />
                <KeyboardRow keyLabel="Enter" description={stripLabel(t.helpContent.keyboardEnter)} />
              </div>
            </section>

            {/* パワーアップアイテム */}
            <section className="p-4 bg-pink-50 rounded-[var(--radius-lg)] border-2 border-pink-200">
              <h4 className="text-display font-bold text-lg text-pink-700 mb-3 text-center">
                {t.helpContent.powerUpTitle}
              </h4>
              <p className="text-sm text-gray-600 mb-4 text-center">{t.helpContent.powerUpDesc}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {POWER_UP_KEYS.map((key) => (
                  <div key={key} className="p-3 bg-white rounded-[var(--radius-lg)]">
                    <div className="text-base">{t.helpContent[key]}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
