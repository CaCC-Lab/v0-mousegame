import { useState, useEffect, useCallback, useRef } from 'react'
import { DifficultyManager } from '../lib/difficultyManager'
import { DifficultyLevel, DifficultyConfig } from '../types/difficulty'
import { useLanguage } from './useLanguage'
import { describeDifficulty } from '../lib/difficultyText'

export interface UseDifficultyReturn {
  currentDifficulty: DifficultyLevel
  currentConfig: DifficultyConfig
  availableDifficulties: DifficultyLevel[]
  difficultyDescriptions: Record<DifficultyLevel, string>
  setDifficulty: (difficulty: DifficultyLevel) => void
  getAdjustedGameTime: (baseTime: number) => number
  getAdjustedScore: (baseScore: number) => number
}

export function useDifficulty(): UseDifficultyReturn {
  const { t } = useLanguage()
  const difficultyManagerRef = useRef<DifficultyManager | null>(null)
  const [currentDifficulty, setCurrentDifficultyState] = useState<DifficultyLevel>('normal')
  const [currentConfig, setCurrentConfig] = useState<DifficultyConfig>({
    fruitCount: 10,
    gameSpeed: 1.0,
    timeLimitMultiplier: 1.0,
    fruitSpeedMultiplier: 1.0,
    scoreMultiplier: 1.0,
  })
  const [availableDifficulties, setAvailableDifficulties] = useState<DifficultyLevel[]>(['easy', 'normal', 'hard'])

  useEffect(() => {
    difficultyManagerRef.current = new DifficultyManager()
    updateState()
  }, [])

  const updateState = useCallback(() => {
    if (difficultyManagerRef.current) {
      setCurrentDifficultyState(difficultyManagerRef.current.getCurrentDifficulty())
      setCurrentConfig(difficultyManagerRef.current.getCurrentConfig())
      setAvailableDifficulties(difficultyManagerRef.current.getAvailableDifficulties())
    }
  }, [])

  const setDifficulty = useCallback((difficulty: DifficultyLevel) => {
    if (difficultyManagerRef.current) {
      difficultyManagerRef.current.setDifficulty(difficulty)
      updateState()
    }
  }, [updateState])

  const getAdjustedGameTime = useCallback((baseTime: number) => {
    return difficultyManagerRef.current?.getAdjustedGameTime(baseTime) ?? baseTime
  }, [])

  const getAdjustedScore = useCallback((baseScore: number) => {
    return difficultyManagerRef.current?.getAdjustedScore(baseScore) ?? baseScore
  }, [])

  // Use i18n descriptions
  const difficultyDescriptions: Record<DifficultyLevel, string> = {
    easy: describeDifficulty('easy', t),
    normal: describeDifficulty('normal', t),
    hard: describeDifficulty('hard', t),
  }

  return {
    currentDifficulty,
    currentConfig,
    availableDifficulties,
    difficultyDescriptions,
    setDifficulty,
    getAdjustedGameTime,
    getAdjustedScore,
  }
}