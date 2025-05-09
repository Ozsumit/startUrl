"use client"

import { useState, useCallback } from "react"
import { z } from "zod"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Website } from "@/types/website"

interface EditWebsiteModalProps {
  isOpen: boolean
  onClose: () => void
  website: Website
  onSave: (website: Partial<Website>) => void
}

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  url: z.string().min(1, { message: "URL is required" }),
  favicon: z.string().nullable(),
})

export default function EditWebsiteModal({ isOpen, onClose, website, onSave }: EditWebsiteModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: website.title,
      url: website.url,
      favicon: website.favicon,
    },
  })

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

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

      // If URL has changed, fetch new metadata
      if (urlWithProtocol !== website.url) {
        try {
          const response = await fetch(`/api/metadata?url=${encodeURIComponent(urlWithProtocol)}`)

          if (response.ok) {
            const data = await response.json()

            onSave({
              url: data.url || urlWithProtocol,
              title: values.title !== website.title ? values.title : data.title,
              favicon: data.favicon || null,
              description: data.description || "",
              themeColor: data.themeColor || "",
            })
          } else {
            // If metadata fetch fails, just update with user values
            onSave({
              url: urlWithProtocol,
              title: values.title,
              favicon: values.favicon,
            })
          }
        } catch (error) {
          // If fetch fails, just update with user values
          onSave({
            url: urlWithProtocol,
            title: values.title,
            favicon: values.favicon,
          })
        }
      } else {
        // If URL hasn't changed, just update the title
        onSave({
          title: values.title,
          favicon: values.favicon,
        })
      }
    } catch (error) {
      console.error("Error updating website:", error)

      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Website</DialogTitle>
          <DialogDescription>Edit the details of this website.</DialogDescription>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Website" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="favicon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favicon URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/favicon.ico"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Changes
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
