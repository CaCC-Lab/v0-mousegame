import {
  generateFruit,
  generateFruits,
  calculateScore,
  updateFruitPosition,
  isValidHarvestAction,
  formatTime
} from '../gameLogic'
import { GAME_CONFIG, PLAY_AREA_WIDTH } from '@/types/game'

describe('gameLogic', () => {
  describe('generateFruit', () => {
    it('should generate a fruit with valid properties', () => {
      const fruit = generateFruit()
      
      expect(fruit.id).toBeGreaterThanOrEqual(0)
      expect(fruit.id).toBeLessThan(1)
      expect(['apple', 'blueberry', 'lemon', 'watermelon']).toContain(fruit.type)
      expect(['small', 'medium', 'large']).toContain(fruit.size)
      expect(fruit.x).toBeGreaterThanOrEqual(5)
      expect(fruit.x).toBeLessThanOrEqual(PLAY_AREA_WIDTH - 5)
      expect(fruit.y).toBeGreaterThanOrEqual(5)
      expect(fruit.y).toBeLessThanOrEqual(GAME_CONFIG.gameHeight - 5)
      expect(fruit.dx).toBeGreaterThanOrEqual(-15)
      expect(fruit.dx).toBeLessThanOrEqual(15)
      expect(fruit.dy).toBeGreaterThanOrEqual(-15)
      expect(fruit.dy).toBeLessThanOrEqual(15)
    })
  })

  describe('generateFruits', () => {
    it('should generate the specified number of fruits', () => {
      const fruits = generateFruits(5)
      expect(fruits).toHaveLength(5)
      fruits.forEach(fruit => {
        expect(fruit).toHaveProperty('id')
        expect(fruit).toHaveProperty('type')
        expect(fruit).toHaveProperty('size')
        expect(fruit).toHaveProperty('x')
        expect(fruit).toHaveProperty('y')
        expect(fruit).toHaveProperty('dx')
        expect(fruit).toHaveProperty('dy')
      })
    })
  })

  describe('calculateScore', () => {
    it('should return correct score for apple click', () => {
      expect(calculateScore('apple', 'click')).toBe(10)
      expect(calculateScore('apple', 'doubleClick')).toBe(0)
      expect(calculateScore('apple', 'rightClick')).toBe(0)
      expect(calculateScore('apple', 'drop')).toBe(0)
    })

    it('should return correct score for blueberry double click', () => {
      expect(calculateScore('blueberry', 'click')).toBe(0)
      expect(calculateScore('blueberry', 'doubleClick')).toBe(20)
      expect(calculateScore('blueberry', 'rightClick')).toBe(0)
      expect(calculateScore('blueberry', 'drop')).toBe(0)
    })

    it('should return correct score for lemon right click', () => {
      expect(calculateScore('lemon', 'click')).toBe(0)
      expect(calculateScore('lemon', 'doubleClick')).toBe(0)
      expect(calculateScore('lemon', 'rightClick')).toBe(15)
      expect(calculateScore('lemon', 'drop')).toBe(0)
    })

    it('should return correct score for watermelon drop', () => {
      expect(calculateScore('watermelon', 'click')).toBe(0)
      expect(calculateScore('watermelon', 'doubleClick')).toBe(0)
      expect(calculateScore('watermelon', 'rightClick')).toBe(0)
      expect(calculateScore('watermelon', 'drop')).toBe(25)
    })
  })

  describe('updateFruitPosition', () => {
    it('should update fruit position based on velocity', () => {
      const fruit = {
        id: 1,
        type: 'apple' as const,
        size: 'medium' as const,
        x: 50,
        y: 50,
        dx: 10,
        dy: 5
      }
      
      const updatedFruit = updateFruitPosition(fruit, 0.1)
      expect(updatedFruit.x).toBeCloseTo(51)
      expect(updatedFruit.y).toBeCloseTo(50.5)
    })

    it('should bounce off left and right walls', () => {
      const fruit = {
        id: 1,
        type: 'apple' as const,
        size: 'medium' as const,
        x: 0,
        y: 50,
        dx: -10,
        dy: 0
      }
      
      const updatedFruit = updateFruitPosition(fruit, 0.1)
      expect(updatedFruit.dx).toBe(10)
      expect(updatedFruit.x).toBe(0)
    })

    it('should bounce off top and bottom walls', () => {
      const fruit = {
        id: 1,
        type: 'apple' as const,
        size: 'medium' as const,
        x: 50,
        y: 0,
        dx: 0,
        dy: -10
      }
      
      const updatedFruit = updateFruitPosition(fruit, 0.1)
      expect(updatedFruit.dy).toBe(10)
      expect(updatedFruit.y).toBe(0)
    })
  })

  describe('isValidHarvestAction', () => {
    it('should return true for valid harvest actions', () => {
      expect(isValidHarvestAction('apple', 'click')).toBe(true)
      expect(isValidHarvestAction('blueberry', 'doubleClick')).toBe(true)
      expect(isValidHarvestAction('lemon', 'rightClick')).toBe(true)
      expect(isValidHarvestAction('watermelon', 'drop')).toBe(true)
    })

    it('should return false for invalid harvest actions', () => {
      expect(isValidHarvestAction('apple', 'doubleClick')).toBe(false)
      expect(isValidHarvestAction('blueberry', 'click')).toBe(false)
      expect(isValidHarvestAction('lemon', 'drop')).toBe(false)
      expect(isValidHarvestAction('watermelon', 'click')).toBe(false)
    })
  })

  describe('formatTime', () => {
    it('should format seconds to minutes and seconds', () => {
      expect(formatTime(0)).toBe('0分00秒')
      expect(formatTime(59)).toBe('0分59秒')
      expect(formatTime(60)).toBe('1分00秒')
      expect(formatTime(180)).toBe('3分00秒')
      expect(formatTime(125)).toBe('2分05秒')
    })
  })
})
describe('generateFruitForField - 種類の偏りをならす補充（Issue #42 アーケード）', () => {
  const { generateFruitForField } = jest.requireActual<typeof import('@/lib/gameLogic')>('@/lib/gameLogic')

  function makeFruits(types: Array<'apple' | 'blueberry' | 'lemon' | 'watermelon'>) {
    return types.map((type, i) => ({
      id: i,
      type,
      size: 'medium' as const,
      x: 10,
      y: 10,
      dx: 0,
      dy: 0,
    }))
  }

  it('畑にいちばん少ない種類を補充する', () => {
    const field = makeFruits(['watermelon', 'watermelon', 'watermelon', 'apple', 'apple', 'lemon'])
    // ブルーベリーが0個なので必ずブルーベリーが出る
    expect(generateFruitForField(field).type).toBe('blueberry')
  })

  it('畑が空のときも有効なフルーツを返す', () => {
    const fruit = generateFruitForField([])
    expect(['apple', 'blueberry', 'lemon', 'watermelon']).toContain(fruit.type)
  })

  it('同数のときは偏らないよう散らす', () => {
    const field = makeFruits(['apple', 'blueberry', 'lemon', 'watermelon'])
    const seen = new Set(Array.from({ length: 60 }, () => generateFruitForField(field).type))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('位置や速度は通常の生成と同じ範囲に収まる', () => {
    const fruit = generateFruitForField([])
    expect(fruit.x).toBeGreaterThanOrEqual(0)
    expect(fruit.y).toBeGreaterThanOrEqual(0)
    expect(['small', 'medium', 'large']).toContain(fruit.size)
  })

  it('一種類だけ大量にある畑では、その種類は補充されない', () => {
    const field = makeFruits(Array(15).fill('watermelon'))
    const types = Array.from({ length: 30 }, () => generateFruitForField(field).type)
    expect(types).not.toContain('watermelon')
  })
})

describe('generateBalancedFruits - 4種類そろった初期配置（Issue #42 アーケード）', () => {
  const { generateBalancedFruits } = jest.requireActual<typeof import('@/lib/gameLogic')>('@/lib/gameLogic')

  it('指定した数のフルーツを作る', () => {
    expect(generateBalancedFruits(12)).toHaveLength(12)
  })

  it('4個以上なら4種類すべてが畑にある', () => {
    const types = new Set(generateBalancedFruits(12).map(f => f.type))
    expect(types.size).toBe(4)
  })

  it('種類の数がなるべく均等になる', () => {
    const fruits = generateBalancedFruits(12)
    const counts = ['apple', 'blueberry', 'lemon', 'watermelon'].map(
      type => fruits.filter(f => f.type === type).length
    )
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
  })

  it('0個の指定でも壊れない', () => {
    expect(generateBalancedFruits(0)).toEqual([])
  })
})
