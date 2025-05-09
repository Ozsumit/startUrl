"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// Maximum size for localStorage items (in bytes)
const MAX_ITEM_SIZE = 2 * 1024 * 1024 // 2MB

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true)
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize state with a function to avoid unnecessary computations
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error("Error reading from localStorage:", error)
      return initialValue
    }
  })

  // Function to safely write to localStorage with error handling
  const safelyWriteToStorage = useCallback((key: string, value: any) => {
    let serialized: string // Declare serialized here
    try {
      // Convert to string to check size
      serialized = JSON.stringify(value)

      // Check if the serialized data is too large
      if (serialized.length > MAX_ITEM_SIZE) {
        throw new Error("Data is too large for localStorage")
      }

      window.localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      if (error instanceof Error) {
        // Handle quota exceeded error
        if (
          error.name === "QuotaExceededError" ||
          error.message.includes("quota") ||
          error.message.includes("storage")
        ) {
          console.error("localStorage quota exceeded. Trying to free up space...")

          // Try to remove the oldest items to free up space
          try {
            // Find items that might be less important
            const keysToTry = ["wallpaper", "visitHistory", "quick-notes"]
            for (const keyToRemove of keysToTry) {
              if (keyToRemove !== key) {
                // Don't remove the key we're trying to set
                window.localStorage.removeItem(keyToRemove)

                // Try writing again
                try {
                  window.localStorage.setItem(key, serialized)
                  console.log(`Removed ${keyToRemove} and successfully saved ${key}`)
                  return true
                } catch (e) {
                  // Still failed, continue to next key
                }
              }
            }
          } catch (e) {
            // Cleanup attempt failed
          }
        }
      }

      console.error("Error writing to localStorage:", error)
      return false
    }
  }, [])

  // Memoize the setValue function to avoid unnecessary re-renders
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value

        // Save state
        setStoredValue(valueToStore)

        // Save to local storage with debounce
        if (typeof window !== "undefined") {
          // Clear any existing timeout
          if (writeTimeoutRef.current) {
            clearTimeout(writeTimeoutRef.current)
          }

          // Set a new timeout to write to localStorage
          writeTimeoutRef.current = setTimeout(() => {
            safelyWriteToStorage(key, valueToStore)
          }, 300) // Debounce writes by 300ms
        }
      } catch (error) {
        console.error("Error in setValue:", error)
      }
    },
    [key, storedValue, safelyWriteToStorage],
  )

  // Sync with localStorage when state changes
  useEffect(() => {
    // Skip the first render since we already initialized from localStorage
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Clear any existing timeout
    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current)
    }

    // Set a new timeout to write to localStorage
    writeTimeoutRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        safelyWriteToStorage(key, storedValue)
      }
    }, 300) // Debounce writes by 300ms

    return () => {
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current)
      }
    }
  }, [key, storedValue, safelyWriteToStorage])

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error("Error parsing localStorage value:", error)
        }
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue] as const
}
