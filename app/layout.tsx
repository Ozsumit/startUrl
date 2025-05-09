import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Safari Start Page",
  description: "A custom aesthetic start page for Safari with dynamic features",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Safari Start Page",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>{children}</body>
    </html>
  )
}
