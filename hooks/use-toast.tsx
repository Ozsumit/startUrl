"use client"

import { useState } from "react"

type ToastVariant = "default" | "destructive"

interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  // Function to add a toast
  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id)
    }, 5000)

    return id
  }

  // Function to dismiss a toast
  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return { toast, dismiss, toasts }
}
