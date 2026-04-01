import React from 'react'
import { Stage } from '../types/stage'
import { Button } from './ui/button'
import { X, Lock, CheckCircle, Star } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { StageStarData } from '@/types/gamification'

interface StageSelectorProps {
  stages: Stage[]
  currentStage: number
  /** ステージごとの獲得済み星（ゲーミフィケーション） */
  stageStars?: StageStarData
  onSelectStage: (stageNumber: number) => void
  onClose: () => void
}

export function StageSelector({
  stages,
  currentStage,
  stageStars,
  onSelectStage,
  onClose
}: StageSelectorProps) {
  const { t } = useLanguage()
  
  // Get translated stage name and description
  const getStageTranslation = (stageNumber: number) => {
    const stageKey = `stage${stageNumber}` as keyof typeof t.stages
    return t.stages[stageKey] || { name: '', description: '' }
  }
  const handleStageClick = (stage: Stage) => {
    if (stage.unlocked) {
      onSelectStage(stage.number)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, stage: Stage) => {
    if ((event.key === 'Enter' || event.key === ' ') && stage.unlocked) {
      event.preventDefault()
      onSelectStage(stage.number)
    }
  }

  const formatFruitTargets = (targetFruits: Stage['targetFruits']) => {
    if (targetFruits.total) {
      return `${targetFruits.total} ${t.pieces}`
    }
    
    const targets = []
    if (targetFruits.apple) targets.push(`🍎 ${targetFruits.apple}`)
    if (targetFruits.blueberry) targets.push(`🫐 ${targetFruits.blueberry}`)
    if (targetFruits.lemon) targets.push(`🍋 ${targetFruits.lemon}`)
    if (targetFruits.watermelon) targets.push(`🍉 ${targetFruits.watermelon}`)
    
    return targets.join(', ')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t.stageSelect}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage) => (
            <div
              key={stage.number}
              role="button"
              tabIndex={0}
              onClick={() => handleStageClick(stage)}
              onKeyDown={(e) => handleKeyDown(e, stage)}
              aria-label={`${t.stage} ${stage.number}: ${getStageTranslation(stage.number).name}`}
              aria-disabled={!stage.unlocked}
              className={`
                p-4 rounded-lg border-2 transition-all cursor-pointer
                ${stage.unlocked
                  ? 'hover:shadow-lg transform hover:scale-105'
                  : 'opacity-50 cursor-not-allowed'
                }
                ${stage.number === currentStage
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                  : 'border-gray-200'
                }
                ${stage.completed
                  ? 'bg-green-50'
                  : 'bg-white'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="text-lg font-semibold">
                  {t.stage} {stage.number}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  {stageStars && typeof stageStars[stage.number] === 'number' && stageStars[stage.number]! > 0 && (
                    <span
                      data-testid={`stage-stars-${stage.number}`}
                      className="text-yellow-500 text-sm font-medium"
                      aria-label={`stage ${stage.number} stars ${stageStars[stage.number]}`}
                    >
                      {'★'.repeat(stageStars[stage.number]!)}
                    </span>
                  )}
                  {stage.unlocked ? (
                    stage.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Star className="w-5 h-5 text-yellow-500" />
                    )
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              <h4 className="font-medium mb-2">{getStageTranslation(stage.number).name}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {getStageTranslation(stage.number).description}
              </p>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.targetScore}:</span>
                  <span className="font-medium">{stage.targetScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.targetFruits}:</span>
                  <span className="font-medium">
                    {formatFruitTargets(stage.targetFruits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t.timeLimit}:</span>
                  <span className="font-medium">{stage.timeLimit} {t.seconds}</span>
                </div>
              </div>

              {stage.completed && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      {t.cleared}
                    </span>
                    <span className="text-gray-600">
                      {t.highScore} {stage.highScore}
                    </span>
                  </div>
                </div>
              )}

              {!stage.unlocked && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    {t.locked}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  )
}