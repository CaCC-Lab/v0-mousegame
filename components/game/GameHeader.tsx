"use client"

import React from 'react'
import { motion } from 'framer-motion'

interface GameHeaderProps {
  title: string
  subtitle: string
}

const HEADER_ANIMATION = {
  initial: { y: -50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.6, type: 'spring', bounce: 0.4 }
}

export function GameHeader({ title, subtitle }: GameHeaderProps): React.ReactElement {
  return (
    <motion.div
      initial={HEADER_ANIMATION.initial}
      animate={HEADER_ANIMATION.animate}
      transition={HEADER_ANIMATION.transition}
      className="text-center mb-6"
    >
      <h1 className="text-display text-5xl md:text-6xl font-bold text-gradient mb-2 drop-shadow-lg">
        {title}
      </h1>
      <p className="text-body text-lg md:text-xl" style={{ color: 'var(--color-purple)' }}>
        {subtitle}
      </p>
    </motion.div>
  )
}
