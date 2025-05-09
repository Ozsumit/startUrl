"use client"

import type React from "react"
import { useState, memo, useCallback } from "react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import type { Website } from "@/types/website"
import ContextMenu from "@/components/context-menu"
import EditWebsiteModal from "@/components/edit-website-modal"

interface WebsiteGridProps {
  websites: Website[]
  onRemove: (id: string) => void
  onEdit: (id: string, updatedWebsite: Partial<Website>) => void
}

const WebsiteCard = memo(
  ({
    website,
    onRemove,
    onEdit,
    onClick,
  }: {
    website: Website
    onRemove: (id: string) => void
    onEdit: (id: string, updatedWebsite: Partial<Website>) => void
    onClick: (url: string) => void
  }) => {
    const [imageError, setImageError] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const { toast } = useToast()

    const handleImageError = () => {
      setImageError(true)
    }

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY })
    }

    const handleCloseContextMenu = () => {
      setContextMenu(null)
    }

    const handleRemove = () => {
      onRemove(website.id)
      handleCloseContextMenu()
      toast({
        title: "Website removed",
        description: `${website.title} has been removed from your start page`,
      })
    }

    const handleEdit = () => {
      setIsEditModalOpen(true)
      handleCloseContextMenu()
    }

    const handleOpenInNewTab = () => {
      window.open(website.url, "_blank")
      handleCloseContextMenu()
    }

    const handleCopyUrl = () => {
      navigator.clipboard.writeText(website.url)
      handleCloseContextMenu()
      toast({
        title: "URL copied",
        description: "Website URL has been copied to clipboard",
      })
    }

    const handleSaveEdit = (updatedWebsite: Partial<Website>) => {
      onEdit(website.id, updatedWebsite)
      setIsEditModalOpen(false)
      toast({
        title: "Website updated",
        description: "Your changes have been saved",
      })
    }

    return (
      <>
        <div
          className="group relative bg-card/20 hover:bg-card/40 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105"
          onClick={() => onClick(website.url)}
          onContextMenu={handleContextMenu}
        >
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-transparent flex items-center justify-center">
            {website.favicon && !imageError ? (
              <Image
                src={website.favicon || "/placeholder.svg"}
                alt={`${website.title} favicon`}
                width={48}
                height={48}
                className="object-contain p-1"
                onError={handleImageError}
                priority
              />
            ) : (
              <div className="w-full h-full grid place-items-center bg-primary-foreground text-primary font-bold text-lg">
                {website.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <span className="text-sm font-medium text-foreground text-center truncate w-full">{website.title}</span>
        </div>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={handleCloseContextMenu}
            onEdit={handleEdit}
            onRemove={handleRemove}
            onOpenInNewTab={handleOpenInNewTab}
            onCopyUrl={handleCopyUrl}
          />
        )}

        {isEditModalOpen && (
          <EditWebsiteModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            website={website}
            onSave={handleSaveEdit}
          />
        )}
      </>
    )
  },
)

WebsiteCard.displayName = "WebsiteCard"

function WebsiteGrid({ websites, onRemove, onEdit }: WebsiteGridProps) {
  const handleClick = useCallback((url: string) => {
    window.location.href = url
  }, [])

  if (websites.length === 0) {
    return (
      <div className="grid place-items-center p-8 bg-card/40 backdrop-blur-md rounded-lg">
        <p className="text-muted-foreground text-center">
          No websites added yet. Click &apos;Add Website&apos; to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {websites.map((website) => (
        <WebsiteCard key={website.id} website={website} onRemove={onRemove} onEdit={onEdit} onClick={handleClick} />
      ))}
    </div>
  )
}

export default memo(WebsiteGrid)
