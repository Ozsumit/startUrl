"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import type { ThemeColors } from "@/types/website"

interface ThemeContextType {
  themeColors: ThemeColors
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  themeColors,
}: {
  children: React.ReactNode
  themeColors: ThemeColors
}) {
  // Apply theme colors to CSS variables
  useEffect(() => {
    // Convert hex to RGB for CSS variables
    const hexToRgb = (hex: string) => {
      // Remove # if present
      hex = hex.replace(/^#/, "")

      // Parse hex values
      const bigint = Number.parseInt(hex, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255

      return `${r} ${g} ${b}`
    }

    try {
      // Apply primary color
      if (themeColors.primary) {
        document.documentElement.style.setProperty("--primary", hexToRgb(themeColors.primary))
      }

      // Apply secondary color
      if (themeColors.secondary) {
        document.documentElement.style.setProperty("--secondary", hexToRgb(themeColors.secondary))
      }
    } catch (error) {
      console.error("Error applying theme colors:", error)
    }
  }, [themeColors])

  return <ThemeContext.Provider value={{ themeColors }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
