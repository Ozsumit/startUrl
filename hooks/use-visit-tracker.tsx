"use client"

import { useCallback } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Website, VisitHistory } from "@/types/website"

export function useVisitTracker() {
  const [visitHistory, setVisitHistory] = useLocalStorage<VisitHistory>("visitHistory", {})

  const trackVisit = useCallback(
    (site: Website) => {
      setVisitHistory((prev) => {
        const newHistory = { ...prev }
        newHistory[site.id] = {
          count: (prev[site.id]?.count || 0) + 1,
          lastVisited: new Date().toISOString(),
        }
        return newHistory
      })
    },
    [setVisitHistory],
  )

  return { trackVisit, visitHistory }
}
