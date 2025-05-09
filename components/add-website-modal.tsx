"use client"

import { useState, useCallback } from "react"
import { z } from "zod"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Website } from "@/types/website"

interface AddWebsiteModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (website: Website) => void
}

const formSchema = z.object({
  url: z.string().min(1, { message: "URL is required" }),
})

export default function AddWebsiteModal({ isOpen, onClose, onAdd }: AddWebsiteModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  })

  const resetForm = useCallback(() => {
    form.reset()
    setError(null)
  }, [form])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create a complete URL (with protocol)
      let urlWithProtocol = values.url.trim()

      // Add https:// if no protocol is specified
      if (!urlWithProtocol.startsWith("http://") && !urlWithProtocol.startsWith("https://")) {
        urlWithProtocol = `https://${urlWithProtocol}`
      }

      // Validate URL
      try {
        new URL(urlWithProtocol)
      } catch (e) {
        throw new Error("Invalid URL format")
      }

      // Fetch metadata
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(urlWithProtocol)}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`)
      }

      const data = await response.json()

      // Create website object
      const website: Website = {
        id: uuidv4(),
        url: data.url || urlWithProtocol,
        title: data.title || new URL(urlWithProtocol).hostname,
        favicon: data.favicon || null,
        description: data.description || "",
        themeColor: data.themeColor || "",
        visitCount: 0,
        lastVisited: new Date().toISOString(),
      }

      onAdd(website)
      resetForm()
    } catch (error) {
      console.error("Error adding website:", error)

      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred")
      }

      // If we can't fetch metadata, try to create a basic website object
      if (error instanceof Error && error.message.includes("fetch metadata")) {
        try {
          const url = new URL(values.url.startsWith("http") ? values.url : `https://${values.url}`)
          const website: Website = {
            id: uuidv4(),
            url: url.href,
            title: url.hostname,
            favicon: null,
            description: "",
            themeColor: "",
            visitCount: 0,
            lastVisited: new Date().toISOString(),
          }
          onAdd(website)
          resetForm()
        } catch (e) {
          // If we can't even create a basic website object, show the error
          form.setError("url", {
            message: "Unable to process this URL",
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Website</DialogTitle>
          <DialogDescription>Enter a website URL to add it to your start page.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example.com"
                      {...field}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          handleClose()
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Add Website
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
