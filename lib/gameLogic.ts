import {
  Fruit,
  FruitType,
  FruitSize,
  InteractionType,
  GAME_SCORES,
  PLAY_AREA_WIDTH,
  GAME_CONFIG,
  PLACEMENT_CONFIG,
} from '@/types/game'

const FRUIT_TYPES: FruitType[] = ['apple', 'blueberry', 'lemon', 'watermelon']
const FRUIT_SIZES: FruitSize[] = ['small', 'medium', 'large']

const INITIAL_VELOCITY_RANGE = 30

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

/** 果物が画面上で占める範囲（プレイエリアに対する百分率） */
export interface Footprint {
  left: number
  top: number
  right: number
  bottom: number
}

/** 果物の大きさを百分率で見積もる（基準は PLACEMENT_CONFIG.referenceAreaPx） */
function footprintSize(size: Fruit['size']): { width: number; height: number } {
  const px = PLACEMENT_CONFIG.fruitSizePx[size]
  return {
    width: (px / PLACEMENT_CONFIG.referenceAreaPx.width) * 100,
    height: (px / PLACEMENT_CONFIG.referenceAreaPx.height) * 100,
  }
}

export function fruitFootprint(fruit: Pick<Fruit, 'x' | 'y' | 'size'>): Footprint {
  const { width, height } = footprintSize(fruit.size)
  return { left: fruit.x, top: fruit.y, right: fruit.x + width, bottom: fruit.y + height }
}

/** 2つの範囲が gap 以内に近づいているか（接しているだけでも近すぎれば重なり扱い） */
export function footprintsOverlap(a: Footprint, b: Footprint, gap = 0): boolean {
  return a.left < b.right + gap && b.left < a.right + gap && a.top < b.bottom + gap && b.top < a.bottom + gap
}

function overlapArea(a: Footprint, b: Footprint): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * 既存の果物・凡例・カウンター・ドロップエリアと重ならない位置を選ぶ（docs/game-spec.md §3）。
 * 空きが見つからなければ、試した中で最も重なりの少ない位置を返す（果物が出ないよりはよい）。
 */
function findPlacement(size: Fruit['size'], existing: readonly Fruit[]): { x: number; y: number } {
  const { width, height } = footprintSize(size)
  const minX = PLACEMENT_CONFIG.minLeftPercent
  const maxX = PLAY_AREA_WIDTH - width
  const minY = PLACEMENT_CONFIG.reservedTopPercent
  const maxY = GAME_CONFIG.gameHeight - PLACEMENT_CONFIG.reservedBottomPercent - height
  const others = existing.map(fruitFootprint)

  let best: { x: number; y: number } = { x: minX, y: minY }
  let bestOverlap = Infinity
  for (let attempt = 0; attempt < PLACEMENT_CONFIG.maxAttempts; attempt++) {
    const x = minX + Math.random() * (maxX - minX)
    const y = minY + Math.random() * (maxY - minY)
    const candidate = { left: x, top: y, right: x + width, bottom: y + height }
    if (!others.some((o) => footprintsOverlap(candidate, o, PLACEMENT_CONFIG.gapPercent))) {
      return { x, y }
    }
    const total = others.reduce((sum, o) => sum + overlapArea(candidate, o), 0)
    if (total < bestOverlap) {
      bestOverlap = total
      best = { x, y }
    }
  }
  return best
}

/**
 * Generates a single fruit with random properties.
 *
 * @param type 種類を指定する場合に渡す（省略時はランダム）
 * @param existing いま畑にある果物。これと重ならない位置に置く
 */
export function generateFruit(type?: FruitType, existing: readonly Fruit[] = []): Fruit {
  const size = randomElement(FRUIT_SIZES)
  const { x, y } = findPlacement(size, existing)
  return {
    id: Math.random(),
    type: type ?? randomElement(FRUIT_TYPES),
    size,
    x,
    y,
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

  return generateFruit(randomElement(candidates), existing)
}

/**
 * Generates multiple fruits.（互いに重ならないよう1つずつ置く）
 */
export function generateFruits(count: number, existing: readonly Fruit[] = []): Fruit[] {
  const fruits: Fruit[] = []
  for (let i = 0; i < count; i++) {
    fruits.push(generateFruit(undefined, [...existing, ...fruits]))
  }
  return fruits
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
 * そのフルーツを取るのに必要な操作を返す。
 *
 * 誤操作したときに「正解は何だったか」をその場で伝えるために使う。
 * 得点計算と同じ対応表を逆に引くので、ヒントと実際の判定がずれない。
 */
export function getRequiredInteraction(fruitType: FruitType): InteractionType {
  const entry = Object.entries(INTERACTION_SCORE_MAP).find(
    ([, mapping]) => mapping.validType === fruitType
  )
  return entry![0] as InteractionType
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

/**
 * その操作で取れるフルーツを返す。getRequiredInteraction の逆引き。
 *
 * 「つぎはブルーベリーのダブルクリックを」のように、
 * 操作だけでなく対象のフルーツもあわせて伝えるために使う。
 */
export function getRequiredFruit(action: InteractionType): FruitType {
  return INTERACTION_SCORE_MAP[action].validType
}
