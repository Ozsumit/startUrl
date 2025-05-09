"use client"

import { useEffect, useState, useCallback, memo } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import type { Website, VisitHistory } from "@/types/website"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useVisitTracker } from "@/hooks/use-visit-tracker"

const FrequentlyVisited = () => {
  const [frequentSites, setFrequentSites] = useState<Website[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [visitHistory] = useLocalStorage<VisitHistory>("visitHistory", {})
  const [websites] = useLocalStorage<Website[]>("websites", [])
  const { trackVisit } = useVisitTracker()

  // This function gets frequently visited sites
  useEffect(() => {
    const loadSites = () => {
      // Combine custom websites with visit history
      const allSites: Website[] = [...websites]

      // Add any sites from visit history that aren't in websites
      Object.entries(visitHistory).forEach(([id, data]) => {
        if (!allSites.some((site) => site.id === id)) {
          // This is a built-in site that was visited
          const mockSites: Record<string, Partial<Website>> = {
            google: {
              title: "Google",
              url: "https://www.google.com",
              favicon: "https://www.google.com/favicon.ico",
              description: "Search engine",
            },
            github: {
              title: "GitHub",
              url: "https://github.com",
              favicon: "https://github.com/favicon.ico",
              description: "Code hosting platform",
            },
            vercel: {
              title: "Vercel",
              url: "https://vercel.com",
              favicon: "https://vercel.com/favicon.ico",
              description: "Deployment platform",
            },
            nextjs: {
              title: "Next.js",
              url: "https://nextjs.org",
              favicon: "https://nextjs.org/favicon.ico",
              description: "React framework",
            },
          }

          if (mockSites[id]) {
            allSites.push({
              id,
              title: mockSites[id].title || id,
              url: mockSites[id].url || `https://${id}.com`,
              favicon: mockSites[id].favicon || null,
              description: mockSites[id].description || "",
              themeColor: "",
              visitCount: data.count,
              lastVisited: data.lastVisited,
            })
          }
        } else {
          // Update the visit count and last visited time for existing sites
          const siteIndex = allSites.findIndex((site) => site.id === id)
          if (siteIndex !== -1) {
            allSites[siteIndex] = {
              ...allSites[siteIndex],
              visitCount: data.count,
              lastVisited: data.lastVisited,
            }
          }
        }
      })

      // Sort by visit count (most visited first)
      const sortedSites = [...allSites]
        .filter((site) => site.visitCount > 0) // Only include sites that have been visited
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 10) // Limit to 10 most frequent

      setFrequentSites(sortedSites)
      setIsLoading(false)
    }

    loadSites()
  }, [visitHistory, websites])

  const handleVisit = useCallback(
    (site: Website) => {
      trackVisit(site)
      window.location.href = site.url
    },
    [trackVisit],
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (frequentSites.length === 0) {
    return (
      <div className="grid place-items-center p-8 bg-background/40 backdrop-blur-md rounded-lg">
        <p className="text-muted-foreground text-center">
          No frequently visited sites yet. Start browsing to see them here!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {frequentSites.map((site) => (
        <SiteCard key={site.id} site={site} onVisit={handleVisit} />
      ))}
    </div>
  )
}

const SiteCard = memo(({ site, onVisit }: { site: Website; onVisit: (site: Website) => void }) => {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className="bg-background/40 hover:bg-background/60 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105"
      onClick={() => onVisit(site)}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-background/50 flex items-center justify-center">
        {site.favicon && !imageError ? (
          <Image
            src={site.favicon || "/placeholder.svg"}
            alt={`${site.title} favicon`}
            width={48}
            height={48}
            className="object-contain p-1"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="w-full h-full grid place-items-center text-primary font-bold text-lg"
            style={{
              backgroundColor: site.themeColor || "var(--primary-foreground)",
            }}
          >
            {site.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <span className="text-sm font-medium text-foreground text-center truncate w-full">{site.title}</span>

      <span className="text-xs text-muted-foreground">Visited {site.visitCount} times</span>
    </div>
  )
})

SiteCard.displayName = "SiteCard"

const LoadingSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-background/40 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-3" />
      </div>
    ))}
  </div>
)

export default memo(FrequentlyVisited)
