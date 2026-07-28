"use client"

import React, { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Fruit as FruitComponent } from '../Fruit'
import { PowerUp } from '../PowerUp'
import { ParticleContainer } from '../ParticleContainer'
import { Fruit as FruitType, HarvestAnimation, InteractionType, FRUIT_EMOJI } from '@/types/game'
import { PowerUp as PowerUpType } from '@/types/powerup'
import { ParticleEffect } from '@/types/animation'
import type { StreakBonus } from '@/types/gamification'
import { StreakIndicator } from './StreakIndicator'

interface GamePlayAreaProps {
  fruits: FruitType[]
  powerUps: PowerUpType[]
  particles: ParticleEffect[]
  isHardMode: boolean
  selectedFruitIndex: number
  dropAreaText: string
  onFruitClick: (fruit: FruitType, action: InteractionType) => void
  onPowerUpCollect: (powerUpId: string) => void
  onTriggerAnimation: (type: 'fruitCollect' | 'powerUpCollect', x: number, y: number) => void
  onFruitCollected: () => void
  gameAreaRef: React.RefObject<HTMLDivElement>
  streak?: number
  lastStreakBonus?: StreakBonus | null
}

function DraggedFruitOverlay({
  draggedFruit,
  mousePosition,
  gameAreaRect
}: {
  draggedFruit: FruitType | null
  mousePosition: { x: number; y: number }
  gameAreaRect: DOMRect | null
}): React.ReactElement | null {
  if (!draggedFruit || !gameAreaRect) {
    return null
  }

  const sizeClass = draggedFruit.size === 'small' ? 'text-2xl'
    : draggedFruit.size === 'medium' ? 'text-3xl'
    : 'text-4xl'

  return (
    <div
      className={`absolute pointer-events-none select-none animate-wiggle ${sizeClass}`}
      style={{
        left: `${mousePosition.x - gameAreaRect.left}px`,
        top: `${mousePosition.y - gameAreaRect.top}px`,
        zIndex: 20,
        opacity: 0.8,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
      }}
    >
      {FRUIT_EMOJI[draggedFruit.type]}
    </div>
  )
}

function DropArea({ text }: { text: string }): React.ReactElement {
  return (
    <div
      className="drop-area absolute right-0 top-0 bottom-0 w-20 flex justify-center items-center border-l-4 border-dashed border-white/50"
      style={{ background: 'var(--gradient-berry)' }}
    >
      <div className="writing-vertical text-white font-bold text-xl drop-shadow-lg">
        {text}
      </div>
    </div>
  )
}

