import { useState, useCallback, useRef, useEffect } from 'react'
import { StageManager } from '../lib/stageManager'
import { Stage } from '../types/stage'
import { HarvestedFruits } from '../types/game'

export function useStage() {
  const managerRef = useRef<StageManager | null>(null)
  
  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new StageManager()
  }

  const [currentStage, setCurrentStage] = useState(() => 
    managerRef.current!.getCurrentStage()
  )
  const [currentStageInfo, setCurrentStageInfo] = useState<Stage | null>(() =>
    managerRef.current!.getStageInfo(managerRef.current!.getCurrentStage())
  )
  const [completedStages, setCompletedStages] = useState<number[]>(() =>
    managerRef.current!.getCompletedStages()
  )
  const [totalScore, setTotalScore] = useState(() =>
    managerRef.current!.getTotalScore()
  )
  const [allStages, setAllStages] = useState<Stage[]>(() =>
    managerRef.current!.getAllStages()
  )

  const updateState = useCallback(() => {
    if (!managerRef.current) return
    
    const current = managerRef.current.getCurrentStage()
    setCurrentStage(current)
    setCurrentStageInfo(managerRef.current.getStageInfo(current))
    setCompletedStages(managerRef.current.getCompletedStages())
    setTotalScore(managerRef.current.getTotalScore())
    setAllStages(managerRef.current.getAllStages())
  }, [])

  const checkStageCompletion = useCallback((
    score: number,
    harvestedFruits: HarvestedFruits
  ): boolean => {
    if (!managerRef.current) return false
    
    const isCompleted = managerRef.current.isStageCompleted(
      currentStage,
      score,
      harvestedFruits
    )
    
    if (isCompleted) {
      managerRef.current.completeStage(currentStage, score)
      updateState()
    }
    
    return isCompleted
  }, [currentStage, updateState])

  const nextStage = useCallback((): boolean => {
    if (!managerRef.current) return false
    
    const moved = managerRef.current.moveToNextStage()
    if (moved) {
      updateState()
    }
    
    return moved
  }, [updateState])

  const selectStage = useCallback((stageNumber: number): boolean => {
    if (!managerRef.current) return false
    
    const selected = managerRef.current.selectStage(stageNumber)
    if (selected) {
      updateState()
    }
    
    return selected
  }, [updateState])

  const reset = useCallback(() => {
    if (!managerRef.current) return
    
    managerRef.current.reset()
    updateState()
  }, [updateState])

  // Update state when manager changes
  useEffect(() => {
    updateState()
  }, [updateState])

  return {
    currentStage,
    currentStageInfo,
    completedStages,
    totalScore,
    allStages,
    checkStageCompletion,
    nextStage,
    selectStage,
    reset
  }
}