"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, FileText, Clock, User, Plus, Download } from "lucide-react"
import Link from "next/link"

interface Document {
  id: number
  filename: string
  url: string
  mimeType: string
  size: number
  uploadedAt: string
  uploadedBy: string
}

export default function ClientDocumentsPage() {
  const { id } = useParams()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchDocuments = async () => {
    if (!id) return

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/clients/${id}/documents`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch documents")

      const data = await res.json()
      setDocuments(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (docId: number) => {
    if (!id) return;

    const confirmed = confirm("Are you sure you want to delete this document?");
    if (!confirmed) return;

    // Optimistically remove document from UI
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/clients/${id}/documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          "Document-Id": docId.toString(),
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete document");
      }

      //console.log("Document deleted successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      alert(message);
      // Revert UI if delete fails
      await fetchDocuments();
    }
  };


  useEffect(() => {
    fetchDocuments()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading documents...</p>
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

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No documents found for this client</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Documents</h2>
        <Button asChild>
          <Link href={`/clients/${id}/documents/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="border-border bg-card hover:bg-card/80 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg font-semibold leading-tight">{doc.filename}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  >
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </a>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{doc.mimeType}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{doc.uploadedBy}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(doc.uploadedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
