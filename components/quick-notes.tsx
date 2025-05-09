"use client"

import { useState, useCallback, memo, useEffect } from "react"
import { format } from "date-fns" // Importing format from date-fns
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Save, Trash2, Edit, X, Clock, Calendar } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { AnimatePresence, motion } from "framer-motion"  
import { useTheme } from "@/components/theme-provider"


interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  color?: string // Added optional color property
}


function QuickNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>("quick-notes", [])
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const { themeColors } = useTheme()
  const [noteColors, setNoteColors] = useState<string[]>([])


  const handleAddNote = useCallback(() => {
    if (newNote.trim()) {
      const now = new Date().toISOString()
      const note: Note = {
        id: uuidv4(),
        content: newNote,
        createdAt: now,
        updatedAt: now,
      }
      setNotes((prev) => [note, ...prev])
      setNewNote("")
      setIsAddingNote(false)
    }
  }, [newNote, setNotes])
useEffect(() => {
    const shadeColor = (color: string, percent: number): string => {
      const num = parseInt(color.replace("#", ""), 16)
      const amt = Math.round(2.55 * percent)
      const R = (num >> 16) + amt
      const G = ((num >> 8) & 0x00ff) + amt
      const B = (num & 0x0000ff) + amt
      return (
        "#" +
        (
          0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
      )
    }

    const generateColors = () => {
      const colors = [
        themeColors.primary,
        themeColors.secondary,
        shadeColor(themeColors.primary, 20),
        shadeColor(themeColors.secondary, 20),
        shadeColor(themeColors.primary, -20),
        shadeColor(themeColors.secondary, -20),
      ]
      setNoteColors(colors)
    }

    generateColors()
  }, [themeColors])

  const handleDeleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((note) => note.id !== id))
    },
    [setNotes],
  )

  const startEditingNote = useCallback((note: Note) => {
    setEditingNote(note.id)
    setEditContent(note.content)
  }, [])

  const saveEditedNote = useCallback(
    (id: string) => {
      if (editContent.trim()) {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === id ? { ...note, content: editContent, updatedAt: new Date().toISOString() } : note,
          ),
        )
        setEditingNote(null)
        setEditContent("")
      }
    },
    [editContent, setNotes],
  )

  const cancelEditing = useCallback(() => {
    setEditingNote(null)
    setEditContent("")
  }, [])

  return (
    <div className="space-y-4">
      

      {notes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                layout
                className="h-full"
              >
                <Card
                  className="bg-background/40 backdrop-blur-sm border-muted h-full shadow-md hover:shadow-lg transition-all overflow-hidden"
                  style={{
                    borderTop: `3px solid ${note.color || themeColors.primary}`,
                  }}
                >
                  <CardHeader className="pb-2 relative">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                    <CardTitle className="text-sm flex justify-between items-center">
                      <div className="flex items-center text-muted-foreground text-xs gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(note.updatedAt), "h:mm a")}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                          onClick={() => startEditingNote(note)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingNote === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[120px] bg-background/60 resize-none focus:ring-2 focus:ring-primary/50 transition-all"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={() => saveEditedNote(note.id)}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">{note.content}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid place-items-center p-8 bg-background/40 backdrop-blur-md rounded-lg">
          <p className="text-muted-foreground text-center">No notes yet. Click 'Add Note' to create one!</p>
        </div>
      )} <AnimatePresence mode="wait">
      {isAddingNote ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          key="add-note-form"
        >
          <Card className="bg-background/40 backdrop-blur-sm border-muted shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>New Note</span>
                <Button variant="ghost" size="icon" onClick={() => setIsAddingNote(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your note here..."
                className="min-h-[120px] bg-background/60 text-foreground resize-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                autoFocus
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} className="bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          key="add-note-button"
        >
          <Button
            variant="outline"
            className="w-full bg-background/40 backdrop-blur-sm hover:bg-background/60 border-dashed border-2 h-12 transition-all hover:scale-[1.01]"
            onClick={() => setIsAddingNote(true)}
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Note
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  )
}

export default memo(QuickNotes)