function HarvestAnimations({
  animations,
  onAnimationComplete
}: {
  animations: HarvestAnimation[]
  onAnimationComplete: (id: number) => void
}): React.ReactElement {
  return (
    <AnimatePresence>
      {animations.map((animation) => (
        <motion.div
          key={animation.id}
          className="absolute text-5xl pointer-events-none select-none"
          style={{ left: `${animation.x}%`, top: `${animation.y}%` }}
          initial={{ scale: 1, opacity: 1, rotate: 0 }}
          animate={{ scale: 2, opacity: 0, y: -50, rotate: 360 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onAnimationComplete={() => onAnimationComplete(animation.id)}
        >
          {FRUIT_EMOJI[animation.type]}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

export function GamePlayArea({
  fruits,
  powerUps,
  particles,
  isHardMode,
  selectedFruitIndex,
  dropAreaText,
  onFruitClick,
  onPowerUpCollect,
  onTriggerAnimation,
  onFruitCollected,
  gameAreaRef,
  streak,
  lastStreakBonus
}: GamePlayAreaProps): React.ReactElement {
  const [draggedFruit, setDraggedFruit] = useState<FruitType | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [harvestAnimations, setHarvestAnimations] = useState<HarvestAnimation[]>([])

  const handleFruitClickWithAnimation = useCallback((fruit: FruitType, action: InteractionType) => {
    const gameArea = gameAreaRef.current
    if (gameArea) {
      const fruitElement = gameArea.querySelector(`[data-fruit-id="${fruit.id}"]`)
      if (fruitElement) {
        const rect = fruitElement.getBoundingClientRect()
        const gameRect = gameArea.getBoundingClientRect()
        const x = rect.left + rect.width / 2 - gameRect.left
        const y = rect.top + rect.height / 2 - gameRect.top
        onTriggerAnimation('fruitCollect', x, y)
        onFruitCollected()
      }
    }
    onFruitClick(fruit, action)
  }, [onFruitClick, onTriggerAnimation, onFruitCollected, gameAreaRef])

  const handlePowerUpCollectWithAnimation = useCallback((powerUpId: string) => {
    const gameArea = gameAreaRef.current
    if (gameArea) {
      const powerUpElement = gameArea.querySelector(`[data-powerup-id="${powerUpId}"]`)
      if (powerUpElement) {
        const rect = powerUpElement.getBoundingClientRect()
        const gameRect = gameArea.getBoundingClientRect()
        const x = rect.left + rect.width / 2 - gameRect.left
        const y = rect.top + rect.height / 2 - gameRect.top
        onTriggerAnimation('powerUpCollect', x, y)
      }
    }
    onPowerUpCollect(powerUpId)
  }, [onPowerUpCollect, onTriggerAnimation, gameAreaRef])

  const handleMouseDown = useCallback((e: React.MouseEvent, fruit: FruitType) => {
    if (e.button === 2) {
      e.preventDefault()
      if (fruit.type === 'lemon') {
        // レモンへの正しい右クリック → アニメーション付き収穫
        handleFruitClickWithAnimation(fruit, 'rightClick')
      } else {
        // AC-5.2a: レモン以外への右クリック → 失敗記録
        onFruitClick(fruit, 'rightClick')
      }
    } else if (e.button === 0 && fruit.type === 'watermelon') {
      setDraggedFruit(fruit)
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [handleFruitClickWithAnimation, onFruitClick])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggedFruit) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [draggedFruit])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggedFruit) {
      const dropArea = gameAreaRef.current?.querySelector('.drop-area')
      if (dropArea) {
        const rect = dropArea.getBoundingClientRect()
        const isInDropArea = e.clientX >= rect.left
          && e.clientX <= rect.right
          && e.clientY >= rect.top
          && e.clientY <= rect.bottom

        if (isInDropArea) {
          handleFruitClickWithAnimation(draggedFruit, 'drop')
        } else {
          // AC-5.2a: ドロップ領域外リリースは失敗記録
          onFruitClick(draggedFruit, 'drop')
        }
      }
      setDraggedFruit(null)
    }
  }, [draggedFruit, handleFruitClickWithAnimation, gameAreaRef])

  const handleAnimationComplete = useCallback((id: number) => {
    setHarvestAnimations(prev => prev.filter(a => a.id !== id))
  }, [])

  // プレイエリアの高さは親（ゲームカード）の余りを受け取る。
  // 固定の 60vh だと、ヘッダーやスコアバーの分だけ「はじめる」ボタンが
  // 画面外へ押し出されてしまうため、flex-1 で残りを埋める形にしている。
  return (
    <div
      ref={gameAreaRef}
      data-testid="game-area"
      className="relative flex-1 min-h-[200px] overflow-hidden select-none bg-pattern-dots"
      style={{ background: 'linear-gradient(180deg, #A8DADC 0%, #4ECDC4 100%)' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {fruits.map((fruit, index) => (
        <FruitComponent
          key={fruit.id}
          fruit={fruit}
          isHardMode={isHardMode}
          isSelected={index === selectedFruitIndex}
          onClick={() => handleFruitClickWithAnimation(fruit, 'click')}
          onDoubleClick={() => handleFruitClickWithAnimation(fruit, 'doubleClick')}
          onMouseDown={(e) => handleMouseDown(e, fruit)}
        />
      ))}

      {powerUps.map((powerUp) => (
        <PowerUp
          key={powerUp.id}
          powerUp={powerUp}
          onClick={handlePowerUpCollectWithAnimation}
        />
      ))}

      <ParticleContainer particles={particles} />

      <DraggedFruitOverlay
        draggedFruit={draggedFruit}
        mousePosition={mousePosition}
        gameAreaRect={gameAreaRef.current?.getBoundingClientRect() ?? null}
      />

      {typeof streak === 'number' && (
        <div className="absolute top-2 right-2 z-10">
          <StreakIndicator streak={streak} lastBonus={lastStreakBonus ?? null} />
        </div>
      )}

      <DropArea text={dropAreaText} />

      <HarvestAnimations
        animations={harvestAnimations}
        onAnimationComplete={handleAnimationComplete}
      />
    </div>
  )
}
