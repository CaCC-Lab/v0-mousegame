import React, { useState, useCallback, useEffect } from 'react'

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Always start with initialValue to prevent SSR hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // After hydration, load the actual value from localStorage
  useEffect(() => {
    setIsHydrated(true)
    
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key)
        if (item !== null) {
          setStoredValue(JSON.parse(item))
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error)
      }
    }
  }, [key])

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        // Use functional update to avoid dependency issues
        setStoredValue(currentValue => {
          const valueToStore = value instanceof Function ? value(currentValue) : value
          
          // Save to localStorage only if hydrated
          if (isHydrated && typeof window !== 'undefined') {
            if (valueToStore === undefined) {
              window.localStorage.removeItem(key)
            } else {
              window.localStorage.setItem(key, JSON.stringify(valueToStore))
            }
          }
          
          return valueToStore
        })
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, isHydrated]
  )

  // Listen for changes to localStorage from other tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !isHydrated) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}" from storage event:`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, isHydrated])

  return [storedValue, setValue]
}