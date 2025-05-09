"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Edit, Trash2, ExternalLink, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onEdit?: () => void
  onRemove?: () => void
  onOpenInNewTab?: () => void
  onCopyUrl?: () => void
}

export default function ContextMenu({ x, y, onClose, onEdit, onRemove, onOpenInNewTab, onCopyUrl }: ContextMenuProps) {
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Adjust position to ensure menu stays within viewport
  const [position, setPosition] = useState({ x, y })

  useEffect(() => {
    setMounted(true)

    // Adjust position if needed
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      // Check if menu goes beyond right edge
      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 10
      }

      // Check if menu goes beyond bottom edge
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 10
      }

      setPosition({ x: adjustedX, y: adjustedY })
    }

    // Add event listener to close menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [x, y, onClose])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu fixed z-50 min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ top: position.y, left: position.x }}
    >
      <div className="flex flex-col space-y-1">
        {onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </ContextMenuItem>
        )}
        {onOpenInNewTab && (
          <ContextMenuItem onClick={onOpenInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Open in New Tab</span>
          </ContextMenuItem>
        )}
        {onCopyUrl && (
          <ContextMenuItem onClick={onCopyUrl}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy URL</span>
          </ContextMenuItem>
        )}
        {onRemove && (
          <ContextMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Remove</span>
          </ContextMenuItem>
        )}
      </div>
    </div>,
    document.body,
  )
}

function ContextMenuItem({
  className,
  children,
  onClick,
}: {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      {children}
    </button>
  )
}
