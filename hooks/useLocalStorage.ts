import React, { useCallback, useSyncExternalStore } from 'react'

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void

// Custom event for same-tab storage updates
const storageEventTarget = new EventTarget()

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Get value from localStorage
  const getSnapshot = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  }, [key])

  // Subscribe to storage changes
  const subscribe = useCallback((onStoreChange: () => void) => {
    // Listen to storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        onStoreChange()
      }
    }

    // Listen to custom events for same-tab updates
    const handleCustomStorageChange = (e: Event) => {
      if ((e as CustomEvent).detail.key === key) {
        onStoreChange()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    storageEventTarget.addEventListener('storage-update', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      storageEventTarget.removeEventListener('storage-update', handleCustomStorageChange)
    }
  }, [key])

  // Get the raw value from localStorage using useSyncExternalStore
  const rawValue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // Parse the stored value
  const storedValue = React.useMemo<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      return rawValue !== null ? JSON.parse(rawValue) : initialValue
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error)
      return initialValue
    }
  }, [rawValue, initialValue, key])

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value

        // Save to localStorage
        if (typeof window !== 'undefined') {
          if (valueToStore === undefined) {
            window.localStorage.removeItem(key)
          } else {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }

          // Dispatch custom event for same-tab updates
          storageEventTarget.dispatchEvent(
            new CustomEvent('storage-update', { detail: { key } })
          )
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}