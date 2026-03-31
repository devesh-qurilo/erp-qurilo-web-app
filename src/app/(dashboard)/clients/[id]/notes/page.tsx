
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, FileText, Clock, User, Plus } from "lucide-react"
import Link from "next/link"

interface Note {
  id: number
  clientId: number
  title: string
  detail: string
  type: string
  createdBy: string
  createdAt: string
}

export default function ClientNotesPage() {
  const { id } = useParams()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchNotes = async () => {
    if (!id) return

    setLoading(true)
    try {
      const res = await fetch(`{process.env.NEXT_PUBLIC_MAIN}/clients/${id}/notes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch notes")

      const data = await res.json()
      setNotes(data)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId: number) => {
    if (!id) return

    try {
      const res = await fetch(`{process.env.NEXT_PUBLIC_MAIN}/clients/${id}/notes`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Note-Id": noteId.toString(),
        },
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete note")
      }

      // Remove note from state
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
    } catch (err: any) {
      alert(err.message || "Something went wrong")
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (


      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No notes found for this client</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Notes</h2>
        <Button asChild>
          <Link href={`/clients/${id}/notes/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Link>
        </Button>
      </div>
      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="border-border bg-card hover:bg-card/80 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg font-semibold leading-tight text-balance">{note.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(note.id)}
                  className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete note</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-foreground/90">{note.detail}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="font-mono">{note.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{note.createdBy}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
