import { useState, useEffect, useCallback, useRef } from 'react'
import { DifficultyManager } from '../lib/difficultyManager'
import { DifficultyLevel, DifficultyConfig } from '../types/difficulty'

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
  const difficultyManagerRef = useRef<DifficultyManager | null>(null)
  const [currentDifficulty, setCurrentDifficultyState] = useState<DifficultyLevel>('normal')
  const [currentConfig, setCurrentConfig] = useState<DifficultyConfig>({
    fruitCount: 10,
    gameSpeed: 1.0,
    timeLimitMultiplier: 1.0,
    fruitSpeedMultiplier: 1.0,
    scoreMultiplier: 1.0,
    description: 'バランスの取れた標準的な難易度です',
  })
  const [availableDifficulties, setAvailableDifficulties] = useState<DifficultyLevel[]>(['easy', 'normal', 'hard'])
  const [difficultyDescriptions, setDifficultyDescriptions] = useState<Record<DifficultyLevel, string>>({
    easy: 'フルーツが少なく、時間に余裕があります',
    normal: 'バランスの取れた標準的な難易度です',
    hard: 'フルーツが多く、時間制限が厳しくなります',
  })

  useEffect(() => {
    difficultyManagerRef.current = new DifficultyManager()
    updateState()
  }, [])

  const updateState = useCallback(() => {
    if (difficultyManagerRef.current) {
      setCurrentDifficultyState(difficultyManagerRef.current.getCurrentDifficulty())
      setCurrentConfig(difficultyManagerRef.current.getCurrentConfig())
      setAvailableDifficulties(difficultyManagerRef.current.getAvailableDifficulties())
      setDifficultyDescriptions(difficultyManagerRef.current.getDifficultyDescriptions())
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