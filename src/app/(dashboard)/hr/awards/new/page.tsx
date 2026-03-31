"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, Award, Loader2, FileImage } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AwardPage() {
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreateAward = async () => {
    if (!title || !summary || !iconFile) {
      alert("Please fill all fields and upload an icon.")
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) throw new Error("No access token found")

      const formData = new FormData()
      formData.append("title", title)
      formData.append("summary", summary)
      formData.append("iconFile", iconFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()
      setResponse(data)

      if (!res.ok) throw new Error(data.message || "Failed to create award")

      // Reset form on success
      setTitle("")
      setSummary("")
      setIconFile(null)
      setPreview(null)
      alert("Award created successfully!")
      router.push(`/hr/awards`);
    } catch (err: any) {
      setResponse({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Create New Award
          </CardTitle>
          <CardDescription>Define a new award with title, summary, and an icon image.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                type="text"
                placeholder="Enter award title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                placeholder="Short description of this award"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Icon</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setIconFile(file)
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setPreview(url)
                    }
                  }}
                />
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>

              {preview && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                  <img
                    src={preview}
                    alt="Icon Preview"
                    className="h-20 w-20 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              className="w-full mt-4"
              onClick={handleCreateAward}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Award"
              )}
            </Button>


          </div>
        </CardContent>
      </Card>
    </div>
  )
}
