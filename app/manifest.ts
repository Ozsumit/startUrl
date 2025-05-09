import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Safari Start Page",
    short_name: "Start Page",
    description: "A custom aesthetic start page for Safari with offline support",
    start_url: "/",
    display: "standalone",
    background_color: "#1e293b",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
