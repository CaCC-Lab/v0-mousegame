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

interface HelpDialogProps {
  t: {
    howToPlay: string
    helpTitle: string
    helpDescription: string
    fruitSection: string
    apple: string
    blueberry: string
    lemon: string
    watermelon: string
    points: string
    helpContent: {
      apple: string
      blueberry: string
      lemon: string
      watermelon: string
    }
  }
}

interface FruitHelpInfo {
  type: string
  emoji: string
  color: string
  points: number
}

const FRUIT_HELP_DATA: FruitHelpInfo[] = [
  { type: 'apple', emoji: '\ud83c\udf4e', color: 'red', points: 10 },
  { type: 'blueberry', emoji: '\ud83e\uded0', color: 'blue', points: 20 },
  { type: 'lemon', emoji: '\ud83c\udf4b', color: 'yellow', points: 15 },
  { type: 'watermelon', emoji: '\ud83c\udf49', color: 'green', points: 25 },
]

function FruitHelpCard({ info, t }: { info: FruitHelpInfo; t: HelpDialogProps['t'] }): React.ReactElement {
  const fruitName = t[info.type as keyof typeof t] as string
  const helpText = (t.helpContent[info.type as keyof typeof t.helpContent] as string).replace(/^[^:]+:\s*/, '')

  return (
    <motion.div
      className={`p-4 bg-${info.color}-50 rounded-[var(--radius-lg)] border-2 border-${info.color}-200 hover:border-${info.color}-400 hover-lift`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center mb-2">
        <span className="text-4xl mr-3">{info.emoji}</span>
        <span className={`text-display text-xl font-bold text-${info.color}-700`}>
          {fruitName}
        </span>
      </div>
      <div className="text-base leading-relaxed">
        {helpText}
      </div>
      <div className={`mt-2 text-sm text-${info.color}-600 font-semibold`}>
        {info.points} {t.points}
      </div>
    </motion.div>
  )
}

export function HelpDialog({ t }: HelpDialogProps): React.ReactElement {
  return (
    <div className="bg-gradient-playful p-4 text-center">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-white hover:bg-white/90 shadow-lg px-6 py-3 rounded-[var(--radius-full)] font-bold text-[var(--color-purple)] border-2 border-[var(--color-purple)] hover-lift"
            data-help-trigger
          >
            <Info className="mr-2 h-5 w-5" /> {t.howToPlay}
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
            <h3 className="text-display text-2xl font-bold mb-4 text-center" style={{ color: 'var(--color-secondary)' }}>
              {t.fruitSection}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {FRUIT_HELP_DATA.map((info) => (
                <FruitHelpCard key={info.type} info={info} t={t} />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
