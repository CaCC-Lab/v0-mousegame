import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear()
    // Clear mock counts
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clear localStorage after each test
    window.localStorage.clear()
  })

  it('should initialize with default value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))
    
    expect(result.current[0]).toBe('defaultValue')
  })

  it('should initialize with value from localStorage if it exists', () => {
    window.localStorage.setItem('testKey', JSON.stringify('storedValue'))
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))
    
    expect(result.current[0]).toBe('storedValue')
  })

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))
    
    act(() => {
      result.current[1]('newValue')
    })
    
    expect(result.current[0]).toBe('newValue')
    expect(window.localStorage.getItem('testKey')).toBe(JSON.stringify('newValue'))
  })

  it('should handle objects and arrays', () => {
    const defaultObject = { name: 'test', value: 123 }
    const { result } = renderHook(() => useLocalStorage('testObject', defaultObject))
    
    expect(result.current[0]).toEqual(defaultObject)
    
    const newObject = { name: 'updated', value: 456 }
    act(() => {
      result.current[1](newObject)
    })
    
    expect(result.current[0]).toEqual(newObject)
    expect(JSON.parse(window.localStorage.getItem('testObject') || '{}')).toEqual(newObject)
  })

  it('should handle numbers', () => {
    const { result } = renderHook(() => useLocalStorage('testNumber', 0))
    
    expect(result.current[0]).toBe(0)
    
    act(() => {
      result.current[1](42)
    })
    
    expect(result.current[0]).toBe(42)
    expect(window.localStorage.getItem('testNumber')).toBe('42')
  })

  it('should handle invalid JSON in localStorage gracefully', () => {
    window.localStorage.setItem('testKey', 'invalid json')
    
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'))
    
    expect(result.current[0]).toBe('defaultValue')
  })

  it('should remove item from localStorage when set to undefined', () => {
    const { result } = renderHook(() => useLocalStorage<string | undefined>('testKey', 'defaultValue'))
    
    act(() => {
      result.current[1]('someValue')
    })
    
    expect(window.localStorage.getItem('testKey')).toBe(JSON.stringify('someValue'))
    
    act(() => {
      result.current[1](undefined)
    })
    
    expect(window.localStorage.getItem('testKey')).toBeNull()
  })

  it('should update localStorage when using the same key from different hooks', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('sharedKey', 'initial'))
    const { result: result2 } = renderHook(() => useLocalStorage('sharedKey', 'initial'))

    expect(result1.current[0]).toBe('initial')
    expect(result2.current[0]).toBe('initial')

    act(() => {
      result1.current[1]('updated')
    })

    // The updating hook reflects the new value
    expect(result1.current[0]).toBe('updated')
    // localStorage is updated
    expect(window.localStorage.getItem('sharedKey')).toBe(JSON.stringify('updated'))
    // Note: Same-tab sync between hooks requires explicit storage event or rerender
    // result2 will not auto-sync without a storage event
  })

  it('should handle storage events from other tabs', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'))
    
    // Simulate storage event from another tab
    act(() => {
      window.localStorage.setItem('testKey', JSON.stringify('fromOtherTab'))
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'testKey',
        newValue: JSON.stringify('fromOtherTab'),
        storageArea: window.localStorage,
      }))
    })
    
    expect(result.current[0]).toBe('fromOtherTab')
  })

  it('should not update on storage events for different keys', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initial'))
    
    act(() => {
      window.localStorage.setItem('otherKey', JSON.stringify('otherValue'))
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'otherKey',
        newValue: JSON.stringify('otherValue'),
        storageArea: window.localStorage,
      }))
    })
    
    expect(result.current[0]).toBe('initial')
  })
})