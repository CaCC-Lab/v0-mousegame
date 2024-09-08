"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Timer, Pause, Play, RefreshCw, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { motion, AnimatePresence } from 'framer-motion'

type FruitType = 'apple' | 'blueberry' | 'lemon' | 'watermelon'
type FruitSize = 'small' | 'medium' | 'large'

interface Fruit {
  id: number
  type: FruitType
  size: FruitSize
  x: number
  y: number
  dx: number
  dy: number
}

interface HarvestAnimation {
  id: number
  type: FruitType
  x: number
  y: number
}

const fruitEmoji: Record<FruitType, string> = {
  apple: '🍎',
  blueberry: '🫐',
  lemon: '🍋',
  watermelon: '🍉',
}

const GAME_WIDTH = 100
const GAME_HEIGHT = 100
const DROP_AREA_WIDTH = 16
const PLAY_AREA_WIDTH = GAME_WIDTH - DROP_AREA_WIDTH
const FRUIT_COUNT = 10

export function FruitHarvestGame() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes in seconds
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [draggedFruit, setDraggedFruit] = useState<Fruit | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [harvestedFruits, setHarvestedFruits] = useState<Record<FruitType, number>>({
    apple: 0,
    blueberry: 0,
    lemon: 0,
    watermelon: 0,
  })
  const [isHardMode, setIsHardMode] = useState(false)
  const [harvestAnimations, setHarvestAnimations] = useState<HarvestAnimation[]>([])
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const lastUpdateTimeRef = useRef<number>(0)

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(180)
    setHarvestedFruits({
      apple: 0,
      blueberry: 0,
      lemon: 0,
      watermelon: 0,
    })
    generateFruits(FRUIT_COUNT)
  }, [])

  const pauseGame = useCallback(() => {
    setGameState(prevState => prevState === 'playing' ? 'paused' : 'playing')
  }, [])

  const resetGame = useCallback(() => {
    setGameState('idle')
    setScore(0)
    setTimeLeft(180)
    setFruits([])
    setDraggedFruit(null)
    setHarvestedFruits({
      apple: 0,
      blueberry: 0,
      lemon: 0,
      watermelon: 0,
    })
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const generateFruit = useCallback((): Fruit => {
    const type = ['apple', 'blueberry', 'lemon', 'watermelon'][Math.floor(Math.random() * 4)] as FruitType
    const size = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as FruitSize
    return {
      id: Math.random(),
      type,
      size,
      x: Math.random() * (PLAY_AREA_WIDTH - 10) + 5,
      y: Math.random() * (GAME_HEIGHT - 10) + 5,
      dx: (Math.random() - 0.5) * 30,
      dy: (Math.random() - 0.5) * 30,
    }
  }, [])

  const generateFruits = useCallback((count: number) => {
    const newFruits = Array.from({ length: count }, generateFruit)
    setFruits(newFruits)
  }, [generateFruit])

  const handleFruitInteraction = useCallback((fruit: Fruit, action: 'click' | 'doubleClick' | 'rightClick' | 'drop') => {
    if (gameState !== 'playing') return

    let points = 0
    switch (action) {
      case 'click':
        if (fruit.type === 'apple') points = 10
        break
      case 'doubleClick':
        if (fruit.type === 'blueberry') points = 20
        break
      case 'rightClick':
        if (fruit.type === 'lemon') points = 15
        break
      case 'drop':
        if (fruit.type === 'watermelon') points = 25
        break
    }

    if (points > 0) {
      setScore(prevScore => prevScore + points)
      setHarvestedFruits(prev => ({
        ...prev,
        [fruit.type]: prev[fruit.type] + 1
      }))
      setFruits(prevFruits => {
        const updatedFruits = prevFruits.filter(f => f.id !== fruit.id)
        const newFruit = generateFruit()
        return [...updatedFruits, newFruit]
      })
      setHarvestAnimations(prev => [...prev, { id: Math.random(), type: fruit.type, x: fruit.x, y: fruit.y }])
    }
  }, [gameState, generateFruit])

  const handleMouseDown = useCallback((e: React.MouseEvent, fruit: Fruit) => {
    if (e.button === 2 && fruit.type === 'lemon') {
      e.preventDefault()
      handleFruitInteraction(fruit, 'rightClick')
    } else if (fruit.type === 'watermelon') {
      setDraggedFruit(fruit)
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }, [handleFruitInteraction])

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
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          handleFruitInteraction(draggedFruit, 'drop')
        }
      }
      setDraggedFruit(null)
    }
  }, [draggedFruit, handleFruitInteraction])

  const moveFruits = useCallback(() => {
    if (gameState !== 'playing' || !isHardMode) return

    const now = performance.now()
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000 // Convert to seconds
    lastUpdateTimeRef.current = now

    setFruits(prevFruits => 
      prevFruits.map(fruit => {
        let newX = fruit.x + fruit.dx * deltaTime
        let newY = fruit.y + fruit.dy * deltaTime

        if (newX <= 0 || newX >= PLAY_AREA_WIDTH) {
          fruit.dx *= -1
          newX = Math.max(0, Math.min(PLAY_AREA_WIDTH, newX))
        }
        if (newY <= 0 || newY >= GAME_HEIGHT) {
          fruit.dy *= -1
          newY = Math.max(0, Math.min(GAME_HEIGHT, newY))
        }

        return { ...fruit, x: newX, y: newY }
      })
    )

    animationFrameRef.current = requestAnimationFrame(moveFruits)
  }, [gameState, isHardMode])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1)
      }, 1000)

      if (isHardMode) {
        lastUpdateTimeRef.current = performance.now()
        animationFrameRef.current = requestAnimationFrame(moveFruits)
      }
    } else if (timeLeft === 0) {
      setGameState('idle')
      if (score > highScore) {
        setHighScore(score)
      }
    }
    return () => {
      clearInterval(timer)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, timeLeft, score, highScore, isHardMode, moveFruits])

  const fruitElements = useMemo(() => {
    return fruits.map(fruit => (
      <motion.div
        key={fruit.id}
        className={`absolute cursor-pointer select-none
          ${fruit.size === 'small' ? 'text-2xl' :
            fruit.size === 'medium' ? 'text-3xl' :
            'text-4xl'}`}
        style={{
          left: `${fruit.x}%`,
          top: `${fruit.y}%`,
          zIndex: draggedFruit?.id === fruit.id ? 10 : 1,
          pointerEvents: draggedFruit ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
        animate={isHardMode ? { x: `${fruit.x}%`, y: `${fruit.y}%` } : {}}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        onClick={() => handleFruitInteraction(fruit, 'click')}
        onDoubleClick={() => handleFruitInteraction(fruit, 'doubleClick')}
        onMouseDown={(e) => handleMouseDown(e, fruit)}
      >
        {fruitEmoji[fruit.type]}
      </motion.div>
    ))
  }, [fruits, isHardMode, draggedFruit, handleFruitInteraction, handleMouseDown])

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Game Information Area */}
        <div className="bg-gray-200 p-4 flex justify-between items-center">
          <div className="text-xl font-bold">得点: {score}</div>
          <div className="text-xl font-bold flex items-center">
            <Timer className="mr-2" />
            {Math.floor(timeLeft / 60)}分{(timeLeft % 60).toString().padStart(2, '0')}秒
          </div>
          <div className="text-sm">最高得点: {highScore}</div>
        </div>

        {/* Game Instructions */}
        <div className="bg-blue-100 p-4 text-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Info className="mr-2 h-4 w-4" /> あそびかた
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>フルーツハーベストゲームのあそびかた</DialogTitle>
                <DialogDescription>
                  <ul className="list-disc list-inside space-y-2 mt-4 text-left">
                    <li>🍎 りんご: クリックして収穫</li>
                    <li>🫐 ブルーベリー: ダブルクリックして収穫</li>
                    <li>🍋 レモン: 右クリックして収穫</li>
                    <li>🍉 スイカ: ドラッグして右側のエリアにドロップ</li>
                    <li>むずかしいモード: フルーツが動き回ります</li>
                    <li>かんたんモード: フルーツは動きません</li>
                    <li>制限時間は3分間です</li>
                    <li>たくさんのフルーツを収穫して高得点を目指そう！</li>
                  </ul>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        {/* Harvested Fruits Area */}
        <div className="bg-green-100 p-4 flex justify-around items-center">
          {Object.entries(harvestedFruits).map(([fruit, count]) => (
            <div key={fruit} className="flex items-center">
              <span className="text-2xl mr-2">{fruitEmoji[fruit as FruitType]}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>

        {/* Game Play Area */}
        <div
          ref={gameAreaRef}
          className="relative h-[60vh] bg-green-300 overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          {fruitElements}
          {draggedFruit && (
            <div
              className={`absolute pointer-events-none select-none
                ${draggedFruit.size === 'small' ? 'text-2xl' :
                  draggedFruit.size === 'medium' ? 'text-3xl' :
                  'text-4xl'}`}
              style={{
                left: `${mousePosition.x - (gameAreaRef.current?.getBoundingClientRect().left || 0)}px`,
                top: `${mousePosition.y - (gameAreaRef.current?.getBoundingClientRect().top || 0)}px`,
                zIndex: 20,
                opacity: 0.7,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
              }}
            >
              {fruitEmoji[draggedFruit.type]}
            </div>
          )}
          <div className="drop-area absolute right-0 top-0 bottom-0 w-16 bg-yellow-200 border-l-2 border-yellow-400 flex justify-center items-center">
            <div className="writing-vertical text-yellow-800 font-bold text-lg">
              ドロップエリア
            </div>
          </div>
          <AnimatePresence>
            {harvestAnimations.map((animation) => (
              <motion.div
                key={animation.id}
                className="absolute text-4xl pointer-events-none select-none"
                style={{ left: `${animation.x}%`, top: `${animation.y}%` }}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0, y: -50 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                onAnimationComplete={() => {
                  setHarvestAnimations(prev => prev.filter(a => a.id !== animation.id))
                }}
              >
                {fruitEmoji[animation.type]}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Control Area */}
        <div className="bg-gray-200 p-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <Button
              onClick={startGame}
              disabled={gameState === 'playing'}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Play className="mr-2 h-4 w-4" /> はじめる
            </Button>
            <Button
              onClick={pauseGame}
              disabled={gameState === 'idle'}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {gameState === 'playing' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {gameState === 'playing' ? 'ちゅうだん' : 'さいかい'}
            </Button>
            <Button
              onClick={resetGame}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> リセット
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hard-mode"
              checked={isHardMode}
              onCheckedChange={setIsHardMode}
            />
            <Label htmlFor="hard-mode" className="text-sm">むずかしいモード</Label>
          </div>
        </div>
      </div>
    </div>
  )
}