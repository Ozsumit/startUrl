"use client"

import { useState, useEffect, useCallback } from "react"

// Helper to check if IndexedDB is available
const isIndexedDBAvailable = () => {
  try {
    return "indexedDB" in window && window.indexedDB !== null
  } catch (e) {
    return false
  }
}

// Helper to create/open IndexedDB
const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available"))
      return
    }

    const request = indexedDB.open("SafariStartPageDB", 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings")
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// Function to store large data in IndexedDB
export const storeInIndexedDB = async (key: string, value: any): Promise<boolean> => {
  try {
    const db = await openDB()
    return new Promise<boolean>((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put(value, key)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error storing in IndexedDB:", error)
    return false
  }
}

// Function to retrieve large data from IndexedDB
export const getFromIndexedDB = async (key: string): Promise<any> => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error retrieving from IndexedDB:", error)
    return null
  }
}

// Hook for large data storage (like wallpaper images)
export function useLargeStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        setIsLoading(true)
        const storedValue = await getFromIndexedDB(key)
        if (storedValue !== undefined && storedValue !== null) {
          setValue(storedValue)
        }
      } catch (error) {
        console.error("Error loading from IndexedDB:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadValue()
  }, [key])

  // Update function
  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue
        setValue(valueToStore)
        await storeInIndexedDB(key, valueToStore)
        return true
      } catch (error) {
        console.error("Error updating value in IndexedDB:", error)
        return false
      }
    },
    [key, value],
  )

  return [value, updateValue, isLoading] as const
}
