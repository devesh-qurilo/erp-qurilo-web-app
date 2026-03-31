"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, FileImage, Award } from "lucide-react"

export default function EditAwardPage() {
  const params = useParams()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const awardId = params.id

  // ✅ Fetch existing award details
  useEffect(() => {
    async function fetchAward() {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) throw new Error("Access token not found")

        const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards/${awardId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to fetch award details")

        const award = await res.json()
        setTitle(award.title)
        setSummary(award.summary)
        if (award.iconUrl) setPreview(award.iconUrl)
      } catch (err: any) {
        setError(err.message || "An error occurred while loading the award")
      }
    }

    if (awardId) fetchAward()
  }, [awardId])

  // ✅ Handle update award
  const handleUpdate = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) throw new Error("Access token not found")

      const formData = new FormData()
      formData.append("title", title)
      formData.append("summary", summary)
      if (iconFile) formData.append("iconFile", iconFile)

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards/${awardId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update award")
      }

      router.push("/hr/awards")
    } catch (err: any) {
      setError(err.message)
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
            Edit Award
          </CardTitle>
          <CardDescription>Update the award details or replace the icon.</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-md border border-red-200">
              {error}
            </p>
          )}

          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                type="text"
                placeholder="Enter award title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              />
            </div>

            {/* Icon Upload */}
            <div className="space-y-2">
              <Label>Upload Icon (optional)</Label>
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
                  <p className="text-sm text-muted-foreground mb-1">Current Icon:</p>
                  <img
                    src={preview}
                    alt="Award Icon Preview"
                    className="h-20 w-20 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* Update Button */}
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Award"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
