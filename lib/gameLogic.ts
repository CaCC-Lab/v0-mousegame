import { 
  Fruit, 
  FruitType, 
  FruitSize, 
  InteractionType, 
  GAME_SCORES,
  PLAY_AREA_WIDTH,
  GAME_CONFIG
} from '@/types/game'

export function generateFruit(): Fruit {
  const types: FruitType[] = ['apple', 'blueberry', 'lemon', 'watermelon']
  const sizes: FruitSize[] = ['small', 'medium', 'large']
  
  return {
    id: Math.random(),
    type: types[Math.floor(Math.random() * types.length)],
    size: sizes[Math.floor(Math.random() * sizes.length)],
    x: Math.random() * (PLAY_AREA_WIDTH - 10) + 5,
    y: Math.random() * (GAME_CONFIG.gameHeight - 10) + 5,
    dx: (Math.random() - 0.5) * 30,
    dy: (Math.random() - 0.5) * 30,
  }
}

export function generateFruits(count: number): Fruit[] {
  return Array.from({ length: count }, generateFruit)
}

export function calculateScore(fruitType: FruitType, action: InteractionType): number {
  switch (action) {
    case 'click':
      return fruitType === 'apple' ? GAME_SCORES.apple : 0
    case 'doubleClick':
      return fruitType === 'blueberry' ? GAME_SCORES.blueberry : 0
    case 'rightClick':
      return fruitType === 'lemon' ? GAME_SCORES.lemon : 0
    case 'drop':
      return fruitType === 'watermelon' ? GAME_SCORES.watermelon : 0
    default:
      return 0
  }
}

export function updateFruitPosition(fruit: Fruit, deltaTime: number): Fruit {
  let newX = fruit.x + fruit.dx * deltaTime
  let newY = fruit.y + fruit.dy * deltaTime
  let newDx = fruit.dx
  let newDy = fruit.dy

  if (newX <= 0 || newX >= PLAY_AREA_WIDTH) {
    newDx *= -1
    newX = Math.max(0, Math.min(PLAY_AREA_WIDTH, newX))
  }
  
  if (newY <= 0 || newY >= GAME_CONFIG.gameHeight) {
    newDy *= -1
    newY = Math.max(0, Math.min(GAME_CONFIG.gameHeight, newY))
  }

  return { ...fruit, x: newX, y: newY, dx: newDx, dy: newDy }
}

export function isValidHarvestAction(fruitType: FruitType, action: InteractionType): boolean {
  return calculateScore(fruitType, action) > 0
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`
}