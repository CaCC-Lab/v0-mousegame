import {
  Fruit,
  FruitType,
  FruitSize,
  InteractionType,
  GAME_SCORES,
  PLAY_AREA_WIDTH,
  GAME_CONFIG
} from '@/types/game'

const FRUIT_TYPES: FruitType[] = ['apple', 'blueberry', 'lemon', 'watermelon']
const FRUIT_SIZES: FruitSize[] = ['small', 'medium', 'large']

const INITIAL_VELOCITY_RANGE = 30

/**
 * Generates a random number within the range [0, max).
 */
function randomInRange(max: number): number {
  return Math.random() * max
}

/**
 * Generates a random velocity component.
 */
function randomVelocity(): number {
  return (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE
}

/**
 * Selects a random element from an array.
 */
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Generates a single fruit with random properties.
 *
 * @param type 種類を指定する場合に渡す（省略時はランダム）
 */
export function generateFruit(type?: FruitType): Fruit {
  return {
    id: Math.random(),
    type: type ?? randomElement(FRUIT_TYPES),
    size: randomElement(FRUIT_SIZES),
    x: randomInRange(PLAY_AREA_WIDTH - 10) + 5,
    y: randomInRange(GAME_CONFIG.gameHeight - 10) + 5,
    dx: randomVelocity(),
    dy: randomVelocity(),
  }
}

/**
 * 畑にいまいちばん少ない種類を補充する。
 *
 * 補充を完全なランダムにすると、苦手な操作のフルーツ（例: ドラッグのスイカ）が
 * 取り残されて畑を埋め尽くし、手が止まってしまう。
 * 4種類がいつも畑に揃っているほうが、テンポよく取り続けられる。
 */
export function generateFruitForField(existing: Fruit[]): Fruit {
  const counts = new Map<FruitType, number>(FRUIT_TYPES.map(type => [type, 0]))

  for (const fruit of existing) {
    counts.set(fruit.type, (counts.get(fruit.type) ?? 0) + 1)
  }

  const fewest = Math.min(...FRUIT_TYPES.map(type => counts.get(type) ?? 0))
  const candidates = FRUIT_TYPES.filter(type => (counts.get(type) ?? 0) === fewest)

  return generateFruit(randomElement(candidates))
}

/**
 * Generates multiple fruits.
 */
export function generateFruits(count: number): Fruit[] {
  return Array.from({ length: count }, generateFruit)
}

/**
 * 4種類が均等に並ぶ畑を作る。
 * 最初の畑から全部の操作を試せるようにするため、アーケードの開始時に使う。
 */
export function generateBalancedFruits(count: number): Fruit[] {
  const fruits: Fruit[] = []

  for (let i = 0; i < count; i++) {
    fruits.push(generateFruitForField(fruits))
  }

  return fruits
}

/**
 * Mapping of interaction types to valid fruit types and their scores.
 */
const INTERACTION_SCORE_MAP: Record<InteractionType, { validType: FruitType; score: number }> = {
  click: { validType: 'apple', score: GAME_SCORES.apple },
  doubleClick: { validType: 'blueberry', score: GAME_SCORES.blueberry },
  rightClick: { validType: 'lemon', score: GAME_SCORES.lemon },
  drop: { validType: 'watermelon', score: GAME_SCORES.watermelon },
}

/**
 * Calculates the score for a fruit interaction.
 * Returns 0 if the interaction type doesn't match the fruit type.
 */
export function calculateScore(fruitType: FruitType, action: InteractionType): number {
  const mapping = INTERACTION_SCORE_MAP[action]
  return fruitType === mapping.validType ? mapping.score : 0
}

/**
 * Clamps a value between min and max bounds.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Updates fruit position and handles boundary collisions.
 */
export function updateFruitPosition(fruit: Fruit, deltaTime: number): Fruit {
  let newX = fruit.x + fruit.dx * deltaTime
  let newY = fruit.y + fruit.dy * deltaTime
  let newDx = fruit.dx
  let newDy = fruit.dy

  // Horizontal boundary collision
  if (newX <= 0 || newX >= PLAY_AREA_WIDTH) {
    newDx *= -1
    newX = clamp(newX, 0, PLAY_AREA_WIDTH)
  }

  // Vertical boundary collision
  if (newY <= 0 || newY >= GAME_CONFIG.gameHeight) {
    newDy *= -1
    newY = clamp(newY, 0, GAME_CONFIG.gameHeight)
  }

  return { ...fruit, x: newX, y: newY, dx: newDx, dy: newDy }
}

/**
 * Checks if an interaction is valid for harvesting a fruit.
 */
export function isValidHarvestAction(fruitType: FruitType, action: InteractionType): boolean {
  return calculateScore(fruitType, action) > 0
}

/**
 * Formats time in seconds to a localized string.
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}\u5206${remainingSeconds.toString().padStart(2, '0')}\u79d2`
}
