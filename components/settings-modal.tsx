"use client"

import { type ChangeEvent, useState, useCallback, memo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ImageOffIcon as ImagesOff, Upload, Download, AlertTriangle } from "lucide-react"
import type { SectionVisibility, ThemeColors } from "@/types/website"
import { useToast } from "@/hooks/use-toast"
import { storeInIndexedDB, getFromIndexedDB } from "@/hooks/use-storage"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  wallpaper: string
  setWallpaper: (wallpaper: string) => void
  wallpaperOpacity: number
  setWallpaperOpacity: (opacity: number) => void
  clockFormat: string
  setClockFormat: (format: string) => void
  sectionVisibility: SectionVisibility
  setSectionVisibility: (visibility: SectionVisibility) => void
  themeColors: ThemeColors
  setThemeColors: (colors: ThemeColors) => void
}

function SettingsModal({
  isOpen,
  onClose,
  wallpaper,
  setWallpaper,
  wallpaperOpacity,
  setWallpaperOpacity,
  clockFormat,
  setClockFormat,
  sectionVisibility,
  setSectionVisibility,
  themeColors,
  setThemeColors,
}: SettingsModalProps) {
  const [imageError, setImageError] = useState(false)
  const [activeTab, setActiveTab] = useState("appearance")
  const [storageWarning, setStorageWarning] = useState(false)
  const { toast } = useToast()

  // Check if we're using a large wallpaper
  useEffect(() => {
    if (wallpaper && wallpaper.length > 500000) {
      // ~500KB
      setStorageWarning(true)
    } else {
      setStorageWarning(false)
    }
  }, [wallpaper])

  const handleWallpaperUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        })
        return
      }

      try {
        // Check file size
        if (file.size > 2 * 1024 * 1024) {
          // 2MB
          toast({
            title: "File too large",
            description: "Please use an image smaller than 2MB or use a URL instead",
            variant: "destructive",
          })
          return
        }

        const reader = new FileReader()
        reader.onload = async (event) => {
          if (event.target?.result) {
            const imageData = event.target.result as string

            try {
              // Try to store in IndexedDB first
              const stored = await storeInIndexedDB("wallpaper", imageData)

              if (stored) {
                // If successful, just store a reference in localStorage
                setWallpaper("indexeddb:wallpaper")
                setImageError(false)
                toast({
                  title: "Wallpaper updated",
                  description: "Your new wallpaper has been applied",
                })
              } else {
                // Fall back to localStorage if IndexedDB fails
                // But check size first
                if (imageData.length > 500000) {
                  // ~500KB
                  toast({
                    title: "Image too large",
                    description: "Please use a smaller image or a URL instead",
                    variant: "destructive",
                  })
                  return
                }

                setWallpaper(imageData)
                setImageError(false)
                toast({
                  title: "Wallpaper updated",
                  description: "Your new wallpaper has been applied",
                })
              }
            } catch (error) {
              console.error("Error storing wallpaper:", error)
              toast({
                title: "Error saving wallpaper",
                description: "Please try a smaller image or use a URL instead",
                variant: "destructive",
              })
            }
          }
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error("Error processing wallpaper:", error)
        toast({
          title: "Error processing image",
          description: "Please try another image",
          variant: "destructive",
        })
      }
    },
    [setWallpaper, toast],
  )

  const handleUrlWallpaper = useCallback(
    (url: string) => {
      if (!url) {
        setWallpaper("")
        return
      }
      // For URLs, we just store the URL string which is much smaller
      setWallpaper(url)
      setStorageWarning(false)
    },
    [setWallpaper],
  )

  const handleOpacityChange = useCallback(
    (value: number[]) => {
      setWallpaperOpacity(value[0])
    },
    [setWallpaperOpacity],
  )

  const handleClearWallpaper = useCallback(() => {
    setWallpaper("")
    setImageError(false)
    setStorageWarning(false)
    // Also clear from IndexedDB
    storeInIndexedDB("wallpaper", null).catch(console.error)

    toast({
      title: "Wallpaper removed",
      description: "Your wallpaper has been cleared",
    })
  }, [setWallpaper, toast])

  const toggleSection = useCallback(
    (section: keyof SectionVisibility) => {
      setSectionVisibility({
        ...sectionVisibility,
        [section]: !sectionVisibility[section],
      })
    },
    [sectionVisibility, setSectionVisibility],
  )

  const handleColorChange = useCallback(
    (colorType: keyof ThemeColors, value: string) => {
      setThemeColors({
        ...themeColors,
        [colorType]: value,
      })
    },
    [themeColors, setThemeColors],
  )

  const exportSettings = useCallback(() => {
    try {
      // Collect settings but exclude large items
      const settings: Record<string, any> = {}

      // Safely get items from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            // Skip wallpaper if it's a data URL (too large)
            if (key === "wallpaper") {
              const wallpaperValue = localStorage.getItem(key)
              if (wallpaperValue && wallpaperValue.startsWith("data:image")) {
                // Store a placeholder instead
                settings[key] = "[IMAGE DATA EXCLUDED - TOO LARGE]"
                continue
              }
            }

            settings[key] = JSON.parse(localStorage.getItem(key) || "null")
          } catch {
            settings[key] = localStorage.getItem(key)
          }
        }
      }

      // Create a download link
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2))
      const downloadAnchorNode = document.createElement("a")
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", "safari-start-page-settings.json")
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()

      toast({
        title: "Settings exported",
        description: "Your settings have been exported to a JSON file",
      })
    } catch (error) {
      console.error("Error exporting settings:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your settings",
        variant: "destructive",
      })
    }
  }, [toast])

  const importSettings = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const settings = JSON.parse(event.target?.result as string)

          // Apply settings to localStorage, but be careful with large items
          Object.entries(settings).forEach(([key, value]) => {
            // Skip placeholders for large data
            if (value === "[IMAGE DATA EXCLUDED - TOO LARGE]") {
              return
            }

            try {
              localStorage.setItem(key, JSON.stringify(value))
            } catch (error) {
              console.error(`Error importing setting ${key}:`, error)
            }
          })

          toast({
            title: "Settings imported",
            description: "Your settings have been imported. Refreshing page...",
          })

          // Refresh the page to apply settings
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        } catch (error) {
          console.error("Error importing settings:", error)
          toast({
            title: "Import failed",
            description: "There was an error importing your settings",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }

    input.click()
  }, [toast])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>

                  <div className="text-md text-muted-foreground mt-auto pt-4 pb-8 z-10 relative">
                   Made my vassh&copy;
                  </div>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your start page experience</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Theme Colors</h3>
                <p className="text-sm text-muted-foreground">Customize the colors of your start page</p>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: themeColors.primary }} />
                    <Input
                      id="primary-color"
                      type="color"
                      value={themeColors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={themeColors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: themeColors.secondary }} />
                    <Input
                      id="secondary-color"
                      type="color"
                      value={themeColors.secondary}
                      onChange={(e) => handleColorChange("secondary", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={themeColors.secondary}
                      onChange={(e) => handleColorChange("secondary", e.target.value)}
                      className="flex-1"
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setThemeColors({
                        primary: "#3b82f6", // Default blue
                        secondary: "#10b981", // Default green
                      })
                    }}
                  >
                    Reset to Default
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setThemeColors({
                        primary: "#f43f5e", // Pink
                        secondary: "#8b5cf6", // Purple
                      })
                    }}
                  >
                    Pink & Purple
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setThemeColors({
                        primary: "#f97316", // Orange
                        secondary: "#06b6d4", // Cyan
                      })
                    }}
                  >
                    Orange & Cyan
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Wallpaper</h3>
                <p className="text-sm text-muted-foreground">Choose a background image for your start page</p>
              </div>

              {storageWarning && (
                <Alert variant="warning" className="bg-amber-950/30 border-amber-700/50">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-200">
                    Large images may cause storage issues. Consider using a URL instead of uploading.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="wallpaper-url">Wallpaper URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wallpaper-url"
                      placeholder="https://example.com/image.jpg"
                      value={
                        wallpaper && !wallpaper.startsWith("data:") && wallpaper !== "indexeddb:wallpaper"
                          ? wallpaper
                          : ""
                      }
                      onChange={(e) => handleUrlWallpaper(e.target.value)}
                      className="flex-1"
                    />
                    {wallpaper && (
                      <Button variant="destructive" size="icon" onClick={handleClearWallpaper}>
                        <ImagesOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="wallpaper-upload">Or upload an image (max 2MB)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="wallpaper-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleWallpaperUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("wallpaper-upload")?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label>Overlay Darkness</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(wallpaperOpacity * 100)}%</span>
                  </div>
                  <Slider defaultValue={[wallpaperOpacity]} max={1} step={0.01} onValueChange={handleOpacityChange} />
                </div>

                {wallpaper && !imageError && (
                  <div className="aspect-video relative rounded-md overflow-hidden border">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage:
                          wallpaper === "indexeddb:wallpaper"
                            ? "none" // We'll handle this in the component
                            : `url(${wallpaper})`,
                        opacity: 1 - wallpaperOpacity,
                      }}
                    />
                    {wallpaper === "indexeddb:wallpaper" && <IndexedDBImage opacity={1 - wallpaperOpacity} />}
                    <div className="absolute inset-0 bg-black" style={{ opacity: wallpaperOpacity }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-foreground font-medium">Preview</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Visible Sections</h3>
                <p className="text-sm text-muted-foreground">Choose which sections to display on your start page</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-your-websites" className="flex-1">
                    Your Websites
                  </Label>
                  <Switch
                    id="show-your-websites"
                    checked={sectionVisibility.yourWebsites}
                    onCheckedChange={() => toggleSection("yourWebsites")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-frequently-visited" className="flex-1">
                    Frequently Visited
                  </Label>
                  <Switch
                    id="show-frequently-visited"
                    checked={sectionVisibility.frequentlyVisited}
                    onCheckedChange={() => toggleSection("frequentlyVisited")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-recently-visited" className="flex-1">
                    Recently Visited
                  </Label>
                  <Switch
                    id="show-recently-visited"
                    checked={sectionVisibility.recentlyVisited}
                    onCheckedChange={() => toggleSection("recentlyVisited")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-quick-notes" className="flex-1">
                    Quick Notes
                  </Label>
                  <Switch
                    id="show-quick-notes"
                    checked={sectionVisibility.quickNotes}
                    onCheckedChange={() => toggleSection("quickNotes")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-weather" className="flex-1">
                    Weather Widget
                  </Label>
                  <Switch
                    id="show-weather"
                    checked={sectionVisibility.weather}
                    onCheckedChange={() => toggleSection("weather")}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Clock Format</h3>
                <p className="text-sm text-muted-foreground">Choose how the time is displayed on your start page</p>
              </div>

              <RadioGroup value={clockFormat} onValueChange={setClockFormat} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12h" id="12h" />
                  <Label htmlFor="12h">12-hour (AM/PM)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="24h" id="24h" />
                  <Label htmlFor="24h">24-hour</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Offline Mode</h3>
                <p className="text-sm text-muted-foreground">
                  This start page works offline automatically as a Progressive Web App (PWA)
                </p>
              </div>

              <Button variant="outline" onClick={() => alert("This app is already a PWA and works offline!")}>
                Install as App
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Backup & Restore</h3>
                <p className="text-sm text-muted-foreground">Export your settings and data or restore from a backup</p>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={exportSettings}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                <Button variant="outline" onClick={importSettings}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Reset Data</h3>
                <p className="text-sm text-muted-foreground">Clear all your data and reset to default settings</p>
              </div>

              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
                    localStorage.clear()
                    // Also clear IndexedDB
                    indexedDB.deleteDatabase("SafariStartPageDB")

                    toast({
                      title: "Data reset",
                      description: "All data has been cleared. Refreshing page...",
                    })
                    setTimeout(() => {
                      window.location.reload()
                    }, 1500)
                  }
                }}
              >
                Reset All Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Component to display an image from IndexedDB
function IndexedDBImage({ opacity }: { opacity: number }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    const loadImage = async () => {
      try {
        const data = await getFromIndexedDB("wallpaper")
        if (data && typeof data === "string") {
          setImageSrc(data)
        }
      } catch (error) {
        console.error("Error loading image from IndexedDB:", error)
      }
    }

    loadImage()
  }, [])

  if (!imageSrc) return null

  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: `url(${imageSrc})`,
        opacity: opacity,
      }}
    />
  )
}

export default memo(SettingsModal)
