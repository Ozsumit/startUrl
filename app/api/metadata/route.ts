import { type NextRequest, NextResponse } from "next/server"
import { parse } from "node-html-parser"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    // Create a proper URL object to validate and normalize the URL
    const targetUrl = new URL(url)

    // Fetch the HTML of the target website
    const response = await fetch(targetUrl.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`)
    }

    const html = await response.text()
    const root = parse(html)

    // Extract title
    let title = root.querySelector("title")?.text || ""
    if (!title) {
      // Try Open Graph title
      title = root.querySelector('meta[property="og:title"]')?.getAttribute("content") || ""
    }

    if (!title) {
      title = targetUrl.hostname
    }

    // Find all possible icon links
    const iconLinks = [
      // Apple Touch Icons (highest quality)
      ...Array.from(root.querySelectorAll('link[rel="apple-touch-icon"]')),
      ...Array.from(root.querySelectorAll('link[rel="apple-touch-icon-precomposed"]')),

      // High-res icons
      ...Array.from(root.querySelectorAll('link[rel="icon"][sizes="192x192"]')),
      ...Array.from(root.querySelectorAll('link[rel="icon"][sizes="128x128"]')),
      ...Array.from(root.querySelectorAll('link[rel="icon"][sizes="96x96"]')),

      // Standard favicons
      ...Array.from(root.querySelectorAll('link[rel="shortcut icon"]')),
      ...Array.from(root.querySelectorAll('link[rel="icon"]')),
    ]

    // Sort icons by size (prefer larger icons)
    const sortedIcons = iconLinks.sort((a, b) => {
      const aSize = a.getAttribute("sizes")
      const bSize = b.getAttribute("sizes")

      if (!aSize) return 1
      if (!bSize) return -1

      const [aWidth] = aSize.split("x").map(Number)
      const [bWidth] = bSize.split("x").map(Number)

      return bWidth - aWidth
    })

    // Get the best icon
    let favicon = null
    if (sortedIcons.length > 0) {
      const href = sortedIcons[0].getAttribute("href")
      if (href) {
        favicon = href.startsWith("http") ? href : new URL(href, targetUrl.origin).href
      }
    }

    // Fallback to Open Graph image
    if (!favicon) {
      const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute("content")
      if (ogImage) {
        favicon = ogImage.startsWith("http") ? ogImage : new URL(ogImage, targetUrl.origin).href
      }
    }

    // Last resort: try default favicon location
    if (!favicon) {
      favicon = new URL("/favicon.ico", targetUrl.origin).href
    }

    // Extract description
    let description = root.querySelector('meta[name="description"]')?.getAttribute("content") || ""
    if (!description) {
      description = root.querySelector('meta[property="og:description"]')?.getAttribute("content") || ""
    }

    // Extract theme color
    const themeColor = root.querySelector('meta[name="theme-color"]')?.getAttribute("content") || ""

    return NextResponse.json({
      title,
      favicon,
      description,
      themeColor,
      url: targetUrl.href,
    })
  } catch (error) {
    console.error("Error fetching metadata:", error)
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 })
  }
}
