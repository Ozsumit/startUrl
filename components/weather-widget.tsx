"use client"

import type React from "react"

import { useEffect, useState, useCallback, memo } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Cloud, CloudRain, CloudSnow, Loader2, MapPin, Search, Sun, Wind, RefreshCw } from "lucide-react"

interface WeatherData {
  location: string
  temperature: number
  condition: string
  icon: string
  humidity: number
  windSpeed: number
  lastUpdated: string
}

function WeatherWidget() {
  const [weather, setWeather] = useLocalStorage<WeatherData | null>("weather-data", null)
  const [location, setLocation] = useLocalStorage<string>("weather-location", "")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)

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

  // Mock weather API call
  const fetchWeather = useCallback(
    async (loc: string) => {
      setIsLoading(true)
      setError(null)

      try {
        if (!isOnline) {
          throw new Error("You are offline. Weather data cannot be updated.")
        }

        // In a real app, you would call a weather API here
        // This is a mock implementation
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock weather data
        const conditions = ["Clear", "Partly Cloudy", "Cloudy", "Rain", "Snow", "Windy"]
        const condition = conditions[Math.floor(Math.random() * conditions.length)]

        const weatherData: WeatherData = {
          location: loc,
          temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
          condition,
          icon: getWeatherIcon(condition),
          humidity: Math.floor(Math.random() * 60) + 30, // 30-90%
          windSpeed: Math.floor(Math.random() * 20) + 1, // 1-20 km/h
          lastUpdated: new Date().toISOString(),
        }

        setWeather(weatherData)
        setLocation(loc)
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch weather data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [setLocation, setWeather, isOnline],
  )

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
        return "sun"
      case "partly cloudy":
      case "cloudy":
        return "cloud"
      case "rain":
        return "cloud-rain"
      case "snow":
        return "cloud-snow"
      case "windy":
        return "wind"
      default:
        return "cloud"
    }
  }

  const renderWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case "sun":
        return <Sun className="h-10 w-10 text-yellow-400" />
      case "cloud":
        return <Cloud className="h-10 w-10 text-gray-400" />
      case "cloud-rain":
        return <CloudRain className="h-10 w-10 text-blue-400" />
      case "cloud-snow":
        return <CloudSnow className="h-10 w-10 text-blue-200" />
      case "wind":
        return <Wind className="h-10 w-10 text-gray-400" />
      default:
        return <Cloud className="h-10 w-10 text-gray-400" />
    }
  }

  useEffect(() => {
    // If we have a saved location but no weather data (or it's old), fetch it
    if (location && (!weather || new Date(weather.lastUpdated).getTime() < Date.now() - 3600000)) {
      fetchWeather(location)
    }
  }, [location, weather, fetchWeather])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (searchQuery.trim()) {
        fetchWeather(searchQuery)
        setIsSearching(false)
      }
    },
    [fetchWeather, searchQuery],
  )

  const handleGetLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoading(true)
      setError(null)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would use the coordinates to get the location name
          // For this demo, we'll just use the coordinates
          const lat = position.coords.latitude.toFixed(2)
          const lon = position.coords.longitude.toFixed(2)
          fetchWeather(`${lat}, ${lon}`)
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("Failed to get your location. Please try searching instead.")
          setIsLoading(false)
        },
      )
    } else {
      setError("Geolocation is not supported by your browser. Please try searching instead.")
    }
  }, [fetchWeather])

  const handleRefresh = useCallback(() => {
    if (location) {
      fetchWeather(location)
    }
  }, [fetchWeather, location])

  if (!weather && !isSearching) {
    return (
      <Card className="bg-background/40 backdrop-blur-sm border-muted">
        <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
          {error && <div className="text-red-400 text-sm text-center mb-2">{error}</div>}
          <p className="text-muted-foreground text-center">Set your location to see the weather</p>
          <Button variant="outline" className="bg-background/60" onClick={() => setIsSearching(true)}>
            <Search className="h-4 w-4 mr-2" />
            Set Location
          </Button>
          <Button
            variant="outline"
            className="bg-background/60"
            onClick={handleGetLocation}
            disabled={isLoading || !isOnline}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
            Use My Location
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isSearching) {
    return (
      <Card className="bg-background/40 backdrop-blur-sm border-muted">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter city or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background/60"
                autoFocus
              />
              <Button type="submit" disabled={isLoading || !isOnline}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {!isOnline && (
              <div className="text-amber-400 text-sm">You are offline. Weather data cannot be updated.</div>
            )}
            <Button type="button" variant="ghost" onClick={() => setIsSearching(false)} className="self-start">
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-background/40 backdrop-blur-sm border-muted overflow-hidden">
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : weather ? (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground">{weather.location}</h3>
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">{weather.temperature}°C</p>
              <p className="text-muted-foreground">{weather.condition}</p>
            </div>

            <div className="flex-1 flex flex-col items-center">{renderWeatherIcon(weather.icon)}</div>

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Humidity</span>
                <span className="text-foreground">{weather.humidity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wind</span>
                <span className="text-foreground">{weather.windSpeed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground">
                  {new Date(weather.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="self-end mt-2"
                onClick={handleRefresh}
                disabled={isLoading || !isOnline}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        ) : null}

        {error && <div className="text-red-400 text-sm text-center mt-4">{error}</div>}
        {!isOnline && (
          <div className="text-amber-400 text-sm text-center mt-4">
            You are offline. Weather data cannot be updated.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(WeatherWidget)
