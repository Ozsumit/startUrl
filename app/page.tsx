"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Plus, Settings, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocalStorage } from "@/hooks/use-local-storage"
import WebsiteGrid from "@/components/website-grid"
import AddWebsiteModal from "@/components/add-website-modal"
import SettingsModal from "@/components/settings-modal"
import FrequentlyVisited from "@/components/frequently-visited"
import RecentlyVisited from "@/components/recently-visited"
import QuickNotes from "@/components/quick-notes"
import WeatherWidget from "@/components/weather-widget"
import type { Website, SectionVisibility, ThemeColors } from "@/types/website"
import { Toaster } from "@/components/ui/toaster"
import { getFromIndexedDB } from "@/hooks/use-storage"
import { ThemeProvider } from "@/components/theme-provider"

export default function HomePage() {
  const [search, setSearch] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [websites, setWebsites] = useLocalStorage<Website[]>("websites", [])
  const [isAddWebsiteModalOpen, setIsAddWebsiteModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [wallpaperFromIndexedDB, setWallpaperFromIndexedDB] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

  // Settings state
  const [wallpaper, setWallpaper] = useLocalStorage<string>("wallpaper", "")
  const [wallpaperOpacity, setWallpaperOpacity] = useLocalStorage<number>("wallpaperOpacity", 0.7)
  const [clockFormat, setClockFormat] = useLocalStorage<string>("clockFormat", "24h")
  const [themeColors, setThemeColors] = useLocalStorage<ThemeColors>("themeColors", {
    primary: "#3b82f6", // Default blue
    secondary: "#10b981", // Default green
  })
  const [sectionVisibility, setSectionVisibility] = useLocalStorage<SectionVisibility>("sectionVisibility", {
    yourWebsites: true,
    frequentlyVisited: true,
    recentlyVisited: true,
    quickNotes: true,
    weather: true,
  })

  // Load wallpaper from IndexedDB if needed
  useEffect(() => {
    if (wallpaper === "indexeddb:wallpaper") {
      getFromIndexedDB("wallpaper")
        .then((data) => {
          if (data && typeof data === "string") {
            setWallpaperFromIndexedDB(data)
          }
        })
        .catch((error) => {
          console.error("Error loading wallpaper from IndexedDB:", error)
        })
    } else {
      setWallpaperFromIndexedDB(null)
    }
  }, [wallpaper])

  // Check online status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", handleOnlineStatus)
    window.addEventListener("offline", handleOnlineStatus)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnlineStatus)
      window.removeEventListener("offline", handleOnlineStatus)
    }
  }, [])

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: clockFormat === "12h",
      })
      const dateString = now.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      })

      setCurrentTime(timeString)
      setCurrentDate(dateString)
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)

    return () => clearInterval(interval)
  }, [clockFormat])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      // Check if search is a URL
      const isUrl = search.includes(".")
      if (isUrl) {
        const hasProtocol = search.startsWith("http://") || search.startsWith("https://")
        window.location.href = hasProtocol ? search : `https://${search}`
      } else {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(search)}`
      }
    }
  }

  const handleAddWebsite = (website: Website) => {
    setWebsites((prev) => [...prev, website])
    setIsAddWebsiteModalOpen(false)
  }

  const handleRemoveWebsite = (id: string) => {
    setWebsites((prev) => prev.filter((website) => website.id !== id))
  }

  const handleEditWebsite = (id: string, updatedWebsite: Partial<Website>) => {
    setWebsites((prev) => prev.map((website) => (website.id === id ? { ...website, ...updatedWebsite } : website)))
  }

  // Determine which wallpaper to use
  const effectiveWallpaper = wallpaper === "indexeddb:wallpaper" ? wallpaperFromIndexedDB : wallpaper

  return (
    <ThemeProvider themeColors={themeColors}>
      <div
        className="min-h-screen w-full bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center px-4 py-8"
        style={{
          backgroundImage: effectiveWallpaper ? `url(${effectiveWallpaper})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for wallpaper */}
        {effectiveWallpaper && (
          <div className="absolute inset-0 z-0" style={{ backgroundColor: `rgba(0, 0, 0, ${wallpaperOpacity})` }} />
        )}

        {/* Offline indicator */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-900/80 text-yellow-100 py-1 px-4 text-center text-sm z-50">
            You are currently offline. Some features may be limited.
          </div>
        )}

        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button
            variant="outline"
            size="icon"
            className="bg-background/40 backdrop-blur-sm hover:bg-background/60"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>

        <div className="max-w-5xl w-full mx-auto flex flex-col items-center justify-center mt-16 mb-12 z-10 relative">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-foreground mb-2">{currentTime}</h1>
            <p className="text-xl text-muted-foreground">{currentDate}</p>
          </div>

          <form onSubmit={handleSearch} className="w-full max-w-xl mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search-input"
                type="text"
                placeholder="Search the web or enter URL"
                className="pl-10 h-12 bg-background/40  border-muted"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>

          <div className="w-full space-y-8">
            {sectionVisibility.yourWebsites && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Your Websites</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background/40 backdrop-blur-sm hover:bg-background/60"
                    onClick={() => setIsAddWebsiteModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Website
                  </Button>
                </div>
                <WebsiteGrid websites={websites} onRemove={handleRemoveWebsite} onEdit={handleEditWebsite} />
              </div>
            )}

            {sectionVisibility.frequentlyVisited && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Frequently Visited</h2>
                <FrequentlyVisited />
              </div>
            )}

            {sectionVisibility.recentlyVisited && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Recently Visited</h2>
                <RecentlyVisited />
              </div>
            )}

            {sectionVisibility.weather && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Weather</h2>
                <WeatherWidget />
              </div>
            )}

            {sectionVisibility.quickNotes && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Quick Notes</h2>
                <QuickNotes />
              </div>
            )}
          </div>
        </div>


        <AddWebsiteModal
          isOpen={isAddWebsiteModalOpen}
          onClose={() => setIsAddWebsiteModalOpen(false)}
          onAdd={handleAddWebsite}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          wallpaper={wallpaper}
          setWallpaper={setWallpaper}
          wallpaperOpacity={wallpaperOpacity}
          setWallpaperOpacity={setWallpaperOpacity}
          clockFormat={clockFormat}
          setClockFormat={setClockFormat}
          sectionVisibility={sectionVisibility}
          setSectionVisibility={setSectionVisibility}
          themeColors={themeColors}
          setThemeColors={setThemeColors}
        />

        <Toaster />
      </div>
    </ThemeProvider>
  )
}
