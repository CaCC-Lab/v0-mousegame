import React from 'react'
import { Stage } from '../types/stage'
import { Button } from './ui/button'
import { X, Lock, CheckCircle, Star } from 'lucide-react'

interface StageSelectorProps {
  stages: Stage[]
  currentStage: number
  onSelectStage: (stageNumber: number) => void
  onClose: () => void
}

export function StageSelector({
  stages,
  currentStage,
  onSelectStage,
  onClose
}: StageSelectorProps) {
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
      return `${targetFruits.total}個`
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">ステージ選択</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="閉じる"
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
              aria-label={`ステージ ${stage.number}: ${stage.name}`}
              aria-disabled={!stage.unlocked}
              className={`
                p-4 rounded-lg border-2 transition-all cursor-pointer
                ${stage.unlocked
                  ? 'hover:shadow-lg transform hover:scale-105'
                  : 'opacity-50 cursor-not-allowed'
                }
                ${stage.number === currentStage
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                  : 'border-gray-200 dark:border-gray-600'
                }
                ${stage.completed
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-white dark:bg-gray-700'
                }
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold dark:text-white">
                  ステージ {stage.number}
                </h3>
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

              <h4 className="font-medium mb-2 dark:text-white">{stage.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {stage.description}
              </p>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">目標スコア:</span>
                  <span className="font-medium dark:text-white">{stage.targetScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">目標フルーツ:</span>
                  <span className="font-medium dark:text-white">
                    {formatFruitTargets(stage.targetFruits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">制限時間:</span>
                  <span className="font-medium dark:text-white">{stage.timeLimit}秒</span>
                </div>
              </div>

              {stage.completed && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      ✅ クリア済み
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      ハイスコア: {stage.highScore}
                    </span>
                  </div>
                </div>
              )}

              {!stage.unlocked && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    🔒 ロック中
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            閉じる
          </Button>
        </div>
      </div>
    </div>
  )
}