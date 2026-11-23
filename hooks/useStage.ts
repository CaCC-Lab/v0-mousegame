import { useState, useCallback, useRef, useEffect } from 'react'
import { StageManager } from '../lib/stageManager'
import { Stage } from '../types/stage'
import { FruitType, HarvestedFruits } from '../types/game'

interface UseStageReturn {
  currentStage: number
  currentStageInfo: Stage | null
  completedStages: number[]
  totalScore: number
  allStages: Stage[]
  checkStageCompletion: (score: number, harvestedFruits: HarvestedFruits) => boolean
  nextStage: () => boolean
  selectStage: (stageNumber: number) => boolean
  /** その果物が出るれんしゅうの面を選び、選んだ面を返す（見つからなければ null） */
  selectStageForFruit: (fruit: FruitType) => Stage | null
  reset: () => void
  isHydrated: boolean
}

export function useStage(): UseStageReturn {
  const managerRef = useRef<StageManager | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentStage, setCurrentStage] = useState(1)
  const [currentStageInfo, setCurrentStageInfo] = useState<Stage | null>(null)
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [allStages, setAllStages] = useState<Stage[]>([])

  const updateState = useCallback(() => {
    if (!managerRef.current) return

    const current = managerRef.current.getCurrentStage()
    setCurrentStage(current)
    setCurrentStageInfo(managerRef.current.getStageInfo(current))
    setCompletedStages(managerRef.current.getCompletedStages())
    setTotalScore(managerRef.current.getTotalScore())
    setAllStages(managerRef.current.getAllStages())
  }, [])

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new StageManager()
    }
    setIsHydrated(true)
    updateState()
  }, [updateState])

  const checkStageCompletion = useCallback((
    score: number,
    harvestedFruits: HarvestedFruits
  ): boolean => {
    if (!managerRef.current || !isHydrated) return false

    const isCompleted = managerRef.current.isStageCompleted(currentStage, score, harvestedFruits)

    if (isCompleted) {
      managerRef.current.completeStage(currentStage, score)
      updateState()
    }

    return isCompleted
  }, [currentStage, updateState, isHydrated])

  const nextStage = useCallback((): boolean => {
    if (!managerRef.current || !isHydrated) return false

    const moved = managerRef.current.moveToNextStage()
    if (moved) updateState()

    return moved
  }, [updateState, isHydrated])

  const selectStage = useCallback((stageNumber: number): boolean => {
    if (!managerRef.current || !isHydrated) return false

    const selected = managerRef.current.selectStage(stageNumber)
    if (selected) updateState()

    return selected
  }, [updateState, isHydrated])

  const selectStageForFruit = useCallback((fruit: FruitType): Stage | null => {
    if (!managerRef.current || !isHydrated) return null

    const selected = managerRef.current.selectStageForFruit(fruit)
    if (selected === null) return null
    updateState()

    return managerRef.current.getStageInfo(selected)
  }, [updateState, isHydrated])

  const reset = useCallback(() => {
    if (!managerRef.current || !isHydrated) return

    managerRef.current.reset()
    updateState()
  }, [updateState, isHydrated])

  return {
    currentStage,
    currentStageInfo,
    completedStages,
    totalScore,
    allStages,
    checkStageCompletion,
    nextStage,
    selectStage,
    selectStageForFruit,
    reset,
    isHydrated
  }
}
