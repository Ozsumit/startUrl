"use client"

import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "bg-background border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-full",
            toast.variant === "destructive" && "border-destructive bg-destructive/10",
          )}
        >
          <div className="flex-1">
            <h4 className={cn("font-medium text-sm", toast.variant === "destructive" && "text-destructive")}>
              {toast.title}
            </h4>
            {toast.description && <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>}
          </div>
          <button onClick={() => dismiss(toast.id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
